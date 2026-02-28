import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { apiFetch } from '../../lib/chatApi';
import './ConsultingPage.css';
import './ConsultingDashboardPage.css';

const STATUS_COLORS = {
  intake: '#d9a55b',
  active: '#5bd97a',
  paused: '#a8a8b8',
  completing: '#5b8dd9',
  completed: '#7a5bd9',
  archived: '#6a6a7a',
};

export default function PractitionerDashboardPage() {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();

  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [sessions, setSessions] = useState({});

  const consultantLevel = profileData?.credentials?.consultant?.level || 0;

  const loadEngagements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-practitioner-engagements' }),
      });
      const data = await res.json();
      if (data.success) setEngagements(data.engagements || []);
    } catch (err) {
      console.error('Failed to load practitioner engagements:', err);
    }
    setLoading(false);
  }, [user]);

  const loadSessions = useCallback(async (engagementId) => {
    if (!user || sessions[engagementId]) return;
    try {
      const token = await user.getIdToken();
      const res = await apiFetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-sessions', engagementId }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(prev => ({ ...prev, [engagementId]: data.sessions || [] }));
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [user, sessions]);

  useEffect(() => { loadEngagements(); }, [loadEngagements]);

  const handleExpand = (engId) => {
    if (expandedId === engId) {
      setExpandedId(null);
    } else {
      setExpandedId(engId);
      loadSessions(engId);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    engagements.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return counts;
  }, [engagements]);

  const sorted = useMemo(() => {
    return [...engagements].sort((a, b) => {
      const order = { active: 0, intake: 1, paused: 2, completing: 3, completed: 4, archived: 5 };
      return (order[a.status] || 9) - (order[b.status] || 9);
    });
  }, [engagements]);

  if (!user) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Practitioner Dashboard</h1>
            <p className="consulting-hero-subtitle">Please sign in.</p>
          </div>
        </div>
      </div>
    );
  }

  if (consultantLevel < 2) {
    return (
      <div className="consulting-page">
        <div className="consulting-container">
          <div className="consulting-hero">
            <h1 className="consulting-hero-title" style={{ fontSize: '1.4rem' }}>Practitioner Dashboard</h1>
            <p className="consulting-hero-subtitle">
              This dashboard is available to certified practitioners (Consultant Level 2+).
            </p>
          </div>
          <div className="consulting-cta">
            <Link to="/consulting" className="consulting-begin-btn">Learn About Consulting</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consulting-page">
      <div className="consulting-dash">
        {/* Header */}
        <div className="consulting-dash-header">
          <h1 className="consulting-dash-title">Practitioner Dashboard</h1>
          <div className="consulting-dash-archetype">
            {consultantLevel >= 3 ? 'Senior Practitioner' : 'Practitioner'} — Level {consultantLevel}
          </div>
        </div>

        {/* Summary stats */}
        {!loading && engagements.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <Stat label="Total Clients" value={engagements.length} />
            {Object.entries(statusCounts).map(([status, count]) => (
              <Stat key={status} label={status} value={count} color={STATUS_COLORS[status]} />
            ))}
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'Crimson Pro, serif', padding: '40px 0', textAlign: 'center' }}>
            Loading your clients...
          </div>
        )}

        {!loading && engagements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              No clients assigned yet. Clients can select you during their intake process,
              or an admin can assign engagements to you.
            </p>
          </div>
        )}

        {/* Client list */}
        {sorted.map(eng => {
          const expanded = expandedId === eng.id;
          const activeStage = (eng.stages || []).find(s => s.status === 'active');
          const completedCount = (eng.stages || []).filter(s => s.status === 'completed').length;
          const engSessions = sessions[eng.id] || [];

          return (
            <div key={eng.id} style={{ marginBottom: 8 }}>
              <div
                className={`consulting-dash-stage${expanded ? ' selected' : ''}`}
                onClick={() => handleExpand(eng.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-ember)' }}>
                      {eng.clientName || eng.clientHandle || 'Unknown Client'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '0.6rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: `1px solid ${STATUS_COLORS[eng.status] || '#6a6a7a'}`,
                        color: STATUS_COLORS[eng.status] || '#6a6a7a',
                      }}
                    >
                      {eng.status}
                    </span>
                    {eng.archetype && (
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'var(--accent-gold)' }}>
                        {eng.archetype}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {eng.title || 'Untitled'} — {activeStage ? activeStage.label : `${completedCount}/${(eng.stages || []).length} stages`}
                  </div>
                </div>
              </div>

              {expanded && (
                <div style={{ padding: '16px 20px', background: 'rgba(26,26,36,0.4)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border-subtle)', borderTop: 'none', marginTop: -1 }}>
                  {/* Intake notes */}
                  {eng.intakeNotes && (
                    <div className="consulting-dash-intake" style={{ marginBottom: 16 }}>
                      <div className="consulting-dash-intake-label">Intake Assessment</div>
                      <div className="consulting-dash-intake-text" style={{ fontSize: '0.9rem' }}>
                        {eng.intakeNotes.length > 500 ? eng.intakeNotes.slice(0, 500) + '...' : eng.intakeNotes}
                      </div>
                    </div>
                  )}

                  {/* Stage chips */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                    {(eng.stages || []).map(stage => (
                      <span
                        key={stage.id}
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'Cinzel, serif',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: `1px solid ${stage.status === 'completed' ? '#5bd97a' : stage.status === 'active' ? '#d9a55b' : '#3a3a4a'}`,
                          color: stage.status === 'completed' ? '#5bd97a' : stage.status === 'active' ? '#d9a55b' : '#6a6a7a',
                          background: stage.status === 'completed' ? 'rgba(91,217,122,0.08)' : stage.status === 'active' ? 'rgba(217,165,91,0.08)' : 'transparent',
                        }}
                      >
                        {stage.label}
                      </span>
                    ))}
                  </div>

                  {/* Session summary */}
                  {engSessions.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-steel)', marginBottom: 6 }}>
                        Sessions ({engSessions.length})
                      </div>
                      {engSessions.slice(0, 5).map(sess => (
                        <div key={sess.id} className="consulting-dash-session-item">
                          <span className="consulting-dash-session-date">
                            {sess.createdAt?.seconds ? new Date(sess.createdAt.seconds * 1000).toLocaleDateString() : '?'}
                          </span>
                          <span>{sess.stageId || '?'}</span>
                          <span>{(sess.messages || []).length} msgs</span>
                          {(sess.artifacts || []).length > 0 && (
                            <span className="consulting-dash-session-artifacts">{(sess.artifacts || []).length} artifacts</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="consulting-session-btn"
                      style={{ fontSize: '0.65rem', padding: '6px 16px' }}
                      onClick={() => navigate(`/consulting/engagement/${eng.id}`)}
                    >
                      View Full Engagement
                    </button>
                  </div>

                  {eng.createdAt && (
                    <div style={{ marginTop: 10, fontSize: '0.65rem', color: '#6a6a7a', fontFamily: 'Crimson Pro, serif' }}>
                      Created: {eng.createdAt?.seconds ? new Date(eng.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Back link */}
        <div className="consulting-cta" style={{ padding: '24px 0' }}>
          <Link to="/consulting" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'Crimson Pro, serif' }}>
            Back to Consulting
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(26,26,36,0.5)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      textAlign: 'center',
      minWidth: 80,
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
