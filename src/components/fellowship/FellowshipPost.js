import React, { useState } from 'react';
import FELLOWSHIP_TYPES from '../../data/fellowshipTypes';
import UserProfileCard from '../shared/UserProfileCard';
import { getWatermark } from '../../utils/cosmologicalWatermark';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ms = typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0);
  if (!ms) return '';
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

const VISIBILITY_ICONS = {
  vault: '\u{1F512}',
  profile: '\u{1F4CB}',
  friends: '\u{1F465}',
  family: '\u{1F3E0}',
  public: '\u{1F310}',
};

export default function FellowshipPost({ post, currentUid, onDelete, onCircle }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const isAuthor = post.authorUid === currentUid;
  const typeDef = FELLOWSHIP_TYPES[post.completionType] || null;
  const circledBy = post.circledBy || [];
  const isCircled = currentUid && circledBy.includes(currentUid);
  const circleCount = circledBy.length;
  const visIcon = isAuthor ? VISIBILITY_ICONS[post.visibility || 'friends'] : null;

  // Watermark
  const postMs = post.createdAt?.toMillis?.() || (post.createdAt?.seconds ? post.createdAt.seconds * 1000 : 0);
  const watermark = postMs ? getWatermark(new Date(postMs)) : null;

  return (
    <div className={`fellowship-post${isCircled ? ' circled' : ''}`}>
      <div className="fellowship-post-header">
        <div className="fellowship-post-avatar">
          {post.authorPhotoURL ? (
            <img src={post.authorPhotoURL} alt="" className="fellowship-post-avatar-img" />
          ) : (
            <span className="fellowship-post-avatar-initial">
              {(post.authorHandle || post.authorName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="fellowship-post-meta">
          <button
            className="fellowship-post-author fellowship-post-author-clickable"
            onClick={() => setShowProfile(true)}
          >
            {post.authorHandle || post.authorName || 'Anonymous'}
          </button>
          <span className="fellowship-post-time">
            {timeAgo(post.createdAt)}
            {visIcon && <span className="fellowship-post-vis-badge" title={post.visibility || 'friends'}>{visIcon}</span>}
          </span>
        </div>
        {isAuthor && (
          <div className="fellowship-post-actions">
            {confirming ? (
              <>
                <button className="fellowship-post-delete-confirm" onClick={() => { onDelete(post.id); setConfirming(false); }}>
                  Delete
                </button>
                <button className="fellowship-post-delete-cancel" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="fellowship-post-delete-btn" onClick={() => setConfirming(true)} title="Delete post">
                &times;
              </button>
            )}
          </div>
        )}
      </div>

      {showProfile && (
        <UserProfileCard
          uid={post.authorUid}
          onClose={() => setShowProfile(false)}
        />
      )}

      {typeDef && (
        <div className="fellowship-post-badge" style={{ color: typeDef.color, borderColor: typeDef.color }}>
          <span className="fellowship-post-badge-icon">{typeDef.icon}</span>
          <span className="fellowship-post-badge-label">{post.completionLabel || typeDef.label}</span>
        </div>
      )}

      {post.summary && (
        <div className="fellowship-post-summary">{post.summary}</div>
      )}

      {post.fullStory && (
        <>
          <button className="fellowship-post-expand" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Read full story...'}
          </button>
          {expanded && (
            <div className="fellowship-post-story">
              {post.fullStory.split('\n').map((line, i) => (
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {post.images?.length > 0 && (
        <div className="fellowship-post-images">
          {post.images.map((img, i) => (
            <img key={i} src={img.url} alt={img.name || ''} className="fellowship-post-image" loading="lazy" />
          ))}
        </div>
      )}

      {post.videoURL && (
        <div className="fellowship-post-video">
          <a href={post.videoURL} target="_blank" rel="noopener noreferrer">
            Watch video
          </a>
        </div>
      )}

      {watermark && (
        <div className="feed-post-watermark">{watermark.dayLabel} · {watermark.monthLabel}</div>
      )}

      <div className="fellowship-post-footer">
        <button
          className={`fellowship-circle-btn${isCircled ? ' active' : ''}`}
          onClick={() => onCircle?.(post.id)}
          title={isCircled ? 'Remove from your circle' : 'Add to your circle'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
          </svg>
          {circleCount > 0 && <span className="fellowship-circle-count">{circleCount}</span>}
        </button>
      </div>
    </div>
  );
}
