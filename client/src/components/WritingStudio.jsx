import React, { useState, useEffect } from 'react';

const SAMPLE_PROMPTS = {
  A1: "Presentati in italiano. Scrivi il tuo nome, età e da dove vieni.",
  A2: "Descrivi cosa hai fatto ieri o durante il fine settimana scorso.",
  B1: "Esprimi la tua opinione: pensi che l'intelligenza artificiale aiuterà gli studenti o no?",
  B1_plus: "Quali sono le sfide ambientali più urgenti del nostro tempo? Proponi soluzioni pratiche.",
  B2: "Se vincessi un milione di euro, cosa faresti? Descrivi i tuoi progetti ipotetici.",
  B2_mastery: "Scrivi un saggio breve (250 parole) sul ruolo del turismo di massa nelle città storiche italiane."
};

export default function WritingStudio({ prefilledPrompt }) {
  const [level, setLevel] = useState('A1');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefilledPrompt) {
      setLevel(prefilledPrompt.level);
      setPrompt(prefilledPrompt.prompt);
    } else {
      setPrompt(SAMPLE_PROMPTS[level]);
    }
  }, [level, prefilledPrompt]);

  const handleLevelChange = (e) => {
    const val = e.target.value;
    setLevel(val);
    setPrompt(SAMPLE_PROMPTS[val] || '');
    setFeedback(null);
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please write some text before submitting!');
      return;
    }
    setError('');
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('http://localhost:3001/api/ollama/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, prompt, level })
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate. Make sure the local server is running.');
      }

      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      setError(err.message || 'An error occurred during evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Writing Studio</h1>
        <p className="page-subtitle">Submit Italian paragraphs and receive real-time, grammar-focused CEFR feedback.</p>
      </div>

      <div className="nb-card accent-blue">
        <h3 className="nb-card-title">Setup Prompt</h3>
        <form onSubmit={handleEvaluate}>
          <div className="nb-grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Target Level</label>
              <select className="nb-select" value={level} onChange={handleLevelChange}>
                <option value="A1">Phase 1: A1 - Beginner</option>
                <option value="A2">Phase 2: A2 - Elementary</option>
                <option value="B1">Phase 3: B1 - Foundation</option>
                <option value="B1_plus">Phase 4: B1+ - Adv Foundation</option>
                <option value="B2">Phase 5: B2 - Core</option>
                <option value="B2_mastery">Phase 6: B2 - Mastery</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Writing Topic / Prompt</label>
              <input
                type="text"
                className="nb-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a custom prompt here..."
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Write in Italian</label>
            <textarea
              className="nb-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Scrivi qui in italiano..."
              disabled={loading}
            ></textarea>
          </div>

          {error && (
            <div style={{ color: 'red', fontWeight: 800, marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="nb-btn btn-green" disabled={loading}>
            {loading ? 'Analyzing with Ollama...' : 'Submit for Evaluation'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="nb-card accent-yellow" style={{ textAlign: 'center' }}>
          <div className="mic-status" style={{ justifyContent: 'center' }}>
            <div className="mic-dot listening"></div>
            <span>Evaluating grammar structures, spelling, and CEFR alignment...</span>
          </div>
          <p style={{ marginTop: '1rem', fontWeight: 600, color: '#555' }}>
            Grazie per la pazienza! The local LLM is working on your text.
          </p>
        </div>
      )}

      {feedback && (
        <div className="nb-card accent-green">
          <h2 className="nb-card-title">Evaluation Results</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span className={`nb-badge level-${feedback.cefrLevelReached.toLowerCase()}`}>
              Level Reached: {feedback.cefrLevelReached}
            </span>
            <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#555' }}>
              Target: {level}
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Tutor Feedback</h4>
            <p style={{ fontWeight: 600, fontSize: '1.05rem', backgroundColor: '#fff', padding: '12px', border: '2px solid #000' }}>
              {feedback.overallFeedback}
            </p>
          </div>

          {feedback.corrections && feedback.corrections.length > 0 ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Corrections & Grammar Insights</h4>
              <div className="corrections-list">
                {feedback.corrections.map((corr, idx) => (
                  <div key={idx} className="correction-item" style={{ backgroundColor: '#fff' }}>
                    <div className="correction-original">"{corr.original}"</div>
                    <div className="correction-fixed">➔ "{corr.corrected}"</div>
                    <div className="correction-explain"><strong>Rule:</strong> {corr.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="nb-card accent-yellow" style={{ padding: '1rem', marginBottom: '1.5rem', fontWeight: 800 }}>
              🎉 Bravissimo! No grammar errors detected. Excellent control of vocabulary and sentence structure!
            </div>
          )}

          <div>
            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Suggested Revision</h4>
            <div style={{ padding: '12px', border: '2px solid #000', backgroundColor: '#fff', fontWeight: 800, fontSize: '1.1rem', color: '#1d4ed8' }}>
              {feedback.improvedVersion}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
