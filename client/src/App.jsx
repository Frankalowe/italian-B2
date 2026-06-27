import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LessonTree from './components/LessonTree';
import WritingStudio from './components/WritingStudio';
import SpeakingLounge from './components/SpeakingLounge';
import ReadersCorner from './components/ReadersCorner';

// Simple localStorage helpers
const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export default function App() {
  const [view, setView] = useState(() => lsGet('ita_last_view', 'dashboard'));
  const [syllabus, setSyllabus] = useState(null);
  const [progress, setProgress] = useState(() => lsGet('italian_b2_progress', {}));
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch Syllabus on mount
  useEffect(() => {
    async function fetchSyllabus() {
      try {
        const res = await fetch('/api/syllabus');
        if (!res.ok) {
          throw new Error('Could not fetch syllabus data from the Vercel API.');
        }
        const data = await res.json();
        setSyllabus(data);
      } catch (err) {
        console.error(err);
        setError('Tutor platform offline. Please ensure your Vercel deployment is active and your GEMINI_API_KEY is configured in project settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSyllabus();
  }, []);

  // Progress is now initialised inline via useState lazy init above

  const toggleUnitProgress = (unitId) => {
    setProgress((prev) => {
      const updated = { ...prev, [unitId]: !prev[unitId] };
      lsSet('italian_b2_progress', updated);
      return updated;
    });
  };

  const handleSetView = (newView) => {
    if (newView !== 'writing' && newView !== 'speaking') {
      setSelectedPrompt(null);
    }
    lsSet('ita_last_view', newView);
    setView(newView);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4ede2', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>Caricamento...</h2>
        <p style={{ fontWeight: 600 }}>Connecting to the Italian learning platform...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4ede2', padding: '2rem' }}>
        <div style={{ border: '4px solid #000', backgroundColor: '#f87171', padding: '2rem', boxShadow: '8px 8px 0px #000', maxWidth: '600px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>⚠️ Connessione Fallita</h2>
          <p style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>{error}</p>
          <p style={{ fontWeight: 600 }}>Ensure that your Vercel environment has access to the internet and the Gemini API credentials are set.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Header Bar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.8rem 1.2rem', 
        borderBottom: '4px solid #000', 
        backgroundColor: '#fff', 
        position: 'sticky', 
        top: 0, 
        zIndex: 900 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 1, minWidth: 0 }}>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '-0.5px', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            🇮🇹 Italiano B2
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            backgroundColor: '#000', 
            color: '#fff', 
            padding: '2px 6px', 
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            Tutor
          </span>
        </div>
        <button 
          className="nb-btn btn-yellow" 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          style={{ 
            padding: '0.5rem 0.9rem', 
            fontSize: '0.9rem', 
            fontWeight: 900,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {sidebarOpen ? '✕ Close' : '☰ Menu'}
        </button>
      </header>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(3px)',
            zIndex: 950 
          }} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-out Off-Canvas Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '300px',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 990,
        backgroundColor: 'var(--color-accent-yellow)',
        borderRight: '4px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem'
      }}>
        <div className="logo-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 className="logo-title" style={{ fontSize: '1.8rem' }}>Menu</h1>
            <span className="logo-sub">Navigazione</span>
          </div>
          <button 
            className="nb-btn btn-red" 
            onClick={() => setSidebarOpen(false)}
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        <ul className="nav-links" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <li>
            <button 
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => { handleSetView('dashboard'); setSidebarOpen(false); }}
            >
              🏠 Dashboard
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${view === 'syllabus' ? 'active' : ''}`}
              onClick={() => { handleSetView('syllabus'); setSidebarOpen(false); }}
            >
              🌳 Syllabus Tree
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${view === 'writing' ? 'active' : ''}`}
              onClick={() => { handleSetView('writing'); setSidebarOpen(false); }}
            >
              ✏️ Writing Studio
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${view === 'speaking' ? 'active' : ''}`}
              onClick={() => { handleSetView('speaking'); setSidebarOpen(false); }}
            >
              🗣️ Speaking Lounge
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${view === 'reading' ? 'active' : ''}`}
              onClick={() => { handleSetView('reading'); setSidebarOpen(false); }}
            >
              📖 Reader's Corner
            </button>
          </li>
        </ul>

        <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '3px solid #000', paddingTop: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <p>AI Engine: <strong>Gemini API</strong></p>
          <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#444' }}>Notes precompiled with Gemma 4 (Local)</p>
        </div>
      </nav>

      {/* Main View Area */}
      <main className="main-content" style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'dashboard' && (
          <Dashboard 
            syllabus={syllabus} 
            progress={progress} 
            setView={handleSetView} 
          />
        )}
        {view === 'syllabus' && (
          <LessonTree 
            syllabus={syllabus} 
            progress={progress} 
            toggleUnitProgress={toggleUnitProgress} 
            setSelectedPrompt={setSelectedPrompt}
            setView={handleSetView}
          />
        )}
        {view === 'writing' && (
          <WritingStudio 
            prefilledPrompt={selectedPrompt} 
          />
        )}
        {view === 'speaking' && (
          <SpeakingLounge 
            prefilledPrompt={selectedPrompt} 
          />
        )}
        {view === 'reading' && (
          <ReadersCorner />
        )}
      </main>
    </div>
  );
}
