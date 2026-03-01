import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function FriendConversationList({ conversations, activeId, onSelect }) {
  const { user } = useAuth();

  if (conversations.length === 0) {
    return (
      <div className="friends-conv-list">
        <p className="friends-conv-empty">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="friends-conv-list">
      {conversations.map(conv => {
        const otherUid = (conv.participantUids || []).find(uid => uid !== user?.uid);
        const otherHandle = otherUid ? conv.participantHandles?.[otherUid] : '...';
        const otherPhoto = otherUid ? conv.participantPhotos?.[otherUid] : null;
        const isUnread = user && (conv.unreadBy || []).includes(user.uid);
        const isActive = conv.id === activeId;

        return (
          <div
            key={conv.id}
            className={`friends-conv-item${isActive ? ' active' : ''}${isUnread ? ' unread' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            {otherPhoto ? (
              <img src={otherPhoto} alt="" className="friends-conv-avatar" />
            ) : (
              <div className="friends-conv-avatar friends-conv-avatar-placeholder">
                {(otherHandle || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="friends-conv-info">
              <div className="friends-conv-handle">@{otherHandle}</div>
              <div className="friends-conv-preview">
                {conv.lastMessage || 'No messages yet'}
              </div>
            </div>
            {isUnread && <div className="friends-conv-unread-dot" />}
          </div>
        );
      })}
    </div>
  );
}
