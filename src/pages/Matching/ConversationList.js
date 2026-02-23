import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function ConversationList({ conversations, activeId, onSelect }) {
  const { user } = useAuth();

  if (conversations.length === 0) {
    return (
      <div className="conversation-list">
        <p className="messages-empty">No conversations yet. Accept a match request to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map(conv => {
        const otherUid = (conv.participantUids || []).find(uid => uid !== user?.uid);
        const otherHandle = otherUid ? conv.participantHandles?.[otherUid] : '...';
        const otherPhoto = otherUid ? conv.participantPhotos?.[otherUid] : null;
        const isUnread = user && (conv.unreadBy || []).includes(user.uid);
        const isActive = conv.id === activeId;

        return (
          <div
            key={conv.id}
            className={`conversation-list-item${isActive ? ' active' : ''}${isUnread ? ' conversation-list-unread' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            {otherPhoto ? (
              <img src={otherPhoto} alt="" className="conversation-list-avatar" />
            ) : (
              <div className="conversation-list-avatar conversation-list-avatar-placeholder">
                {(otherHandle || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="conversation-list-info">
              <div className="conversation-list-handle">@{otherHandle}</div>
              <div className="conversation-list-preview">
                {conv.lastMessage || 'No messages yet'}
              </div>
            </div>
            {isUnread && <div className="conversation-list-unread-dot" />}
          </div>
        );
      })}
    </div>
  );
}
