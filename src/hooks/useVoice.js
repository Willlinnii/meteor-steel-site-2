import { useState, useCallback, useRef, useEffect } from 'react';
import { apiFetch } from '../lib/chatApi';

export const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

/** Play a sequence of audio URLs one after another. */
function playAudioQueue(urls, audioRef, onEnd) {
  let index = 0;
  function playNext() {
    if (index >= urls.length) { onEnd?.(); return; }
    const audio = new Audio(urls[index]);
    audioRef.current = audio;
    audio.onended = () => { index++; playNext(); };
    audio.onerror = () => { index++; playNext(); };
    audio.play().catch(() => { index++; playNext(); });
  }
  playNext();
}

// --- AI Voice via Replicate Chatterbox ---
async function speakAI(text, voiceId, audioRef, onEnd) {
  console.log('[Atlas Voice] Calling TTS API with voiceId:', voiceId);
  try {
    const res = await apiFetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    });

    console.log('[Atlas Voice] TTS response status:', res.status);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '(no body)');
      console.warn('[Atlas Voice] TTS API error:', res.status, errBody);
      speakBrowser(text, onEnd);
      return;
    }

    const data = await res.json();
    console.log('[Atlas Voice] TTS response data:', JSON.stringify(data).slice(0, 200));

    // Single chunk response
    if (data.audioUrl) {
      console.log('[Atlas Voice] Playing audio from:', data.audioUrl.slice(0, 80));
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.onended = () => { console.log('[Atlas Voice] Audio playback ended'); onEnd?.(); };
      audio.onerror = (e) => {
        console.warn('[Atlas Voice] Audio playback error:', e);
        speakBrowser(text, onEnd);
      };
      audio.play().then(() => {
        console.log('[Atlas Voice] Audio playing successfully');
      }).catch((e) => {
        console.warn('[Atlas Voice] Audio play() rejected:', e);
        speakBrowser(text, onEnd);
      });
      return;
    }

    // Multi-chunk response
    if (data.audioUrls && data.audioUrls.length > 0) {
      console.log('[Atlas Voice] Playing', data.audioUrls.length, 'audio chunks');
      playAudioQueue(data.audioUrls, audioRef, onEnd);
      return;
    }

    // No audio returned
    console.warn('[Atlas Voice] No audio URL in response');
    speakBrowser(text, onEnd);
  } catch (err) {
    console.warn('[Atlas Voice] TTS fetch error:', err);
    speakBrowser(text, onEnd);
  }
}

// --- Browser fallback ---
function speakBrowser(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => /daniel|james|aaron|male/i.test(v.name) && /en/i.test(v.lang))
    || voices.find(v => /en[-_]US/i.test(v.lang))
    || voices[0];
  if (preferred) utter.voice = preferred;
  if (onEnd) utter.onend = onEnd;
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export default function useVoice(setInput, voiceId = 'atlas') {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Preload voices (Chrome loads them async)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoices = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', handleVoices);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', handleVoices);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) {
        window.speechSynthesis?.cancel();
        audioRef.current?.pause();
        recognitionRef.current?.abort();
        setRecording(false);
        setSpeaking(false);
      }
      return !prev;
    });
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || recording) return;
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';
    recognitionRef.current = recog;

    recog.onstart = () => setRecording(true);
    recog.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    recog.onerror = () => setRecording(false);
    recog.onend = () => setRecording(false);
    recog.start();
  }, [recording, setInput]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const speak = useCallback((text) => {
    if (!voiceEnabled) return;
    setSpeaking(true);
    speakAI(text, voiceId, audioRef, () => setSpeaking(false));
  }, [voiceEnabled, voiceId]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  return { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak, stopSpeaking };
}
