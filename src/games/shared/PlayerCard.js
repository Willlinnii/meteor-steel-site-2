import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

export default function PlayerCard({ uid, handle, isActive, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) { setLoading(false); return; }

    let cancelled = false;
    async function load() {
      try {
        const ref = doc(db, 'users', uid, 'meta', 'profile');
        const snap = await getDoc(ref);
        if (!cancelled) setProfile(snap.exists() ? snap.data() : null);
      } catch (err) {
        console.error('Failed to load player profile:', err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [uid]);

  const initial = (handle || 'P').charAt(0).toUpperCase();

  return (
    <div className={`player-card-popup${isActive ? ' active' : ''}`}>
      <button className="player-card-close" onClick={onClose}>&times;</button>
      <div className="player-card-avatar">{initial}</div>
      <div className="player-card-handle">@{handle}</div>
      {loading && <div className="player-card-loading">Loading...</div>}
      {!loading && profile?.credentials && (
        <div className="player-card-credentials">
          {Object.entries(profile.credentials).slice(0, 3).map(([cat, data]) => (
            <div key={cat} className="player-card-cred">
              {cat}: L{data.level || 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
