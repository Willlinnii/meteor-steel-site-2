import React, { useState, useRef, useEffect } from 'react';

export default function MultiplayerChat({ messages, onSend, myUid }) {
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className={`mp-chat${collapsed ? ' collapsed' : ''}`}>
      <button className="mp-chat-toggle" onClick={() => setCollapsed(!collapsed)}>
        Chat {collapsed && messages.length > 0 ? `(${messages.length})` : ''}
        <span className="mp-chat-arrow">{collapsed ? '\u25B2' : '\u25BC'}</span>
      </button>
      {!collapsed && (
        <>
          <div className="mp-chat-messages" ref={listRef}>
            {messages.length === 0 && (
              <div className="mp-chat-empty">No messages yet</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`mp-chat-msg${msg.uid === myUid ? ' mine' : ''}`}>
                <span className="mp-chat-handle">@{msg.handle}</span>
                <span className="mp-chat-text">{msg.text}</span>
              </div>
            ))}
          </div>
          <form className="mp-chat-form" onSubmit={handleSubmit}>
            <input
              className="mp-chat-input"
              type="text"
              placeholder="Say something..."
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={200}
            />
            <button className="mp-chat-send" type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
}
