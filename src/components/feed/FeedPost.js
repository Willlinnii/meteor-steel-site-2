import React, { useState } from 'react';
import LinkPreview from './LinkPreview';

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
  const [confirming, setConfirming] = useState(false);

  const isAuthor = post.createdBy === currentUid;
  const circledBy = post.circledBy || [];
  const isCircled = currentUid && circledBy.includes(currentUid);
  const circleCount = circledBy.length;

  return (
    <div className={`feed-post${isCircled ? ' circled' : ''}`}>
      <div className="feed-post-header">
        <div className="feed-post-avatar">
          {post.createdByPhoto ? (
            <img src={post.createdByPhoto} alt="" className="feed-post-avatar-img" />
          ) : (
            <span className="feed-post-avatar-initial">
              {(post.createdByName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="feed-post-meta">
          <span className="feed-post-author">{post.createdByName || 'Anonymous'}</span>
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
      </div>
    </div>
  );
}
