import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useFriendConversation } from '../../hooks/useFriendConversation';
import MessageBubble from '../Matching/MessageBubble';
import MessageInput from '../Matching/MessageInput';
import '../Matching/MatchingPage.css';

export default function FriendConversationThread({ conversationId, conversation, onBack }) {
  const { user } = useAuth();
  const { messages, sendMessage, markRead, loading } = useFriendConversation(conversationId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (conversationId && user) {
      markRead();
    }
  }, [conversationId, user, markRead]);

  if (!conversationId) {
    return (
      <div className="friends-conv-thread">
        <div className="friends-conv-thread-empty">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  const otherUid = (conversation?.participantUids || []).find(uid => uid !== user?.uid);
  const otherHandle = otherUid ? conversation?.participantHandles?.[otherUid] : '...';

  return (
    <div className="friends-conv-thread">
      <div className="friends-conv-thread-header">
        <button className="friends-conv-thread-back" onClick={onBack}>
          &#x2190;
        </button>
        <span className="friends-conv-thread-handle">@{otherHandle}</span>
      </div>

      <div className="friends-conv-thread-messages">
        {loading && messages.length === 0 && (
          <div className="friends-conv-thread-empty">Loading messages...</div>
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
