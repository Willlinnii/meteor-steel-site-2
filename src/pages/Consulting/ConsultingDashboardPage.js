import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useWritings } from '../../writings/WritingsContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
import DodecahedronButton from '../../components/DodecahedronButton';
import { apiFetch } from '../../lib/chatApi';
import './ConsultingPage.css';
import './ConsultingDashboardPage.css';

export default function ConsultingDashboardPage() {
  const { engagementId: paramEngId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackElement } = useCoursework();

  // State
  const [engagements, setEngagements] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMode, setSessionMode] = useState(false);
  const [synthesis, setSynthesis] = useState(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  // Load engagements
  const loadEngagements = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-engagements' }),
      });
      const data = await res.json();
      if (data.success) {
        setEngagements(data.engagements || []);
        // If we have a param ID, select that engagement
        if (paramEngId) {
          const found = (data.engagements || []).find(e => e.id === paramEngId);
          if (found) setEngagement(found);
        } else if (data.engagements?.length === 1) {
          // Auto-select if only one engagement
          setEngagement(data.engagements[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load engagements:', err);
    }
    setLoading(false);
  }, [user, paramEngId]);

  // Load sessions for selected engagement
  const loadSessions = useCallback(async (engId) => {
    if (!user || !engId) return;
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-sessions', engagementId: engId }),
      });
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [user]);

  useEffect(() => { loadEngagements(); }, [loadEngagements]);

  useEffect(() => {
    if (engagement?.id) {
      loadSessions(engagement.id);
      // Select the active stage by default
      const active = (engagement.stages || []).find(s => s.status === 'active');
      if (active) setSelectedStageId(active.id);
    }
  }, [engagement?.id, loadSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh engagement after session
  const refreshEngagement = useCallback(async () => {
    if (!user || !engagement?.id) return;
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-engagement', engagementId: engagement.id }),
      });
      const data = await res.json();
      if (data.success && data.engagement) {
        setEngagement(data.engagement);
      }
    } catch (err) {
      console.error('Failed to refresh engagement:', err);
    }
    await loadSessions(engagement.id);
  }, [user, engagement?.id, loadSessions]);

  // Generate synthesis
  const generateSynthesis = useCallback(async () => {
    if (!user || !engagement?.id) return;
    setSynthesisLoading(true);
    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Please synthesize my consulting engagement into a mythic narrative.' }],
          mode: 'consulting-synthesis',
          engagementContext: {
            title: engagement.title,
            archetype: engagement.archetype,
            intakeNotes: engagement.intakeNotes,
            clientType: engagement.clientType,
            stages: engagement.stages,
            sessions: sessions.map(s => ({
              stageId: s.stageId,
              artifacts: s.artifacts || [],
              actionItems: s.actionItems || [],
              messages: (s.messages || []).filter(m => m.role === 'user').map(m => m.content).slice(0, 5),
            })),
          },
        }),
      });
      const data = await res.json();
      if (data.synthesis) {
        setSynthesis(data.synthesis);
      } else if (data.reply) {
        setSynthesis(data.reply);
      }
    } catch (err) {
      console.error('Failed to generate synthesis:', err);
    }
    setSynthesisLoading(false);
  }, [user, engagement, sessions]);

  // Derived data
  const stages = engagement?.stages || [];
  const selectedStage = stages.find(s => s.id === selectedStageId);
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const allComplete = stages.length > 0 && stages.every(s => s.status === 'completed');
  const stageSessions = useMemo(() =>
    sessions.filter(s => s.stageId === selectedStageId),
    [sessions, selectedStageId]
  );
  const stageArtifacts = useMemo(() =>
    stageSessions.flatMap(s => (s.artifacts || []).map(a => ({ ...a, sessionId: s.id }))),
    [stageSessions]
  );

  // Track page visit
  useEffect(() => {
    if (engagement?.id) {
      trackElement(`consulting.${engagement.id}.dashboard.visited`);
    }
  }, [engagement?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title">Consulting Dashboard</h1>
            <p className="consulting-hero-subtitle">Please sign in to view your engagements.</p>
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

  // No engagements
  if (engagements.length === 0) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>No Engagements</h1>
            <p className="consulting-hero-subtitle">You haven't started a consulting engagement yet.</p>
          </div>
          <div className="consulting-cta">
            <Link to="/consulting/intake" className="consulting-begin-btn">Begin Your Intake</Link>
          </div>
        </div>
      </div>
    );
  }

  // Multiple engagements, none selected
  if (!engagement && engagements.length > 1) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero" style={{ marginBottom: 24, padding: '20px 0' }}>
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Your Engagements</h1>
          </div>
          <div className="consulting-dash-eng-list">
            {engagements.map(eng => {
              const active = (eng.stages || []).find(s => s.status === 'active');
              const done = (eng.stages || []).filter(s => s.status === 'completed').length;
              return (
                <div
                  key={eng.id}
                  className="consulting-dash-eng-card"
                  onClick={() => { setEngagement(eng); navigate(`/consulting/engagement/${eng.id}`, { replace: true }); }}
                >
                  <div className="consulting-dash-eng-card-title">{eng.title || 'Untitled Engagement'}</div>
                  <div className="consulting-dash-eng-card-meta">
                    <span>{eng.status}</span>
                    {eng.archetype && <span>{eng.archetype}</span>}
                    {active && <span>{active.label}</span>}
                    <span>{done}/{(eng.stages || []).length} stages</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="consulting-cta">
            <Link to="/consulting/intake" className="consulting-begin-btn">Begin New Intake</Link>
          </div>
        </div>
      </div>
    );
  }

  // Session mode — inline chat
  if (sessionMode && engagement && selectedStage) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <ConsultingSessionChat
            engagement={engagement}
            stage={selectedStage}
            onClose={async () => {
              setSessionMode(false);
              await refreshEngagement();
            }}
            trackElement={trackElement}
          />
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="consulting-page">
      <div className="consulting-dash">
        {/* Header */}
        <div className="consulting-dash-header">
          <h1 className="consulting-dash-title">{engagement.title || 'Mythic Narrative Engagement'}</h1>
          {engagement.archetype && (
            <div className="consulting-dash-archetype">{engagement.archetype}</div>
          )}
          <span
            className="consulting-dash-status"
            style={{
              color: engagement.status === 'active' ? '#5bd97a' : engagement.status === 'completed' ? '#7a5bd9' : '#d9a55b',
              border: `1px solid ${engagement.status === 'active' ? 'rgba(91,217,122,0.3)' : engagement.status === 'completed' ? 'rgba(122,91,217,0.3)' : 'rgba(217,165,91,0.3)'}`,
            }}
          >
            {engagement.status}
          </span>
          {engagements.length > 1 && (
            <button
              onClick={() => { setEngagement(null); navigate('/consulting/dashboard', { replace: true }); }}
              style={{
                marginLeft: 12,
                font: '0.65rem Cinzel, serif',
                color: 'var(--text-secondary)',
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              All Engagements
            </button>
          )}
        </div>

        {/* Natal chart / Chronosphaera diagnostic */}
        {engagement.natalData && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(26,26,36,0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--accent-gold)',
              marginBottom: 6,
            }}>
              Natal Correspondences
            </div>
            <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {engagement.natalData.sunSign && <span>Sun in {engagement.natalData.sunSign}</span>}
              {engagement.natalData.moonSign && <span> &mdash; Moon in {engagement.natalData.moonSign}</span>}
              {engagement.natalData.risingSign && <span> &mdash; Rising {engagement.natalData.risingSign}</span>}
            </div>
            {engagement.natalData.dominantPlanet && (
              <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Dominant planet: {engagement.natalData.dominantPlanet}
              </div>
            )}
            <Link
              to="/chronosphaera"
              style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.8rem', color: 'var(--accent-steel)', marginTop: 6, display: 'inline-block' }}
            >
              Explore in Chronosphaera
            </Link>
          </div>
        )}

        {/* Intake narrative */}
        {engagement.intakeNotes && (
          <div className="consulting-dash-intake">
            <div className="consulting-dash-intake-label">Mythic Assessment</div>
            <div className="consulting-dash-intake-text">{engagement.intakeNotes}</div>
          </div>
        )}

        {/* Stage progression */}
        <div className="consulting-dash-stages">
          <div className="consulting-dash-stages-label">
            Journey — {completedCount} of {stages.length} stages
          </div>
          <div className="consulting-dash-stage-list">
            {stages.map((stage, i) => (
              <div
                key={stage.id}
                className={`consulting-dash-stage ${stage.status}${selectedStageId === stage.id ? ' selected' : ''}`}
                onClick={() => setSelectedStageId(stage.id)}
              >
                <div className={`consulting-dash-stage-dot ${stage.status}`} />
                <div style={{ flex: 1 }}>
                  <div className="consulting-dash-stage-label">
                    {i + 1}. {stage.label}
                  </div>
                  {(selectedStageId === stage.id || stage.status === 'active') && stage.description && (
                    <div className="consulting-dash-stage-desc">{stage.description}</div>
                  )}
                </div>
                <div className="consulting-dash-stage-status">{stage.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected stage detail */}
        {selectedStage && (
          <div className="consulting-dash-detail">
            <div className="consulting-dash-detail-title">{selectedStage.label}</div>
            {selectedStage.description && (
              <div className="consulting-dash-detail-desc">{selectedStage.description}</div>
            )}

            {/* Begin session button */}
            {selectedStage.status === 'active' && (engagement.status === 'active' || engagement.status === 'intake') && (
              <button
                className="consulting-session-btn"
                onClick={() => setSessionMode(true)}
              >
                Begin Session
              </button>
            )}

            {/* Artifacts for this stage */}
            {stageArtifacts.length > 0 && (
              <div className="consulting-dash-artifacts">
                <div className="consulting-dash-artifacts-title">
                  Artifacts ({stageArtifacts.length})
                </div>
                {stageArtifacts.map((art, i) => (
                  <div key={i} className="consulting-dash-artifact">
                    <div className="consulting-dash-artifact-type">{art.type}</div>
                    <div className="consulting-dash-artifact-content">{art.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Session history for this stage */}
            {stageSessions.length > 0 && (
              <div className="consulting-dash-sessions">
                <div className="consulting-dash-sessions-title">
                  Sessions ({stageSessions.length})
                </div>
                {stageSessions.map(sess => (
                  <div key={sess.id} className="consulting-dash-session-item">
                    <span className="consulting-dash-session-date">
                      {sess.createdAt?.seconds
                        ? new Date(sess.createdAt.seconds * 1000).toLocaleDateString()
                        : 'Unknown date'}
                    </span>
                    <span>{(sess.messages || []).length} messages</span>
                    {(sess.artifacts || []).length > 0 && (
                      <span className="consulting-dash-session-artifacts">
                        {(sess.artifacts || []).length} artifacts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Synthesis — available after all stages complete */}
        {allComplete && (
          <div className="consulting-dash-synthesis">
            <div className="consulting-dash-synthesis-title">The Narrative of Your Transformation</div>
            {synthesis ? (
              <div className="consulting-dash-synthesis-text">{synthesis}</div>
            ) : (
              <button
                className="consulting-session-btn"
                onClick={generateSynthesis}
                disabled={synthesisLoading}
                style={{ marginTop: 8 }}
              >
                {synthesisLoading ? 'Weaving your narrative...' : 'Generate Synthesis'}
              </button>
            )}
          </div>
        )}

        {/* Forge Your Story — link to Story Forge with engagement context */}
        {sessions.length > 0 && (
          <div style={{ padding: '16px 0', borderTop: '1px solid var(--border-subtle)', marginTop: 16 }}>
            <Link
              to={`/consulting/forge/${engagement.id}`}
              className="consulting-session-btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Forge Your Story
            </Link>
            <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Use the Story Forge to craft the narrative of your transformation from your engagement material.
            </div>
          </div>
        )}

        {/* Journey link */}
        {engagement.clientType && (
          <div style={{ padding: '8px 0' }}>
            <Link
              to={`/journey/consulting-${engagement.clientType === 'artist' || engagement.clientType === 'creator' ? 'storyteller' : engagement.clientType === 'leader' ? 'brand' : engagement.clientType}`}
              style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.85rem', color: 'var(--accent-gold)', textDecoration: 'none' }}
            >
              Walk the {engagement.clientType === 'artist' || engagement.clientType === 'creator' ? 'Storyteller' : engagement.clientType === 'leader' ? 'Brand' : engagement.clientType.charAt(0).toUpperCase() + engagement.clientType.slice(1)} Journey on the Ouroboros
            </Link>
          </div>
        )}

        {/* New intake CTA */}
        <div className="consulting-cta" style={{ padding: '24px 0' }}>
          <Link to="/consulting" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'Crimson Pro, serif' }}>
            Back to Consulting
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline session chat component
// ─────────────────────────────────────────────────────────────

function ConsultingSessionChat({ engagement, stage, onClose, trackElement }) {
  const { saveConversation, getConversation, loaded: writingsLoaded } = useWritings();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [stageCompleted, setStageCompleted] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);
  const { user } = useAuth();
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);

  const conversationKey = `consulting-session-${engagement.id}-${stage.id}`;

  // Load previous session conversation
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
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const saveSessionToApi = useCallback(async () => {
    if (!user || !engagement?.id) return;
    const duration = Math.round((Date.now() - sessionStartRef.current) / 60000);
    try {
      const token = await user.getIdToken();
      await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'save-session',
          engagementId: engagement.id,
          stageId: stage.id,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          artifacts,
          duration,
        }),
      });
      // Track in coursework
      trackElement(`consulting.${engagement.id}.session.completed`);
      if (artifacts.length > 0) {
        trackElement(`consulting.${engagement.id}.artifact.captured`);
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, [user, engagement?.id, stage.id, messages, artifacts, trackElement]);

  const handleStageComplete = useCallback(async () => {
    if (!user || !engagement?.id) return;
    try {
      const token = await user.getIdToken();
      await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'update-engagement-status',
          engagementId: engagement.id,
          stageId: stage.id,
          stageStatus: 'completed',
        }),
      });
      trackElement(`consulting.${engagement.id}.stage.${stage.id}.completed`);
      setStageCompleted(true);
    } catch (err) {
      console.error('Failed to complete stage:', err);
    }
  }, [user, engagement?.id, stage.id, trackElement]);

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
          mode: 'consulting-session',
          engagementContext: {
            title: engagement.title,
            archetype: engagement.archetype,
            intakeNotes: engagement.intakeNotes,
            natalData: engagement.natalData || null,
            currentStage: stage,
          },
        }),
      });
      const data = await res.json();

      const reply = data.reply || 'I see.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);

      // Capture artifacts
      if (data.artifacts && data.artifacts.length > 0) {
        setArtifacts(prev => [...prev, ...data.artifacts]);
      }

      // Handle stage completion
      if (data.stageComplete) {
        await handleStageComplete();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  // Auto-start
  useEffect(() => {
    if (!startedRef.current && messages.length === 0) {
      startedRef.current = true;
      const seed = `I'm ready to work on the "${stage.label}" stage of my engagement.`;
      setMessages([{ role: 'user', content: seed, hidden: true }]);
      setLoading(true);

      (async () => {
        try {
          const res = await apiFetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: seed }],
              mode: 'consulting-session',
              engagementContext: {
                title: engagement.title,
                archetype: engagement.archetype,
                intakeNotes: engagement.intakeNotes,
                currentStage: stage,
              },
            }),
          });
          const data = await res.json();
          const reply = data.reply || 'Let us begin.';
          setMessages([
            { role: 'user', content: seed, hidden: true },
            { role: 'assistant', content: reply },
          ]);
          speak(reply);
        } catch {
          setMessages([{ role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        }
        setLoading(false);
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = async () => {
    await saveSessionToApi();
    onClose();
  };

  const visibleMessages = messages.filter(m => !m.hidden);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={handleClose}
          style={{
            font: '0.7rem Cinzel, serif',
            color: 'var(--text-secondary)',
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Save & Close Session
        </button>
        <span style={{ font: '1rem Cinzel, serif', color: 'var(--accent-ember)' }}>
          {stage.label}
        </span>
        {stageCompleted && (
          <span style={{ font: '0.65rem Cinzel, serif', color: '#5bd97a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Stage Complete
          </span>
        )}
      </div>

      {/* Artifacts captured this session */}
      {artifacts.length > 0 && (
        <div className="consulting-dash-artifacts" style={{ marginBottom: 16 }}>
          <div className="consulting-dash-artifacts-title">Artifacts This Session ({artifacts.length})</div>
          {artifacts.map((art, i) => (
            <div key={i} className="consulting-dash-artifact">
              <div className="consulting-dash-artifact-type">{art.type}</div>
              <div className="consulting-dash-artifact-content">{art.content}</div>
            </div>
          ))}
        </div>
      )}

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
              <div className="chat-msg-content chat-loading">Atlas is present...</div>
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
      </div>
    </>
  );
}
