import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useMatchConversation } from '../../storyMatching/useMatchConversation';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ConversationThread({ conversationId, conversation, onBack }) {
  const { user } = useAuth();
  const { messages, sendMessage, markRead, loading } = useMatchConversation(conversationId);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && user) {
      markRead();
    }
  }, [conversationId, user, markRead]);

  if (!conversationId) {
    return (
      <div className="conversation-thread">
        <div className="conversation-thread-empty">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  const otherUid = (conversation?.participantUids || []).find(uid => uid !== user?.uid);
  const otherHandle = otherUid ? conversation?.participantHandles?.[otherUid] : '...';

  return (
    <div className="conversation-thread">
      <div className="conversation-thread-header">
        <button className="conversation-thread-back" onClick={onBack}>
          &#x2190;
        </button>
        <span className="conversation-thread-handle">@{otherHandle}</span>
      </div>

      <div className="conversation-thread-messages">
        {loading && messages.length === 0 && (
          <div className="conversation-thread-empty">Loading messages...</div>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.senderUid === user?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={sendMessage} />
    </div>
  );
}
