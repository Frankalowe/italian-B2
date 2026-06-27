import React, { useState, useEffect, useRef } from 'react';

export default function SpeakingLounge({ prefilledPrompt }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'it-IT';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setError('');
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInputText(text);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
        setError(`Speech Error: ${e.error}. Try typing your answer instead.`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setError('Web Speech Recognition is not supported in this browser. Try Chrome or Safari.');
    }
  }, []);

  // Set up initial system greeting or handle prefilled prompts
  useEffect(() => {
    if (prefilledPrompt) {
      setMessages([
        {
          role: 'assistant',
          content: `Ciao! Parliamo di questo argomento: "${prefilledPrompt.prompt}". Dimmi qualcosa al riguardo!`,
          translation: `[Hello! Let's talk about this topic: "${prefilledPrompt.prompt}". Tell me something about it!]`
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Ciao! Sono il tuo tutor d\'italiano. Come stai oggi? Di cosa ti piacerebbe parlare?',
          translation: '[Hello! I am your Italian tutor. How are you today? What would you like to talk about?]'
        }
      ]);
    }
  }, [prefilledPrompt]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger Text-to-Speech
  const speak = (text) => {
    if (!audioEnabled) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    // Filter out translation part in brackets [] for TTS
    const textToSpeak = text.split('[')[0].trim();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'it-IT';
    
    // Select an Italian voice if available
    const voices = window.speechSynthesis.getVoices();
    const italianVoice = voices.find(v => v.lang.startsWith('it-'));
    if (italianVoice) {
      utterance.voice = italianVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech Recognition is unavailable.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputText('');
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);
    setError('');

    try {
      // Map frontend messages to match backend format
      const backendPayload = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: backendPayload })
      });

      if (!res.ok) {
        throw new Error('Failed to get response from tutor. Make sure your local server is running.');
      }

      const data = await res.json();
      
      // Separate reply and potential bracket translation
      const rawReply = data.reply;
      const bracketIdx = rawReply.indexOf('[');
      let replyContent = rawReply;
      let translation = '';
      
      if (bracketIdx !== -1) {
        replyContent = rawReply.substring(0, bracketIdx).trim();
        translation = rawReply.substring(bracketIdx).trim();
      }

      const tutorMessage = {
        role: 'assistant',
        content: replyContent,
        translation: translation
      };

      setMessages(prev => [...prev, tutorMessage]);
      speak(replyContent);
    } catch (err) {
      setError(err.message || 'Error communicating with tutor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Speaking Lounge</h1>
        <p className="page-subtitle">Have real-time conversations with an AI tutor using speech-to-text input and voice outputs.</p>
      </div>

      <div className="nb-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Chat window */}
        <div className="nb-card accent-purple" style={{ display: 'flex', flexDirection: 'column', height: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '3px solid #000', paddingBottom: '0.5rem' }}>
            <h3 className="nb-card-title" style={{ margin: 0, border: 'none' }}>Conversazione</h3>
            <label style={{ fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              Enable Audio Voice Playback
            </label>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '3px solid #000', padding: '1rem', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: msg.role === 'user' ? 'var(--color-accent-green)' : '#f3f4f6',
                  padding: '10px 15px',
                  border: '3px solid #000',
                  boxShadow: '3px 3px 0px #000',
                  fontWeight: 600
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.2rem', color: '#555' }}>
                  {msg.role === 'user' ? 'Tu (You)' : 'Tutor'}
                </div>
                <div style={{ fontSize: '1.1rem' }}>{msg.content}</div>
                {msg.translation && (
                  <div style={{ fontSize: '0.9rem', color: '#4b5563', borderTop: '1px dashed #777', marginTop: '0.5rem', paddingTop: '0.3rem', fontStyle: 'italic' }}>
                    {msg.translation}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => speak(msg.content)} 
                    style={{ fontSize: '0.8rem', padding: '2px 6px', marginTop: '0.5rem', border: '2px solid #000', background: '#fff', cursor: 'pointer', fontWeight: 900 }}
                  >
                    🔊 Ripeti (Repeat)
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', border: '3px solid #000', padding: '10px 15px', backgroundColor: '#eee', boxShadow: '3px 3px 0px #000' }}>
                <span style={{ fontWeight: 800 }}>Tutor sta pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="nb-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Parla adesso..." : "Scrivi o parla in italiano..."}
              disabled={loading}
              style={{ flex: 1 }}
            />
            
            <button 
              type="button" 
              onClick={toggleListening} 
              className={`nb-btn ${isListening ? 'btn-red' : 'btn-yellow'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}
              disabled={loading}
              title={isListening ? "Stop listening" : "Record voice input"}
            >
              🎤 {isListening ? 'Recording...' : 'Speak'}
            </button>

            <button type="submit" className="nb-btn btn-green" disabled={loading || !inputText.trim()}>
              Invia
            </button>
          </form>

          {error && (
            <div style={{ color: 'red', fontWeight: 800, marginTop: '0.5rem', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="nb-card accent-yellow" style={{ height: 'fit-content' }}>
            <h3 className="nb-card-title">Tutor Tips</h3>
            <ul style={{ paddingLeft: '1rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Say <strong>"Ciao"</strong> to greet.</li>
              <li>Say <strong>"Non capisco"</strong> if you need clarification.</li>
              <li>Try to answer in full sentences.</li>
              <li>If the AI starts speaking too fast, click <strong>"Ripeti"</strong> to listen again.</li>
            </ul>
          </div>

          <div className="nb-card accent-blue" style={{ height: 'fit-content' }}>
            <h3 className="nb-card-title">Italian Pronunciation Key</h3>
            <ul style={{ listStyle: 'none', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>C + i / e</strong>: sounds like "ch" (e.g. *ciao*)</li>
              <li><strong>CH + i / e</strong>: sounds like "k" (e.g. *chi*)</li>
              <li><strong>G + i / e</strong>: sounds like "j" (e.g. *giorno*)</li>
              <li><strong>GLI</strong>: sounds like "ly" in million (e.g. *famiglia*)</li>
              <li><strong>GN</strong>: sounds like "ny" in canyon (e.g. *signore*)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
