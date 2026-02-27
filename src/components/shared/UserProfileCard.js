import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useFriendRequests } from '../../contexts/FriendRequestsContext';
import './UserProfileCard.css';

export default function UserProfileCard({ uid, onClose }) {
  const { user } = useAuth();
  const { friends, connectedUids, sendRequest } = useFriendRequests();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const cardRef = useRef(null);

  // Load user profile
  useEffect(() => {
    if (!uid || !db) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const ref = doc(db, 'users', uid, 'meta', 'profile');
        const snap = await getDoc(ref);
        if (!cancelled) setProfile(snap.exists() ? snap.data() : null);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [uid]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const isSelf = user?.uid === uid;
  const isConnected = connectedUids?.has(uid);
  const isFriend = friends?.some(f => f.uid === uid);

  const handleAddFriend = async () => {
    if (!user || !profile || sending) return;
    setSending(true);
    try {
      const handle = profile.handle || profile.displayName || '';
      const senderHandle = user.displayName || '';
      await sendRequest(uid, handle, senderHandle);
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
    setSending(false);
  };

  const initial = (profile?.handle || profile?.displayName || 'U').charAt(0).toUpperCase();
  const displayName = profile?.displayName || profile?.handle || 'Unknown';
  const handle = profile?.handle;

  // Account age
  const createdAt = profile?.createdAt;
  let accountAge = '';
  if (createdAt) {
    const ms = createdAt.toMillis?.() || (createdAt.seconds ? createdAt.seconds * 1000 : Date.parse(createdAt));
    if (ms) {
      const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
      if (days < 30) accountAge = `Joined ${days}d ago`;
      else if (days < 365) accountAge = `Joined ${Math.floor(days / 30)}mo ago`;
      else accountAge = `Joined ${Math.floor(days / 365)}y ago`;
    }
  }

  // Top 3 credentials
  const credentials = profile?.credentials
    ? Object.entries(profile.credentials).slice(0, 3)
    : [];

  const isMentor = profile?.mentorStatus === 'active';

  return (
    <div className="user-profile-card" ref={cardRef}>
      <button className="user-profile-card-close" onClick={onClose}>&times;</button>

      <div className="user-profile-card-avatar">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="user-profile-card-avatar-img" />
        ) : (
          <span className="user-profile-card-avatar-initial">{initial}</span>
        )}
      </div>

      {loading ? (
        <div className="user-profile-card-loading">Loading...</div>
      ) : (
        <>
          <div className="user-profile-card-name">{displayName}</div>
          {handle && <div className="user-profile-card-handle">@{handle}</div>}

          {isMentor && <div className="user-profile-card-badge">Mentor</div>}

          {credentials.length > 0 && (
            <div className="user-profile-card-credentials">
              {credentials.map(([cat, data]) => (
                <div key={cat} className="user-profile-card-cred">
                  {cat}: L{data.level || 1}
                </div>
              ))}
            </div>
          )}

          {accountAge && <div className="user-profile-card-age">{accountAge}</div>}

          {!isSelf && !isConnected && !isFriend && (
            <button
              className="user-profile-card-action"
              onClick={handleAddFriend}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Add Friend'}
            </button>
          )}
          {!isSelf && isFriend && (
            <div className="user-profile-card-status">Friends</div>
          )}
          {!isSelf && isConnected && !isFriend && (
            <div className="user-profile-card-status">Request pending</div>
          )}
        </>
      )}
    </div>
  );
}
