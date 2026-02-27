import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ms = timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0);
  if (!ms) return '';
  const diff = now - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * StageMoments — shows others' completion posts for a given journey stage.
 * Collapsible section: "Others who passed this way"
 *
 * @param {string} journeyId — e.g. 'cosmic-journey', 'wheel-of-stories'
 * @param {string} [stageId] — optional stage/stop filter (client-side)
 */
export default function StageMoments({ journeyId, stageId }) {
  const { user } = useAuth();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!db || !firebaseConfigured || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchMoments() {
      try {
        const q = query(
          collection(db, 'fellowship-posts'),
          where('completionType', '==', 'journey'),
          orderBy('createdAt', 'desc'),
          limit(10),
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const items = [];
        snap.forEach(d => {
          const data = d.data();
          // Client-side filter by journey ID
          if (data.completionId && data.completionId.includes(journeyId)) {
            if (!stageId || data.completionId.includes(stageId)) {
              items.push({ id: d.id, ...data });
            }
          }
        });
        // Exclude self
        const filtered = items.filter(m => m.authorUid !== user.uid);
        setMoments(filtered.slice(0, 5));
      } catch (err) {
        console.error('Failed to load stage moments:', err);
      }
      if (!cancelled) setLoading(false);
    }
    fetchMoments();
    return () => { cancelled = true; };
  }, [journeyId, stageId, user]);

  if (loading || moments.length === 0) return null;

  return (
    <div className="stage-moments">
      <button
        className="stage-moments-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        Others who passed this way ({moments.length})
      </button>

      {expanded && (
        <div className="stage-moments-list">
          {moments.map(m => (
            <div key={m.id} className="stage-moment-card">
              <div className="stage-moment-author">
                {m.authorHandle || m.authorName || 'Anonymous'}
                <span className="stage-moment-time">{timeAgo(m.createdAt)}</span>
              </div>
              <div className="stage-moment-summary">{m.summary}</div>
            </div>
          ))}
          {moments.length >= 5 && (
            <div className="stage-moments-more">More stories have been told here...</div>
          )}
        </div>
      )}
    </div>
  );
}
