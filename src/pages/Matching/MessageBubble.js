import React from 'react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessageBubble({ message, isMine }) {
  if (message.type === 'ai-match') {
    return (
      <div className="message-bubble message-bubble-ai">
        <span className="message-bubble-ai-label">Atlas Story Match</span>
        {message.text}
        <div className="message-bubble-time">{formatTime(message.createdAt)}</div>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isMine ? 'message-bubble-mine' : 'message-bubble-theirs'}`}>
      {!isMine && (
        <div className="message-bubble-sender">@{message.senderHandle}</div>
      )}
      {message.text}
      <div className="message-bubble-time">{formatTime(message.createdAt)}</div>
    </div>
  );
}
