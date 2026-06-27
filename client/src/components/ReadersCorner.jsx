import React, { useState } from 'react';

export default function ReadersCorner() {
  const [level, setLevel] = useState('A1');
  const [topic, setTopic] = useState('La cucina italiana');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  
  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a reading topic.');
      return;
    }
    setError('');
    setLoading(true);
    setStory(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setShowTranslation(false);

    try {
      const res = await fetch('/api/ollama/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, topic })
      });

      if (!res.ok) {
        throw new Error('Failed to generate story. Ensure the local Express server is running and connected.');
      }

      const data = await res.json();
      setStory(data);
    } catch (err) {
      setError(err.message || 'Error occurred generating reading passage.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (qIdx, oIdx) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: oIdx
    }));
  };

  const handleQuizSubmit = () => {
    if (Object.keys(selectedAnswers).length < story.questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setQuizSubmitted(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reader's Corner</h1>
        <p className="page-subtitle">Generate reading materials tailored to your CEFR level and test yourself with comprehension checks.</p>
      </div>

      <div className="nb-card accent-orange">
        <h3 className="nb-card-title">Setup Reading Passage</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>CEFR Level</label>
            <select className="nb-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="A1">Phase 1: A1 - Beginner</option>
              <option value="A2">Phase 2: A2 - Elementary</option>
              <option value="B1">Phase 3: B1 - Foundation</option>
              <option value="B1_plus">Phase 4: B1+ - Adv Foundation</option>
              <option value="B2">Phase 5: B2 - Core</option>
              <option value="B2_mastery">Phase 6: B2 - Mastery</option>
            </select>
          </div>

          <div style={{ flex: 3, minWidth: '250px' }}>
            <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Topic / Theme</label>
            <input
              type="text"
              className="nb-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Italian Coffee Culture, Trip to Florence, History of Pizza..."
            />
          </div>

          <button type="submit" className="nb-btn btn-green" disabled={loading} style={{ height: '48px' }}>
            {loading ? 'Generating Story...' : 'Generate Story'}
          </button>
        </form>

        {error && !story && (
          <div style={{ color: 'red', fontWeight: 800, marginTop: '1rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="nb-card accent-yellow" style={{ textAlign: 'center' }}>
          <div className="mic-status" style={{ justifyContent: 'center' }}>
            <div className="mic-dot listening"></div>
            <span>Generating custom Italian passage and comprehension checks...</span>
          </div>
          <p style={{ marginTop: '1rem', fontWeight: 600, color: '#555' }}>
            This will take about 15-30 seconds depending on your local hardware.
          </p>
        </div>
      )}

      {story && (
        <div className="nb-grid" style={{ gridTemplateColumns: '3fr 2fr' }}>
          {/* Left Side: Story text & vocabulary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="nb-card accent-yellow" style={{ position: 'relative' }}>
              <span className={`nb-badge level-${level.toLowerCase()}`} style={{ position: 'absolute', top: '-15px', right: '15px' }}>
                {level}
              </span>
              <h2 className="nb-card-title">{story.title}</h2>
              
              <div style={{ fontSize: '1.2rem', lineHeight: '1.7', fontWeight: 600, marginBottom: '2rem', whiteSpace: 'pre-line', padding: '1rem', border: '3px solid #000', backgroundColor: '#fff', boxShadow: '3px 3px 0px #000' }}>
                {story.passage}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="nb-btn btn-blue" onClick={() => setShowTranslation(!showTranslation)}>
                  {showTranslation ? 'Hide English Translation' : 'Show English Translation'}
                </button>
              </div>

              {showTranslation && (
                <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#4b5563', padding: '1rem', border: '3px solid #000', backgroundColor: '#f9fafb', boxShadow: '3px 3px 0px #000', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                  {story.translation}
                </div>
              )}
            </div>

            {story.vocabulary && story.vocabulary.length > 0 && (
              <div className="nb-card accent-purple">
                <h3 className="nb-card-title">Vocabulary & Keywords</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {story.vocabulary.map((vocab, index) => (
                    <div key={index} style={{ border: '2px solid #000', padding: '8px 12px', backgroundColor: '#fff', boxShadow: '2px 2px 0px #000' }}>
                      <strong style={{ color: '#b91c1c', fontSize: '1.1rem' }}>{vocab.word}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>{vocab.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Comprehension Quiz */}
          <div className="nb-card accent-blue" style={{ height: 'fit-content' }}>
            <h3 className="nb-card-title">Comprehension Quiz</h3>
            
            {story.questions && story.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ marginBottom: '1.5rem', borderBottom: qIdx === story.questions.length - 1 ? 'none' : '2px dashed #000', paddingBottom: '1rem' }}>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.8rem' }}>
                  {qIdx + 1}. {q.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[qIdx] === oIdx;
                    const isCorrect = q.answerIndex === oIdx;
                    
                    let bg = '#fff';
                    if (quizSubmitted) {
                      if (isCorrect) bg = 'var(--color-accent-green)';
                      else if (isSelected) bg = 'var(--color-accent-red)';
                    } else if (isSelected) {
                      bg = 'var(--color-accent-yellow)';
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleAnswerSelect(qIdx, oIdx)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: '2px solid #000',
                          backgroundColor: bg,
                          fontWeight: 600,
                          cursor: quizSubmitted ? 'default' : 'pointer',
                          boxShadow: isSelected ? '1px 1px 0px #000' : '3px 3px 0px #000',
                          transform: isSelected ? 'translate(2px, 2px)' : 'none',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ color: 'red', fontWeight: 800, marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            {!quizSubmitted ? (
              <button className="nb-btn btn-green" onClick={handleQuizSubmit} style={{ width: '100%' }}>
                Submit Answers
              </button>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Score: {Object.keys(selectedAnswers).filter(k => selectedAnswers[k] === story.questions[k].answerIndex).length} / {story.questions.length} Correct
                </p>
                <button className="nb-btn btn-yellow" onClick={() => handleGenerate({ preventDefault: () => {} })} style={{ width: '100%' }}>
                  Practice Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
