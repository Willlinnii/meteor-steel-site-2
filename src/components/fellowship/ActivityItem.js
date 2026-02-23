import React from 'react';

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

const ACTIVITY_ICONS = {
  'friend-accepted': '\u{1F91D}',
};

export default function ActivityItem({ post }) {
  const icon = ACTIVITY_ICONS[post.activityType] || '\u{2728}';

  let text = post.activityMessage || '';
  if (!text && post.activityType === 'friend-accepted') {
    text = `${post.authorHandle || 'Someone'} and ${post.activityTargetHandle || 'a fellow'} are now friends`;
  }

  return (
    <div className="fellowship-activity">
      <span className="fellowship-activity-icon">{icon}</span>
      <span className="fellowship-activity-text">{text}</span>
      <span className="fellowship-activity-time">{timeAgo(post.createdAt)}</span>
    </div>
  );
}
