import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from './ProfileContext';
import { useWritings } from '../writings/WritingsContext';
import { useAuth } from '../auth/AuthContext';
import useVoice, { SpeechRecognition } from '../hooks/useVoice';
import { validateFile, uploadMentorDocument } from './mentorUpload';
import { apiFetch } from '../lib/chatApi';

export default function MentorApplicationChat({ onComplete, qualifiedMentorTypes }) {
  const { profileData, submitMentorApplication, refreshProfile } = useProfile();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);
  const { getConversation, saveConversation, loaded: writingsLoaded } = useWritings();

  // Load previous mentor conversation
  useEffect(() => {
    if (writingsLoaded) {
      const prev = getConversation('mentor-application', null);
      if (prev.length > 0) setMessages(prev);
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on message changes
  const prevMsgsRef = useRef(messages);
  useEffect(() => {
    if (!writingsLoaded || messages.length === 0) return;
    if (prevMsgsRef.current === messages) return;
    prevMsgsRef.current = messages;
    saveConversation('mentor-application', null, messages.map(m => ({ role: m.role, content: m.content })));
  }, [messages, writingsLoaded, saveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadMentorDocument(user.uid, file);
      setUploadedDoc(result);
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
    }
    setUploading(false);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'mentor-application',
          qualifiedMentorTypes,
          uploadedDocument: uploadedDoc,
        }),
      });
      const data = await res.json();

      const reply = data.reply || 'I see.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);

      // If application was submitted via tool call
      if (data.mentorApplication) {
        await submitMentorApplication({
          type: data.mentorApplication.type,
          summary: data.mentorApplication.summary,
          documentUrl: uploadedDoc?.url || null,
          documentName: uploadedDoc?.name || null,
        });

        // Trigger automated Atlas screening
        try {
          await apiFetch('/api/mentor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'screen',
              uid: user.uid,
              application: {
                type: data.mentorApplication.type,
                summary: data.mentorApplication.summary,
                documentUrl: uploadedDoc?.url || null,
                documentName: uploadedDoc?.name || null,
              },
              credentials: profileData?.credentials || {},
            }),
          });
          // Refresh profile to get updated mentor status
          await refreshProfile();
        } catch (err) {
          console.error('Mentor review trigger failed:', err);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const startChat = async () => {
    const seedMessage = 'I would like to apply to become a mentor.';
    setLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: seedMessage }],
          mode: 'mentor-application',
          qualifiedMentorTypes,
        }),
      });
      const data = await res.json();

      const reply = data.reply || 'Welcome! Let\u2019s discuss your mentor application.';
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = messages.filter(m => !m.hidden);

  // Auto-start the chat on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && messages.length === 0) {
      startedRef.current = true;
      startChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="profile-chat mentor-application-chat">
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
        {visibleMessages.map((msg, i) => (
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

      {/* File upload area */}
      <div className="mentor-upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        {uploadedDoc ? (
          <div className="mentor-upload-success">
            Uploaded: {uploadedDoc.name}
          </div>
        ) : (
          <button
            className="mentor-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Supporting Document (Optional)'}
          </button>
        )}
        {uploadError && <div className="mentor-upload-error">{uploadError}</div>}
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
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </div>

      {visibleMessages.length >= 4 && (
        <button className="profile-finish-btn" onClick={onComplete}>
          Close
        </button>
      )}
    </div>
  );
}
