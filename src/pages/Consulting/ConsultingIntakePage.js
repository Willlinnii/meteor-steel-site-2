import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { useWritings } from '../../writings/WritingsContext';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
import DodecahedronButton from '../../components/DodecahedronButton';
import { apiFetch } from '../../lib/chatApi';
import './ConsultingPage.css';

const CLIENT_TYPE_OPTIONS = [
  { value: 'storyteller', label: 'Storyteller or Artist' },
  { value: 'creator', label: 'Creator or Maker' },
  { value: 'seeker', label: 'Seeker on the Journey' },
  { value: 'brand', label: 'Brand or Organization' },
  { value: 'leader', label: 'Leader or Visionary' },
];

export default function ConsultingIntakePage() {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const { getConversation, saveConversation, loaded: writingsLoaded } = useWritings();

  const [clientType, setClientType] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [engagementId, setEngagementId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);

  // Load previous intake conversation
  useEffect(() => {
    if (writingsLoaded) {
      const prev = getConversation('consulting-intake', null);
      if (prev.length > 0) {
        setMessages(prev);
        setStarted(true);
      }
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on message changes
  const prevMsgsRef = useRef(messages);
  useEffect(() => {
    if (!writingsLoaded || messages.length === 0) return;
    if (prevMsgsRef.current === messages) return;
    prevMsgsRef.current = messages;
    saveConversation('consulting-intake', null, messages.map(m => ({ role: m.role, content: m.content })));
  }, [messages, writingsLoaded, saveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Get existing credentials and natal chart from profile
  const existingCredentials = profileData?.credentials || null;
  const existingNatalChart = profileData?.natalChart || null;

  const createEngagement = useCallback(async (assessment) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create-engagement',
          clientType: clientType || 'seeker',
          title: assessment.suggestedTitle || 'Mythic Narrative Engagement',
          archetype: assessment.archetype || '',
          journeyStage: assessment.journeyStage || '',
          intakeNotes: assessment.narrative || '',
          natalData: existingNatalChart || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.engagementId) {
        setEngagementId(data.engagementId);
        setIntakeComplete(true);
      }
    } catch (err) {
      console.error('Failed to create engagement:', err);
    }
  }, [user, clientType, existingNatalChart]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'consulting-intake',
          clientType: clientType || 'seeker',
          existingCredentials,
          existingNatalChart,
        }),
      });
      const data = await res.json();

      const reply = data.reply || 'I see.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);

      // If intake assessment was generated
      if (data.intakeAssessment) {
        await createEngagement(data.intakeAssessment);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const startIntake = async () => {
    if (!clientType) return;
    setStarted(true);
    setLoading(true);

    const seedMessage = `I'd like to begin a mythic narrative consultation. I identify as a ${CLIENT_TYPE_OPTIONS.find(o => o.value === clientType)?.label || clientType}.`;

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: seedMessage }],
          mode: 'consulting-intake',
          clientType,
          existingCredentials,
          existingNatalChart,
        }),
      });
      const data = await res.json();

      const reply = data.reply || 'Welcome. Let us begin.';
      setMessages([
        { role: 'user', content: seedMessage, hidden: true },
        { role: 'assistant', content: reply },
      ]);
      speak(reply);
    } catch {
      setMessages([
        { role: 'assistant', content: 'Something went wrong starting the intake. Please try again.' },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = messages.filter(m => !m.hidden);

  if (!user) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title">Mythic Intake</h1>
            <p className="consulting-hero-subtitle">Please sign in to begin your intake.</p>
          </div>
        </div>
      </div>
    );
  }

  // Client type selection (pre-chat)
  if (!started) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title">Mythic Intake</h1>
            <p className="consulting-hero-subtitle">
              Before we begin, how do you see yourself in this work?
            </p>
          </div>

          <div className="consulting-section" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="consulting-serves-grid" style={{ gridTemplateColumns: '1fr' }}>
              {CLIENT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`consulting-serves-card${clientType === opt.value ? ' selected' : ''}`}
                  onClick={() => setClientType(opt.value)}
                  style={{
                    cursor: 'pointer',
                    borderColor: clientType === opt.value ? 'var(--accent-ember)' : undefined,
                    background: clientType === opt.value ? 'rgba(196, 113, 58, 0.1)' : undefined,
                    textAlign: 'left',
                  }}
                >
                  <h3 className="consulting-serves-card-title">{opt.label}</h3>
                </button>
              ))}
            </div>

            {clientType && (
              <div className="consulting-cta" style={{ marginTop: 24 }}>
                <button className="consulting-begin-btn" onClick={startIntake}>
                  Begin Intake with Atlas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consulting-page">
      <div className="consulting-container">
        <div className="consulting-hero" style={{ marginBottom: 24, padding: '20px 0' }}>
          <h1 className="consulting-hero-title" style={{ fontSize: '1.6rem' }}>Mythic Intake</h1>
        </div>

        <div className="profile-chat consulting-setup-chat" style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="profile-chat-controls">
            <button
              className={`chat-voice-toggle${voiceEnabled ? ' active' : ''}`}
              onClick={toggleVoice}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
            </button>
          </div>

          <div className="profile-chat-messages">
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                <div className="chat-msg-content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-content chat-loading">Atlas is listening...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!intakeComplete ? (
            <div className="profile-chat-input-area">
              <input
                ref={inputRef}
                type="text"
                className="profile-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceEnabled ? 'Tap mic or type...' : 'Share with Atlas...'}
                disabled={loading}
              />
              {voiceEnabled && SpeechRecognition && (
                <button
                  className={`chat-mic-btn${recording ? ' recording' : ''}`}
                  onClick={recording ? stopListening : startListening}
                  disabled={loading || speaking}
                  title={recording ? 'Stop recording' : 'Start recording'}
                >
                  {recording ? '\u{23F9}' : '\u{1F3A4}'}
                </button>
              )}
              <DodecahedronButton />
              <button
                className="profile-chat-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                Send
              </button>
            </div>
          ) : (
            <div className="consulting-cta" style={{ padding: '20px 0' }}>
              <p className="consulting-cta-sub" style={{ marginBottom: 16 }}>
                Your mythic assessment is complete. Your engagement has been created.
              </p>
              <button
                className="consulting-begin-btn"
                onClick={() => navigate(`/consulting/dashboard`)}
              >
                View Your Engagement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
