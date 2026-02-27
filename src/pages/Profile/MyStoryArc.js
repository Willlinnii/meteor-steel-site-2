import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import './MyStoryArc.css';

const ARC_PHASES = [
  { id: 'golden-age', label: 'Surface', index: 0 },
  { id: 'falling-star', label: 'Calling', index: 1 },
  { id: 'impact-crater', label: 'Crossing', index: 2 },
  { id: 'forge', label: 'Initiating', index: 3 },
  { id: 'quenching', label: 'Nadir', index: 4 },
  { id: 'integration', label: 'Return', index: 5 },
  { id: 'drawing', label: 'Arrival', index: 6 },
  { id: 'new-age', label: 'Renewal', index: 7 },
];

/**
 * MyStoryArc — visual 8-phase monomyth arc on the Profile page.
 * Shows which phases the user has visited or completed based on
 * fellowship posts and coursework progress.
 */
export default function MyStoryArc() {
  const { user } = useAuth();
  const { getProgress } = useCoursework();
  const [expanded, setExpanded] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user's fellowship posts (completions only)
  useEffect(() => {
    if (!user || !db || !firebaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchPosts() {
      try {
        const q = query(
          collection(db, 'fellowship-posts'),
          where('authorUid', '==', user.uid),
          where('type', '==', 'completion-share'),
          orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setPosts(items);
      } catch (err) {
        console.error('Failed to load story arc posts:', err);
      }
      if (!cancelled) setLoading(false);
    }
    fetchPosts();
    return () => { cancelled = true; };
  }, [user]);

  // Map posts + coursework to phase states
  const phaseStates = useMemo(() => {
    const states = {};
    ARC_PHASES.forEach(p => { states[p.id] = { visited: false, hasStory: false, post: null }; });

    // Check coursework progress for monomyth elements
    const monomythProgress = getProgress?.('monomyth');
    if (monomythProgress?.elements) {
      for (const [key] of Object.entries(monomythProgress.elements)) {
        // keys like "monomyth.theorists.forge.campbell" — extract stage
        const parts = key.split('.');
        for (const part of parts) {
          if (states[part]) {
            states[part].visited = true;
            break;
          }
        }
      }
    }

    // Check fellowship posts for journey completions
    for (const post of posts) {
      const cid = post.completionId || '';
      // Try to match completionId to a phase
      for (const phase of ARC_PHASES) {
        if (cid.includes(phase.id) || cid.includes(phase.label.toLowerCase())) {
          states[phase.id].visited = true;
          states[phase.id].hasStory = true;
          if (!states[phase.id].post) {
            states[phase.id].post = post;
          }
          break;
        }
      }
      // Also map by completionType + generic journey stages
      if (post.completionType === 'journey') {
        // Mark as visited if no specific phase match
        const stageIdx = posts.indexOf(post) % ARC_PHASES.length;
        const phase = ARC_PHASES[stageIdx];
        if (phase && !states[phase.id].visited) {
          states[phase.id].visited = true;
          states[phase.id].hasStory = !!post.summary;
          if (!states[phase.id].post) states[phase.id].post = post;
        }
      }
    }

    return states;
  }, [posts, getProgress]);

  if (loading) return null;

  const hasAnyContent = Object.values(phaseStates).some(s => s.visited);

  return (
    <div className="story-arc-section">
      <button
        className="story-arc-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="story-arc-title">My Story Arc</span>
        <span className="story-arc-arrow">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="story-arc-content">
          {!hasAnyContent && (
            <p className="story-arc-empty">
              Your arc is empty. Complete journeys and share your stories to illuminate the path.
            </p>
          )}

          <div className="story-arc-track">
            <div className="story-arc-line" />
            {ARC_PHASES.map((phase) => {
              const state = phaseStates[phase.id];
              const stateClass = state.hasStory ? 'completed' : state.visited ? 'visited' : 'empty';
              const isSelected = selectedPhase === phase.id;

              return (
                <button
                  key={phase.id}
                  className={`story-arc-node ${stateClass}${isSelected ? ' selected' : ''}`}
                  onClick={() => {
                    if (state.hasStory) {
                      setSelectedPhase(isSelected ? null : phase.id);
                    }
                  }}
                  title={`${phase.label}${state.hasStory ? ' — click to read' : state.visited ? ' — visited' : ''}`}
                >
                  <span className="story-arc-dot" />
                  <span className="story-arc-label">{phase.label}</span>
                </button>
              );
            })}
          </div>

          {selectedPhase && phaseStates[selectedPhase]?.post && (
            <div className="story-arc-detail">
              <div className="story-arc-detail-label">
                {ARC_PHASES.find(p => p.id === selectedPhase)?.label}
              </div>
              <div className="story-arc-detail-summary">
                {phaseStates[selectedPhase].post.summary}
              </div>
              <button className="story-arc-detail-close" onClick={() => setSelectedPhase(null)}>
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
