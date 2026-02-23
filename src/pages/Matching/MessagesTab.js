import React, { useState, useCallback } from 'react';
import { useMatchConversations } from '../../storyMatching/useMatchConversations';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';

export default function MessagesTab() {
  const { conversations, loading } = useMatchConversations();
  const [activeConvId, setActiveConvId] = useState(null);

  const activeConversation = conversations.find(c => c.id === activeConvId) || null;

  const handleSelect = useCallback((convId) => {
    setActiveConvId(convId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConvId(null);
  }, []);

  if (loading) {
    return <p className="discover-loading">Loading conversations...</p>;
  }

  if (conversations.length === 0) {
    return (
      <p className="messages-empty">
        No conversations yet. Accept a match request on the Discover tab to start chatting!
      </p>
    );
  }

  return (
    <div className={`messages-container${activeConvId ? ' mobile-thread-open' : ''}`}>
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelect}
      />
      <ConversationThread
        conversationId={activeConvId}
        conversation={activeConversation}
        onBack={handleBack}
      />
    </div>
  );
}
