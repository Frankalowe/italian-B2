import React, { useState, useEffect } from 'react';

// Custom lightweight Markdown to HTML parser to avoid React 19 package warnings
function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let html = '';
  let currentParagraph = [];
  
  let inUnorderedList = false;
  let inOrderedList = false;
  let inTable = false;
  
  function flushParagraph() {
    if (currentParagraph.length > 0) {
      html += `<p>${parseInlineStyles(currentParagraph.join(' '))}</p>`;
      currentParagraph = [];
    }
  }
  
  function closeListsAndTables() {
    flushParagraph();
    if (inUnorderedList) {
      html += '</ul>';
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html += '</ol>';
      inOrderedList = false;
    }
    if (inTable) {
      html += '</table>';
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Empty Line - flushes active paragraph/lists
    if (line === '') {
      flushParagraph();
      continue;
    }
    
    // Table Separator Line (e.g. |---|---|)
    if (line.includes('|') && line.includes('---')) {
      continue;
    }
    
    // Table Row
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph();
      if (inUnorderedList) { html += '</ul>'; inUnorderedList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      
      if (!inTable) {
        inTable = true;
        html += '<table>';
      }
      
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
      const isHeader = nextLine.includes('|') && nextLine.includes('---');
      
      html += '<tr>';
      cells.forEach(cell => {
        const parsed = parseInlineStyles(cell);
        html += isHeader ? `<th>${parsed}</th>` : `<td>${parsed}</td>`;
      });
      html += '</tr>';
      continue;
    } else {
      if (inTable) {
        html += '</table>';
        inTable = false;
      }
    }
    
    // Headings
    if (line.startsWith('### ')) {
      closeListsAndTables();
      html += `<h3>${parseInlineStyles(line.slice(4))}</h3>`;
      continue;
    }
    if (line.startsWith('## ')) {
      closeListsAndTables();
      html += `<h2>${parseInlineStyles(line.slice(3))}</h2>`;
      continue;
    }
    if (line.startsWith('# ')) {
      closeListsAndTables();
      html += `<h1>${parseInlineStyles(line.slice(2))}</h1>`;
      continue;
    }
    
    // Unordered Lists (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      flushParagraph();
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      if (!inUnorderedList) {
        inUnorderedList = true;
        html += '<ul>';
      }
      html += `<li>${parseInlineStyles(line.slice(2))}</li>`;
      continue;
    } else {
      if (inUnorderedList) {
        html += '</ul>';
        inUnorderedList = false;
      }
    }
    
    // Ordered Lists (e.g. 1. or 2.) - Render as distinct bolded paragraphs to prevent number reset on intermediate hint paragraphs
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      flushParagraph();
      if (inUnorderedList) { html += '</ul>'; inUnorderedList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      html += `<p style="margin-bottom: 0.5rem;"><strong>${orderedMatch[1]}.</strong> ${parseInlineStyles(orderedMatch[2])}</p>`;
      continue;
    }
    
    // Regular paragraph lines get accumulated (to join single newlines)
    currentParagraph.push(line);
  }
  
  // Final flush
  closeListsAndTables();
  
  return html;
}

function parseInlineStyles(text) {
  // Replace bold **text**
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace italic *text*
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return parsed;
}

// Simple localStorage helpers
const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export default function LessonTree({ syllabus, progress, toggleUnitProgress, setSelectedPrompt, setView }) {
  const [activeLevel, setActiveLevel] = useState(() => lsGet('ita_last_level', 'A1'));
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  const levelData = syllabus[activeLevel];
  
  // Study Guide Generator state
  const [activeTab, setActiveTab] = useState(() => lsGet('ita_last_tab', 'grammar'));
  const [lessonContent, setLessonContent] = useState('');
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonError, setLessonError] = useState('');

  // Editable lesson guide states
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Restore last selected unit on mount (after level data is known)
  useEffect(() => {
    const savedUnitId = lsGet('ita_last_unit_id', null);
    if (savedUnitId && levelData?.units) {
      const found = levelData.units.find(u => u.id === savedUnitId);
      if (found) setSelectedUnit(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset states and check cache when selected unit or active tab changes
  useEffect(() => {
    setLessonContent('');
    setEditedContent('');
    setIsEditing(false);
    setLessonError('');
    if (!selectedUnit) return;

    async function checkLessonCache() {
      try {
        const res = await fetch(`/api/lessons/${selectedUnit.id}/${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setLessonContent(data.content);
            setEditedContent(data.content);
          }
        }
      } catch (err) {
        console.error('Failed to check lesson cache:', err);
      }
    }
    checkLessonCache();
  }, [selectedUnit, activeTab]);

  const fetchLessonContent = async () => {
    if (!selectedUnit) return;
    setLoadingLesson(true);
    setLessonError('');
    setLessonContent('');
    setEditedContent('');
    try {
      const res = await fetch('/api/ollama/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedUnit.title,
          grammar: selectedUnit.grammar,
          vocabulary: selectedUnit.vocabulary,
          level: activeLevel,
          unitId: selectedUnit.id,
          tabId: activeTab
        })
      });
      if (!res.ok) throw new Error('Failed to connect to the Vercel API for generating the study guide.');
      const data = await res.json();
      setLessonContent(data.content);
      setEditedContent(data.content);
    } catch (err) {
      setLessonError(err.message || 'Error occurred.');
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUnit) return;
    try {
      const res = await fetch(`/api/lessons/${selectedUnit.id}/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent })
      });
      if (!res.ok) throw new Error('Failed to save changes.');
      setLessonContent(editedContent);
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedUnit) return;
    if (!window.confirm(`Are you sure you want to delete this ${activeTab} guide? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/lessons/${selectedUnit.id}/${activeTab}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete segment.');
      setLessonContent('');
      setEditedContent('');
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStartWriting = (prompt, level) => {
    setSelectedPrompt({ prompt, level });
    setView('writing');
  };

  const handleStartSpeaking = (prompt, level) => {
    setSelectedPrompt({ prompt, level });
    setView('speaking');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Syllabus Tree</h1>
        <p className="page-subtitle">Master modules step-by-step from A1 to B2 proficiency.</p>
      </div>

      {/* Selectors Grid (Level and Unit Dropdowns Side-by-Side) */}
      <div className="nb-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* CEFR Level Selector */}
        <div>
          <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'block', color: '#555' }}>
            Select CEFR Level
          </label>
          <select
            className="nb-select"
            value={activeLevel}
            onChange={(e) => {
              const lvl = e.target.value;
              setActiveLevel(lvl);
              lsSet('ita_last_level', lvl);
              setSelectedUnit(null);
              lsSet('ita_last_unit_id', null);
            }}
            style={{
              fontSize: '1.05rem',
              padding: '0.8rem 1rem',
              border: '3px solid #000',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '3px 3px 0px #000',
              width: '100%',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {Object.keys(syllabus).map(lvl => (
              <option key={lvl} value={lvl}>
                {lvl}: {syllabus[lvl].title}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Selector Dropdown */}
        <div>
          <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'block', color: '#555' }}>
            Select Unit Module
          </label>
          <select
            className="nb-select"
            value={selectedUnit ? selectedUnit.id : ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const unit = levelData.units.find(u => u.id === selectedId);
              setSelectedUnit(unit || null);
              lsSet('ita_last_unit_id', unit?.id || null);
            }}
            style={{
              fontSize: '1.05rem',
              padding: '0.8rem 1rem',
              border: '3px solid #000',
              borderRadius: 0,
              backgroundColor: '#fff',
              boxShadow: '3px 3px 0px #000',
              width: '100%',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose a Unit Module --</option>
            {levelData.units.map((unit, idx) => {
              const isCompleted = progress[unit.id];
              return (
                <option key={unit.id} value={unit.id}>
                  Unit {idx + 1}: {unit.title} {isCompleted ? '✓ (Completed)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Level Header Card */}
      <div className="nb-card accent-blue" style={{ marginBottom: '2rem' }}>
        <h3 className="nb-card-title">{levelData.title}</h3>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{levelData.description}</p>
      </div>      {/* Full Width Study Guides & Practice Section */}
      {selectedUnit ? (
        <div className="nb-card accent-purple" style={{ marginTop: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem', 
            borderBottom: '3px solid #000', 
            paddingBottom: '0.8rem', 
            flexWrap: 'wrap', 
            gap: '1rem' 
          }}>
            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '1.3rem', margin: 0 }}>
              📖 modular chapters: {selectedUnit.title}
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!progress[selectedUnit.id]}
                onChange={() => toggleUnitProgress(selectedUnit.id)}
                style={{ width: '22px', height: '22px', cursor: 'pointer' }}
              />
              Mark Completed
            </label>
          </div>
          
          {/* Subtopic Tab Selector */}
          <div className="study-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'grammar', label: '📘 Grammar Guide' },
              { id: 'vocabulary', label: '📙 Vocab Booklet' },
              { id: 'dialogue', label: '💬 Dialogue Scenario' },
              { id: 'exercises', label: '📝 Exercises & Quiz' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`nb-btn ${activeTab === tab.id ? 'btn-blue' : ''}`}
                style={{ 
                  backgroundColor: activeTab === tab.id ? 'var(--color-accent-blue)' : '#fff',
                  boxShadow: activeTab === tab.id ? '1px 1px 0px #000' : '3px 3px 0px #000',
                  transform: activeTab === tab.id ? 'translate(2px, 2px)' : 'none'
                }}
                onClick={() => { setActiveTab(tab.id); lsSet('ita_last_tab', tab.id); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!lessonContent && !loadingLesson && (
            <button className="nb-btn btn-blue" onClick={fetchLessonContent}>
              🚀 Compile {activeTab.toUpperCase()} Chapter
            </button>
          )}

          {loadingLesson && (
            <div style={{ 
              padding: '2.5rem 1.5rem', 
              border: '3px solid #000', 
              backgroundColor: '#fff', 
              boxShadow: '3px 3px 0px #000',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <div className="nb-loader"></div>
              <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '1.1rem', margin: 0 }}>
                Compiling {activeTab.toUpperCase()} Chapter
              </h4>
              <p style={{ fontWeight: 600, color: '#555', fontSize: '0.95rem', margin: 0 }}>
                Professore Gemini is writing custom textbook notes. Please wait a moment...
              </p>
            </div>
          )}

          {lessonError && (
            <div style={{ color: 'red', fontWeight: 800, marginTop: '1rem' }}>⚠️ {lessonError}</div>
          )}

          {lessonContent && (
            <div style={{ marginTop: '1.5rem' }}>
              {isEditing ? (
                <div>
                  <textarea
                    className="nb-textarea"
                    style={{
                      width: '100%',
                      height: '400px',
                      fontFamily: 'Outfit, monospace',
                      fontSize: '1.05rem',
                      border: '3px solid #000',
                      padding: '1rem',
                      boxShadow: '3px 3px 0px #000',
                      marginBottom: '1.5rem'
                    }}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="nb-btn btn-green" onClick={handleSaveChanges}>
                      💾 Save Edits
                    </button>
                    <button className="nb-btn btn-red" onClick={() => { setIsEditing(false); setEditedContent(lessonContent); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="study-content-card" style={{ 
                    border: '3px solid #000', 
                    backgroundColor: '#fff', 
                    boxShadow: '3px 3px 0px #000',
                    marginBottom: '1.5rem'
                  }}>
                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(lessonContent) }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="nb-btn btn-yellow" onClick={() => setIsEditing(true)}>
                      ✏️ Edit Notes
                    </button>
                    <button className="nb-btn btn-red" onClick={handleDeleteLesson}>
                      🗑️ Delete Chapter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Integrated Practice Task Buttons */}
          <div style={{ borderTop: '3px solid #000', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem', marginBottom: '1rem', color: '#555' }}>
              Practice this Unit
            </h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="nb-btn btn-green"
                onClick={() => handleStartWriting(selectedUnit.writingPrompt, activeLevel)}
              >
                ✏️ Practice Writing
              </button>
              <button 
                className="nb-btn btn-orange"
                onClick={() => handleStartSpeaking(selectedUnit.speakingPrompt, activeLevel)}
              >
                🗣️ Practice Speaking
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="nb-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px', backgroundColor: '#fff', marginTop: '2rem' }}>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#777', textTransform: 'uppercase', textAlign: 'center', padding: '1rem' }}>
            Select a unit module tab above to begin studying.
          </p>
        </div>
      )}
    </div>
  );
}
