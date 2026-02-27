import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import LinkPreview from './LinkPreview';
import UserProfileCard from '../shared/UserProfileCard';
import { getWatermark } from '../../utils/cosmologicalWatermark';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ms = typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || timestamp.seconds * 1000;
  const diff = now - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedPost({ post, currentUid, onDelete, onCircle }) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Replies state
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyPosting, setReplyPosting] = useState(false);

  const isAuthor = post.createdBy === currentUid;
  const circledBy = post.circledBy || [];
  const isCircled = currentUid && circledBy.includes(currentUid);
  const circleCount = circledBy.length;

  // Watermark
  const postMs = post.createdAt?.toMillis?.() || (post.createdAt?.seconds ? post.createdAt.seconds * 1000 : 0);
  const watermark = postMs ? getWatermark(new Date(postMs)) : null;

  // Load replies when expanded
  useEffect(() => {
    if (!showReplies || !db || !post.id) return;
    const q = query(
      collection(db, 'community-posts', post.id, 'replies'),
      orderBy('createdAt', 'asc'),
      limit(20),
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setReplies(items);
    });
    return unsub;
  }, [showReplies, post.id]);

  // Submit reply
  const handleReply = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed || !user || !db || replyPosting) return;
    setReplyPosting(true);
    try {
      await addDoc(collection(db, 'community-posts', post.id, 'replies'), {
        text: trimmed,
        createdBy: user.uid,
        createdByName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(),
      });
      setReplyText('');
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
    setReplyPosting(false);
  }, [replyText, user, post.id, replyPosting]);

  // Delete reply
  const handleDeleteReply = useCallback(async (replyId) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'community-posts', post.id, 'replies', replyId));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  }, [post.id]);

  return (
    <div className={`feed-post${isCircled ? ' circled' : ''}`}>
      <div className="feed-post-header">
        <div className="feed-post-avatar" style={{ position: 'relative' }}>
          {post.createdByPhoto ? (
            <img src={post.createdByPhoto} alt="" className="feed-post-avatar-img" />
          ) : (
            <span className="feed-post-avatar-initial">
              {(post.createdByName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="feed-post-meta">
          <button
            className="feed-post-author feed-post-author-clickable"
            onClick={() => setShowProfile(true)}
          >
            {post.createdByName || 'Anonymous'}
          </button>
          <span className="feed-post-time">{timeAgo(post.createdAt)}</span>
        </div>
        {isAuthor && (
          <div className="feed-post-actions">
            {confirming ? (
              <>
                <button className="feed-post-delete-confirm" onClick={() => { onDelete(post.id); setConfirming(false); }}>
                  Delete
                </button>
                <button className="feed-post-delete-cancel" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="feed-post-delete-btn" onClick={() => setConfirming(true)} title="Delete post">
                &times;
              </button>
            )}
          </div>
        )}
      </div>

      {showProfile && (
        <UserProfileCard
          uid={post.createdBy}
          onClose={() => setShowProfile(false)}
        />
      )}

      {post.text && (
        <div className="feed-post-body">{post.text}</div>
      )}

      {post.images?.length > 0 && (
        <div className="feed-post-images">
          {post.images.map((img, i) => (
            <img key={i} src={img.url} alt={img.name || ''} className="feed-post-image" />
          ))}
        </div>
      )}

      {post.link && <LinkPreview url={post.link} />}

      {watermark && (
        <div className="feed-post-watermark">{watermark.dayLabel} · {watermark.monthLabel}</div>
      )}

      <div className="feed-post-footer">
        <button
          className={`feed-circle-btn${isCircled ? ' active' : ''}`}
          onClick={() => onCircle?.(post.id)}
          title={isCircled ? 'Remove from your circle' : 'Add to your circle'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
          </svg>
          {circleCount > 0 && <span className="feed-circle-count">{circleCount}</span>}
        </button>

        <button
          className="feed-reply-toggle"
          onClick={() => setShowReplies(!showReplies)}
        >
          {showReplies ? 'Hide replies' : `${replies.length || ''} Reply`}
        </button>
      </div>

      {/* Replies Section */}
      {showReplies && (
        <div className="feed-replies-section">
          {replies.map(r => (
            <div key={r.id} className="feed-reply">
              <div className="feed-reply-header">
                <span className="feed-reply-author">{r.createdByName || 'Anonymous'}</span>
                <span className="feed-reply-time">{timeAgo(r.createdAt)}</span>
                {r.createdBy === currentUid && (
                  <button className="feed-reply-delete" onClick={() => handleDeleteReply(r.id)}>&times;</button>
                )}
              </div>
              <div className="feed-reply-text">{r.text}</div>
            </div>
          ))}
          {user && (
            <div className="feed-reply-composer">
              <input
                className="feed-reply-input"
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
              />
              <button
                className="feed-reply-submit"
                disabled={!replyText.trim() || replyPosting}
                onClick={handleReply}
              >
                Reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
