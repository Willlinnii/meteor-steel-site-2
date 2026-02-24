import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useWritings } from '../../writings/WritingsContext';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
import DodecahedronButton from '../../components/DodecahedronButton';
import { apiFetch } from '../../lib/chatApi';
import './ConsultingPage.css';
import './ConsultingDashboardPage.css';

export default function ConsultingForgePage() {
  const { engagementId } = useParams();
  const { user } = useAuth();
  const { saveConversation, getConversation, loaded: writingsLoaded } = useWritings();

  const [engagement, setEngagement] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [mythicParallel, setMythicParallel] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);

  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);

  const conversationKey = `consulting-forge-${engagementId}`;

  // Load engagement + sessions
  useEffect(() => {
    if (!user || !engagementId) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [engRes, sessRes] = await Promise.all([
          apiFetch('/api/consulting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'get-engagement', engagementId }),
          }),
          apiFetch('/api/consulting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'get-sessions', engagementId }),
          }),
        ]);
        const engData = await engRes.json();
        const sessData = await sessRes.json();
        if (engData.success) setEngagement(engData.engagement);
        if (sessData.success) setSessions(sessData.sessions || []);
      } catch (err) {
        console.error('Failed to load engagement for forge:', err);
      }
      setLoading(false);
    })();
  }, [user, engagementId]);

  // Load previous conversation
  useEffect(() => {
    if (writingsLoaded) {
      const prev = getConversation(conversationKey, null);
      if (prev.length > 0) {
        setMessages(prev);
        startedRef.current = true;
      }
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on message changes
  const prevMsgsRef = useRef(messages);
  useEffect(() => {
    if (!writingsLoaded || messages.length === 0) return;
    if (prevMsgsRef.current === messages) return;
    prevMsgsRef.current = messages;
    saveConversation(conversationKey, null, messages.map(m => ({ role: m.role, content: m.content })));
  }, [messages, writingsLoaded, saveConversation, conversationKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const buildEngagementContext = useCallback(() => {
    if (!engagement) return null;
    return {
      title: engagement.title,
      archetype: engagement.archetype,
      intakeNotes: engagement.intakeNotes,
      clientType: engagement.clientType,
      stages: engagement.stages,
      sessions: sessions.map(s => ({
        stageId: s.stageId,
        artifacts: s.artifacts || [],
        messages: (s.messages || []).filter(m => m.role === 'user').map(m => m.content).slice(0, 5),
      })),
    };
  }, [engagement, sessions]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || chatLoading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'consulting-forge',
          engagementContext: buildEngagementContext(),
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'I see.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);

      if (data.draft) setDraft(data.draft);
      if (data.mythicParallel) setMythicParallel(data.mythicParallel);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setChatLoading(false);
  };

  // Auto-start
  useEffect(() => {
    if (!startedRef.current && !loading && engagement && messages.length === 0) {
      startedRef.current = true;
      const seed = `I'd like to forge the story of my consulting engagement "${engagement.title || 'my journey'}" into a written narrative.`;
      setMessages([{ role: 'user', content: seed, hidden: true }]);
      setChatLoading(true);

      (async () => {
        try {
          const res = await apiFetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: seed }],
              mode: 'consulting-forge',
              engagementContext: buildEngagementContext(),
            }),
          });
          const data = await res.json();
          const reply = data.reply || 'Let us begin forging your story.';
          setMessages([
            { role: 'user', content: seed, hidden: true },
            { role: 'assistant', content: reply },
          ]);
          speak(reply);
        } catch {
          setMessages([{ role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        }
        setChatLoading(false);
      })();
    }
  }, [loading, engagement]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Story Forge</h1>
            <p className="consulting-hero-subtitle">Please sign in.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Engagement Not Found</h1>
          </div>
          <div className="consulting-cta">
            <Link to="/consulting/dashboard" className="consulting-begin-btn">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const visibleMessages = messages.filter(m => !m.hidden);

  return (
    <div className="consulting-page">
      <div className="consulting-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link
            to={`/consulting/engagement/${engagementId}`}
            style={{
              font: '0.7rem Cinzel, serif',
              color: 'var(--text-secondary)',
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '6px 14px',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Back to Engagement
          </Link>
          <span style={{ font: '1rem Cinzel, serif', color: 'var(--accent-ember)' }}>
            Story Forge
          </span>
          <span style={{ font: '0.85rem Crimson Pro, serif', color: 'var(--text-secondary)' }}>
            {engagement.title || 'Mythic Narrative Engagement'}
          </span>
        </div>

        {/* Draft output */}
        {draft && (
          <div className="consulting-dash-synthesis" style={{ marginBottom: 20 }}>
            <div className="consulting-dash-synthesis-title">Draft</div>
            <div className="consulting-dash-synthesis-text" style={{ whiteSpace: 'pre-wrap' }}>{draft}</div>
          </div>
        )}

        {/* Mythic parallel */}
        {mythicParallel && (
          <div className="consulting-dash-artifact" style={{ marginBottom: 16 }}>
            <div className="consulting-dash-artifact-type">Mythic Parallel</div>
            <div className="consulting-dash-artifact-content">
              <strong>{mythicParallel.source}:</strong> {mythicParallel.parallel}
              {mythicParallel.suggestion && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{mythicParallel.suggestion}</div>}
            </div>
          </div>
        )}

        {/* Chat */}
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
            {chatLoading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-content chat-loading">Atlas is forging...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="profile-chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="profile-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={voiceEnabled ? 'Tap mic or type...' : 'Tell Atlas what to forge...'}
              disabled={chatLoading}
            />
            {voiceEnabled && SpeechRecognition && (
              <button
                className={`chat-mic-btn${recording ? ' recording' : ''}`}
                onClick={recording ? stopListening : startListening}
                disabled={chatLoading || speaking}
                title={recording ? 'Stop recording' : 'Start recording'}
              >
                {recording ? '\u{23F9}' : '\u{1F3A4}'}
              </button>
            )}
            <DodecahedronButton />
            <button
              className="profile-chat-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || chatLoading}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
