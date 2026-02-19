import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useVoice, { SpeechRecognition } from '../hooks/useVoice';
import { useCoursework } from '../coursework/CourseworkContext';
import { useWritings } from '../writings/WritingsContext';

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

export default function PersonaChatPanel({ entityType, entityName, entityLabel, messages, setMessages, onClose }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasSentGreeting = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);
  const { buildCourseSummary } = useCoursework();
  const { saveConversation } = useWritings();

  // Save conversation on unmount
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        saveConversation('persona', entityName, messagesRef.current);
      }
    };
  }, [entityName, saveConversation]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Auto-send greeting on mount if no messages yet
  useEffect(() => {
    if (messages.length === 0 && !hasSentGreeting.current) {
      hasSentGreeting.current = true;
      sendMessage('[The visitor approaches.]');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text) {
    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          area: 'celestial-clocks',
          persona: { type: entityType, name: entityName },
          courseSummary: buildCourseSummary(location.pathname),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([...updated, { role: 'assistant', content: data.error || 'Something went wrong.' }]);
      } else {
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
        speak(data.reply);
      }
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNavLink(path) {
    navigate(path);
  }

  function renderParsedMessage(text) {
    const segments = parseAtlasMessage(text);
    return segments.map((seg, i) => {
      if (seg.type === 'link') {
        return (
          <button key={i} className="chat-nav-link" onClick={() => handleNavLink(seg.path)}>
            {seg.label} →
          </button>
        );
      }
      return <span key={i}>{seg.content}</span>;
    });
  }

  return (
    <div className="persona-chat-panel">
      <div className="persona-chat-header">
        <span className="persona-chat-title" onClick={() => window.open('/atlas', '_blank')} style={{ cursor: 'pointer' }} title="Open Atlas AI Chat">{entityLabel}</span>
        <div className="chat-header-controls">
          <button
            className={`chat-voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
          <button className="chat-header-close" onClick={onClose} aria-label="Close persona chat">{'\u2715'}</button>
        </div>
      </div>

      <div className="persona-chat-messages">
        {messages.length === 0 && !loading && (
          <div className="persona-chat-welcome">
            The {entityLabel} awaits...
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
            <div className="chat-msg-content chat-loading">The {entityLabel} stirs...</div>
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
          placeholder={voiceEnabled ? 'Tap mic or type...' : `Speak to ${entityLabel}...`}
          rows={1}
          disabled={loading}
        />
        {voiceEnabled && SpeechRecognition && (
          <button
            className={`chat-mic-btn${recording ? ' recording' : ''}`}
            onClick={recording ? stopListening : startListening}
            disabled={loading || speaking}
            title={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? '\u{23F9}' : '\u{1F3A4}'}
          </button>
        )}
        <button
          className="chat-send persona-chat-send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          &#10148;
        </button>
      </div>
    </div>
  );
}
