import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
import { useCoursework } from '../../coursework/CourseworkContext';
import './AtlasPage.css';

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

const VOICES = [
  { id: 'atlas', label: 'Atlas', group: 'Atlas' },
  { id: 'planet:Sun', label: 'Sun', group: 'Planets', type: 'planet', name: 'Sun' },
  { id: 'planet:Moon', label: 'Moon', group: 'Planets', type: 'planet', name: 'Moon' },
  { id: 'planet:Mercury', label: 'Mercury', group: 'Planets', type: 'planet', name: 'Mercury' },
  { id: 'planet:Venus', label: 'Venus', group: 'Planets', type: 'planet', name: 'Venus' },
  { id: 'planet:Mars', label: 'Mars', group: 'Planets', type: 'planet', name: 'Mars' },
  { id: 'planet:Jupiter', label: 'Jupiter', group: 'Planets', type: 'planet', name: 'Jupiter' },
  { id: 'planet:Saturn', label: 'Saturn', group: 'Planets', type: 'planet', name: 'Saturn' },
  { id: 'zodiac:Aries', label: 'Aries \u2648', group: 'Zodiac', type: 'zodiac', name: 'Aries' },
  { id: 'zodiac:Taurus', label: 'Taurus \u2649', group: 'Zodiac', type: 'zodiac', name: 'Taurus' },
  { id: 'zodiac:Gemini', label: 'Gemini \u264A', group: 'Zodiac', type: 'zodiac', name: 'Gemini' },
  { id: 'zodiac:Cancer', label: 'Cancer \u264B', group: 'Zodiac', type: 'zodiac', name: 'Cancer' },
  { id: 'zodiac:Leo', label: 'Leo \u264C', group: 'Zodiac', type: 'zodiac', name: 'Leo' },
  { id: 'zodiac:Virgo', label: 'Virgo \u264D', group: 'Zodiac', type: 'zodiac', name: 'Virgo' },
  { id: 'zodiac:Libra', label: 'Libra \u264E', group: 'Zodiac', type: 'zodiac', name: 'Libra' },
  { id: 'zodiac:Scorpio', label: 'Scorpio \u264F', group: 'Zodiac', type: 'zodiac', name: 'Scorpio' },
  { id: 'zodiac:Sagittarius', label: 'Sagittarius \u2650', group: 'Zodiac', type: 'zodiac', name: 'Sagittarius' },
  { id: 'zodiac:Capricorn', label: 'Capricorn \u2651', group: 'Zodiac', type: 'zodiac', name: 'Capricorn' },
  { id: 'zodiac:Aquarius', label: 'Aquarius \u2652', group: 'Zodiac', type: 'zodiac', name: 'Aquarius' },
  { id: 'zodiac:Pisces', label: 'Pisces \u2653', group: 'Zodiac', type: 'zodiac', name: 'Pisces' },
  { id: 'cardinal:vernal-equinox', label: 'Vernal Equinox', group: 'Cardinals', type: 'cardinal', name: 'vernal-equinox' },
  { id: 'cardinal:summer-solstice', label: 'Summer Solstice', group: 'Cardinals', type: 'cardinal', name: 'summer-solstice' },
  { id: 'cardinal:autumnal-equinox', label: 'Autumnal Equinox', group: 'Cardinals', type: 'cardinal', name: 'autumnal-equinox' },
  { id: 'cardinal:winter-solstice', label: 'Winter Solstice', group: 'Cardinals', type: 'cardinal', name: 'winter-solstice' },
];

const GROUPS = ['Atlas', 'Planets', 'Zodiac', 'Cardinals'];

export default function AtlasPage() {
  const [activeVoice, setActiveVoice] = useState('atlas');
  const [chatHistories, setChatHistories] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const greetingSent = useRef({});
  const navigate = useNavigate();
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInput);
  const { trackElement, trackTime, buildCourseSummary } = useCoursework();

  // Page visit tracking
  useEffect(() => { trackElement('atlas.page.visited'); }, [trackElement]);

  // Time tracking per voice
  const timeRef = useRef({ voice: activeVoice, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0) trackTime(`atlas.voice.${prev.voice}.time`, elapsed);
    timeRef.current = { voice: activeVoice, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0) trackTime(`atlas.voice.${cur.voice}.time`, secs);
    };
  }, [activeVoice, trackTime]);

  const emptyMessages = useMemo(() => [], []);
  const messages = chatHistories[activeVoice] || emptyMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [activeVoice]);

  const setMessages = useCallback((voiceId, msgs) => {
    setChatHistories(prev => ({ ...prev, [voiceId]: msgs }));
  }, []);

  const sendMessage = useCallback(async (text, voiceId) => {
    const vid = voiceId || activeVoice;
    const voice = VOICES.find(v => v.id === vid);
    const prev = chatHistories[vid] || [];
    const userMsg = { role: 'user', content: text };
    const updated = [...prev, userMsg];
    setMessages(vid, updated);
    setLoading(true);

    trackElement(`atlas.voice.${vid}.message`);
    trackElement('atlas.messages.total');

    const courseSummary = buildCourseSummary('/atlas');
    const body = { messages: updated, courseSummary };
    if (vid === 'atlas') {
      body.area = 'auto';
    } else {
      body.area = 'celestial-clocks';
      body.persona = { type: voice.type, name: voice.name };
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : (data.error || 'Something went wrong.');
      setMessages(vid, [...updated, { role: 'assistant', content: reply }]);
      if (res.ok) speak(reply);
    } catch {
      setMessages(vid, [...updated, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [activeVoice, chatHistories, setMessages, speak]);

  // Auto-greeting for persona voices
  useEffect(() => {
    if (activeVoice === 'atlas') return;
    const hist = chatHistories[activeVoice];
    if ((!hist || hist.length === 0) && !greetingSent.current[activeVoice]) {
      greetingSent.current[activeVoice] = true;
      sendMessage('[The visitor approaches.]', activeVoice);
    }
  }, [activeVoice, chatHistories, sendMessage]);

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

  function handleVoiceChange(e) {
    trackElement(`atlas.voice.${e.target.value}.selected`);
    setActiveVoice(e.target.value);
  }

  function renderMessage(msg, i) {
    const segments = parseAtlasMessage(msg.content);
    return (
      <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
        <div className="chat-msg-content">
          {segments.map((seg, j) =>
            seg.type === 'link' ? (
              <button key={j} className="chat-nav-link" onClick={() => navigate(seg.path)}>
                {seg.label} &rarr;
              </button>
            ) : (
              <span key={j}>{seg.content}</span>
            )
          )}
        </div>
      </div>
    );
  }

  const currentVoice = VOICES.find(v => v.id === activeVoice);
  const welcomeLabel = activeVoice === 'atlas' ? 'Atlas' : currentVoice?.label || 'Atlas';

  return (
    <div className="atlas-page">
      <div className="atlas-topbar">
        <select className="atlas-voice-select" value={activeVoice} onChange={handleVoiceChange}>
          {GROUPS.map(group => (
            <optgroup key={group} label={group}>
              {VOICES.filter(v => v.group === group).map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          className={`atlas-voice-toggle${voiceEnabled ? ' active' : ''}`}
          onClick={toggleVoice}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
        </button>
      </div>

      <div className="atlas-messages">
        {messages.length === 0 && !loading && (
          <div className="atlas-welcome">
            Begin your conversation with {welcomeLabel}...
          </div>
        )}
        {messages.map((msg, i) => renderMessage(msg, i))}
        {loading && <div className="chat-loading">...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="atlas-input-area">
        <textarea
          ref={inputRef}
          className="atlas-input"
          rows={1}
          placeholder={voiceEnabled ? 'Tap mic or type...' : `Ask ${welcomeLabel}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {voiceEnabled && SpeechRecognition && (
          <button
            className={`atlas-mic-btn${recording ? ' recording' : ''}`}
            onClick={recording ? stopListening : startListening}
            disabled={loading || speaking}
            title={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? '\u{23F9}' : '\u{1F3A4}'}
          </button>
        )}
        <button className="atlas-send" onClick={handleSend} disabled={loading || !input.trim()}>&#9654;</button>
      </div>
    </div>
  );
}
