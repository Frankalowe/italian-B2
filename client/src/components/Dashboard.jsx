import React, { useState, useEffect } from 'react';

const DAILY_PROVERBS = [
  { italian: "Chi cerca trova.", english: "He who seeks, finds.", explanation: "Encouraging persistence in your study!" },
  { italian: "Meglio tardi che mai.", english: "Better late than never.", explanation: "Even 5 minutes of study today counts." },
  { italian: "L'abito non fa il monaco.", english: "The habit does not make the monk.", explanation: "Don't judge by appearances - Italian grammar is easier than it looks!" },
  { italian: "A ogni uccello il suo nido è bello.", english: "To every bird, its own nest is beautiful.", explanation: "Home is where the heart is. Practice describing your home today!" }
];

const DAILY_WORDS = [
  { word: "Buongiorno", meaning: "Good morning / Hello", pronunciation: "bwon-JOR-noh" },
  { word: "Grazie mille", meaning: "Thank you very much", pronunciation: "GRAHT-tsyeh MEEL-leh" },
  { word: "Volentieri", meaning: "Gladly / With pleasure", pronunciation: "voh-lehn-TYEH-ree" },
  { word: "In bocca al lupo", meaning: "Break a leg (lit. in the mouth of the wolf)", pronunciation: "een BOK-kah ahl LOO-poh" }
];

export default function Dashboard({ syllabus, progress, setView }) {
  const [proverb, setProverb] = useState(DAILY_PROVERBS[0]);
  const [dailyWord, setDailyWord] = useState(DAILY_WORDS[0]);

  useEffect(() => {
    // Pick a daily quote & word based on date
    const day = new Date().getDate();
    setProverb(DAILY_PROVERBS[day % DAILY_PROVERBS.length]);
    setDailyWord(DAILY_WORDS[day % DAILY_WORDS.length]);
  }, []);

  // Calculate overall progress percent
  const totalUnits = Object.values(syllabus).reduce((acc, level) => acc + level.units.length, 0);
  const completedCount = Object.values(progress).filter(Boolean).length;
  const percent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Benvenuto!</h1>
        <p className="page-subtitle">Welcome to your personal Italian learning workspace. Let's aim for B2!</p>
      </div>

      <div className="nb-card accent-green">
        <h2 className="nb-card-title">Syllabus Completion</h2>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
          <span className="progress-text">{percent}% Completed ({completedCount} / {totalUnits} Units)</span>
        </div>
        <p style={{ fontWeight: 600 }}>
          You have mastered basic structure elements. Continue your journey through the interactive Syllabus Tree!
        </p>
        <button 
          className="nb-btn btn-yellow" 
          style={{ marginTop: '1.2rem' }}
          onClick={() => setView('syllabus')}
        >
          Open Syllabus Tree
        </button>
      </div>

      <div className="nb-grid">
        <div className="nb-card accent-blue">
          <h3 className="nb-card-title">Parola del Giorno</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{dailyWord.word}</p>
          <p style={{ fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '0.8rem' }}>/{dailyWord.pronunciation}/</p>
          <div style={{ borderLeft: '4px solid #000', paddingLeft: '1rem', fontWeight: 600 }}>
            {dailyWord.meaning}
          </div>
        </div>

        <div className="nb-card accent-pink" style={{ backgroundColor: '#f472b6' }}>
          <h3 className="nb-card-title">Proverbio del Giorno</h3>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>"{proverb.italian}"</p>
          <p style={{ fontWeight: 600, color: '#333', marginBottom: '1rem' }}>{proverb.english}</p>
          <p style={{ fontSize: '0.9rem', backgroundColor: '#fff', padding: '8px', border: '2px solid #000', boxShadow: '2px 2px 0px #000' }}>
            <strong>Tutor Tip:</strong> {proverb.explanation}
          </p>
        </div>
      </div>

      <div className="nb-card accent-purple">
        <h3 className="nb-card-title">Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="nb-btn btn-green" onClick={() => setView('writing')}>
            ✏️ Writing Studio
          </button>
          <button className="nb-btn btn-yellow" onClick={() => setView('speaking')}>
            🗣️ Speaking Lounge
          </button>
          <button className="nb-btn btn-orange" onClick={() => setView('reading')}>
            📖 Reader's Corner
          </button>
        </div>
      </div>
    </div>
  );
}
