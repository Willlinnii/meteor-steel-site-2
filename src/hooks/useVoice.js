import { useState, useCallback, useRef, useEffect } from 'react';

export const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

function speakText(text, onEnd) {
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

export default function useVoice(setInput) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);

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
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) {
        window.speechSynthesis?.cancel();
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
    speakText(text, () => setSpeaking(false));
  }, [voiceEnabled]);

  return { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak };
}
