import React, { useState, useCallback } from 'react';
import { useFriendConversations } from '../../hooks/useFriendConversations';
import FriendConversationList from './FriendConversationList';
import FriendConversationThread from './FriendConversationThread';

export default function FriendMessagesPanel({ activeConversationId, onSelectConversation }) {
  const { conversations, loading } = useFriendConversations();
  const [localActiveId, setLocalActiveId] = useState(null);

  // External prop takes priority (from "Message" button); fall back to local selection
  const activeId = activeConversationId || localActiveId;
  const activeConversation = conversations.find(c => c.id === activeId) || null;

  const handleSelect = useCallback((convId) => {
    setLocalActiveId(convId);
    if (onSelectConversation) onSelectConversation(convId);
  }, [onSelectConversation]);

  const handleBack = useCallback(() => {
    setLocalActiveId(null);
    if (onSelectConversation) onSelectConversation(null);
  }, [onSelectConversation]);

  if (loading) {
    return <p className="friends-status-text">Loading conversations...</p>;
  }

  if (conversations.length === 0) {
    return (
      <p className="friends-conv-empty">
        No conversations yet — click "Message" on a friend to start one!
      </p>
    );
  }

  return (
    <div className={`friends-messages-container${activeId ? ' mobile-thread-open' : ''}`}>
      <FriendConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
      />
      <FriendConversationThread
        conversationId={activeId}
        conversation={activeConversation}
        onBack={handleBack}
      />
    </div>
  );
}
