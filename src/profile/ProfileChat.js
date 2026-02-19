import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from './ProfileContext';
import useVoice, { SpeechRecognition } from '../hooks/useVoice';

export default function ProfileChat({ onComplete, isUpdate }) {
  const { profileData, updateCredentials, completeOnboarding } = useProfile();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);

  const visibleMessageCount = messages.filter(m => !m.hidden).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  const startChat = async () => {
    setChatOpen(true);
    setLoading(true);

    const seedMessage = isUpdate
      ? 'I would like to update my professional credentials.'
      : 'I would like to set up my professional profile.';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: seedMessage }],
          mode: 'profile-onboarding',
          existingCredentials: profileData?.credentials || {},
        }),
      });
      const data = await res.json();

      if (data.credentialUpdates) {
        await updateCredentials(data.credentialUpdates);
      }

      const reply = data.reply || 'Welcome! Let\u2019s explore your background.';
      setMessages([
        { role: 'user', content: seedMessage, hidden: true },
        { role: 'assistant', content: reply },
      ]);
      speak(reply);
    } catch {
      setMessages([
        { role: 'assistant', content: 'Something went wrong starting the conversation. Please try again.' },
      ]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build API messages (exclude hidden flag, just role+content)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'profile-onboarding',
          existingCredentials: profileData?.credentials || {},
        }),
      });
      const data = await res.json();

      if (data.credentialUpdates) {
        await updateCredentials(data.credentialUpdates);
      }

      const reply = data.reply || 'I see.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    await completeOnboarding();
    if (onComplete) onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chatOpen) {
    return (
      <div className="profile-onboarding-prompt">
        <p className="profile-onboarding-text">
          {isUpdate
            ? 'Has anything changed in your professional journey? Atlas can update your credentials based on a brief conversation.'
            : 'Atlas would like to learn about your professional background \u2014 your work in scholarship, storytelling, healing, media, and adventure. This brief conversation helps build your member identity within the Mythouse.'}
        </p>
        <div className="profile-chat-controls">
          <button
            className={`chat-voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
        </div>
        <button className="profile-setup-btn" onClick={startChat}>
          {isUpdate ? 'Update with Atlas' : 'Begin Conversation with Atlas'}
        </button>
      </div>
    );
  }

  return (
    <div className="profile-chat">
      <div className="profile-chat-controls">
        <button
          className={`chat-voice-toggle${voiceEnabled ? ' active' : ''}`}
          onClick={toggleVoice}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
        </button>
      </div>
      <div className="profile-chat-messages">
        {messages.filter(m => !m.hidden).map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
            <div className="chat-msg-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="chat-msg-content chat-loading">Atlas is thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="profile-chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="profile-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={voiceEnabled ? 'Tap mic or type...' : 'Share with Atlas...'}
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
          className="profile-chat-send"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </div>

      {visibleMessageCount >= 4 && (
        <button className="profile-finish-btn" onClick={handleFinish}>
          {isUpdate ? 'Done Updating' : 'Finish Profile Setup'}
        </button>
      )}
    </div>
  );
}
