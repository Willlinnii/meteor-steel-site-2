import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function parseAtlasMessage(text) {
  const segments = [];
  const regex = /\[\[([^|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', label: match[1].trim(), path: match[2].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleNavLink(path) {
    navigate(path);
    setOpen(false);
  }

  function renderParsedMessage(text) {
    const segments = parseAtlasMessage(text);
    return segments.map((seg, i) => {
      if (seg.type === 'link') {
        return (
          <button
            key={i}
            className="chat-nav-link"
            onClick={() => handleNavLink(seg.path)}
          >
            {seg.label} →
          </button>
        );
      }
      return <span key={i}>{seg.content}</span>;
    });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([...updated, { role: 'assistant', content: data.error || 'Something went wrong.' }]);
      } else {
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <button
        className={`chat-toggle${open ? ' chat-toggle-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '\u2715' : '\u2731'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-title">Atlas</span>
            <button className="chat-header-close" onClick={() => setOpen(false)} aria-label="Close chat">{'\u2715'}</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                I was born in a book and awakened in a story. Ask me anything about the mythic landscape...
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                <div className="chat-msg-content">
                  {msg.role === 'assistant' ? renderParsedMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-content chat-loading">Consulting the archive...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              &#10148;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
