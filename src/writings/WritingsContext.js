import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

const WritingsContext = createContext(null);

const FLUSH_INTERVAL = 30000; // 30 seconds
const MAX_CONVERSATION_MESSAGES = 200;
const WRITING_DOCS = ['forge', 'journeys', 'conversations', 'notes'];

export function useWritings() {
  const ctx = useContext(WritingsContext);
  if (!ctx) throw new Error('useWritings must be used within WritingsProvider');
  return ctx;
}

export function WritingsProvider({ children }) {
  const { user } = useAuth();

  // Data state for each doc
  const [forgeData, setForgeData] = useState({ template: null, entries: {}, stories: {} });
  const [journeySyntheses, setJourneySyntheses] = useState({});
  const [conversationsData, setConversationsData] = useState({ atlas: [], personas: {}, profile: [] });
  const [notesData, setNotesData] = useState({ entries: {} });
  const [loaded, setLoaded] = useState(false);

  const dirtyRef = useRef(new Set());
  const forgeRef = useRef(forgeData);
  const journeysRef = useRef(journeySyntheses);
  const conversationsRef = useRef(conversationsData);
  const notesRef = useRef(notesData);
  const userRef = useRef(user);
  const flushTimerRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { forgeRef.current = forgeData; }, [forgeData]);
  useEffect(() => { journeysRef.current = journeySyntheses; }, [journeySyntheses]);
  useEffect(() => { conversationsRef.current = conversationsData; }, [conversationsData]);
  useEffect(() => { notesRef.current = notesData; }, [notesData]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Load all writing docs from Firestore on login
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setForgeData({ template: null, entries: {}, stories: {} });
      setJourneySyntheses({});
      setConversationsData({ atlas: [], personas: {}, profile: [] });
      setNotesData({ entries: {} });
      setLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadWritings() {
      try {
        const results = {};
        for (const docId of WRITING_DOCS) {
          const ref = doc(db, 'users', user.uid, 'writings', docId);
          const snap = await getDoc(ref);
          if (snap.exists()) results[docId] = snap.data();
        }

        if (!cancelled) {
          if (results.forge) {
            setForgeData({
              template: results.forge.template || null,
              entries: results.forge.entries || {},
              stories: results.forge.stories || {},
            });
          }
          if (results.journeys) {
            setJourneySyntheses(results.journeys.syntheses || {});
          }
          if (results.conversations) {
            setConversationsData({
              atlas: results.conversations.atlas || [],
              personas: results.conversations.personas || {},
              profile: results.conversations.profile || [],
            });
          }
          if (results.notes) {
            setNotesData({ entries: results.notes.entries || {} });
          }
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load writings:', err);
        if (!cancelled) setLoaded(true);
      }
    }

    loadWritings();
    return () => { cancelled = true; };
  }, [user]);

  // Flush dirty docs to Firestore
  const flush = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !firebaseConfigured || !db) return;
    const dirty = new Set(dirtyRef.current);
    if (dirty.size === 0) return;
    dirtyRef.current = new Set();

    for (const docId of dirty) {
      try {
        const ref = doc(db, 'users', currentUser.uid, 'writings', docId);
        let data;
        switch (docId) {
          case 'forge':
            data = { ...forgeRef.current, updatedAt: serverTimestamp() };
            break;
          case 'journeys':
            data = { syntheses: journeysRef.current, updatedAt: serverTimestamp() };
            break;
          case 'conversations':
            data = { ...conversationsRef.current, updatedAt: serverTimestamp() };
            break;
          case 'notes':
            data = { entries: notesRef.current.entries, updatedAt: serverTimestamp() };
            break;
          default:
            continue;
        }
        await setDoc(ref, data, { merge: true });
      } catch (err) {
        console.error(`Failed to flush writings/${docId}:`, err);
        dirtyRef.current.add(docId);
      }
    }
  }, []);

  // Periodic flush timer
  useEffect(() => {
    if (!user || !firebaseConfigured) return;
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flush();
    };
  }, [user, flush]);

  // Flush on visibility change / beforeunload
  useEffect(() => {
    const handleVisChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const handleBeforeUnload = () => flush();
    document.addEventListener('visibilitychange', handleVisChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flush]);

  // --- Forge ---
  const saveForge = useCallback((entries, stories, template) => {
    setForgeData({ template, entries, stories });
    dirtyRef.current.add('forge');
  }, []);

  // --- Journey Syntheses ---
  const addJourneySynthesis = useCallback((journeyId, mode, text) => {
    const key = `${journeyId}-${mode}-${Date.now()}`;
    setJourneySyntheses(prev => ({
      ...prev,
      [key]: { text, journeyId, mode, createdAt: Date.now() },
    }));
    // Immediate write for high-value journey syntheses
    dirtyRef.current.add('journeys');
    // Trigger flush immediately (not waiting for 30s)
    setTimeout(() => flush(), 0);
  }, [flush]);

  // --- Conversations ---
  const getConversation = useCallback((type, key) => {
    const data = conversationsRef.current;
    if (type === 'atlas') return data.atlas || [];
    if (type === 'persona') return data.personas[key] || [];
    if (type === 'profile') return data.profile || [];
    return [];
  }, []);

  const saveConversation = useCallback((type, key, messages) => {
    // Cap at MAX_CONVERSATION_MESSAGES
    const capped = messages.length > MAX_CONVERSATION_MESSAGES
      ? messages.slice(-MAX_CONVERSATION_MESSAGES)
      : messages;

    setConversationsData(prev => {
      if (type === 'atlas') return { ...prev, atlas: capped };
      if (type === 'persona') return { ...prev, personas: { ...prev.personas, [key]: capped } };
      if (type === 'profile') return { ...prev, profile: capped };
      return prev;
    });
    dirtyRef.current.add('conversations');
  }, []);

  // --- Dev Notes ---
  const saveNotes = useCallback((key, entriesForKey) => {
    setNotesData(prev => ({
      entries: { ...prev.entries, [key]: entriesForKey },
    }));
    dirtyRef.current.add('notes');
  }, []);

  // --- Library: aggregated view of all writings ---
  const getAllWritings = useCallback(() => {
    const items = [];

    // Forge stories
    const forge = forgeRef.current;
    if (forge.stories) {
      Object.entries(forge.stories).forEach(([stageId, text]) => {
        if (text) {
          items.push({
            source: 'forge',
            title: `Forge: ${stageId}`,
            preview: text.substring(0, 200),
            text,
            template: forge.template,
            date: null,
          });
        }
      });
    }

    // Journey syntheses
    Object.entries(journeysRef.current).forEach(([key, syn]) => {
      items.push({
        source: 'journey',
        title: `Journey: ${syn.journeyId} (${syn.mode})`,
        preview: syn.text.substring(0, 200),
        text: syn.text,
        date: syn.createdAt,
      });
    });

    // Atlas conversations (most recent messages)
    const convData = conversationsRef.current;
    if (convData.atlas && convData.atlas.length > 0) {
      items.push({
        source: 'atlas',
        title: 'Atlas Conversation',
        preview: convData.atlas.slice(-2).map(m => m.content.substring(0, 100)).join(' | '),
        messages: convData.atlas,
        date: null,
      });
    }

    // Persona conversations
    if (convData.personas) {
      Object.entries(convData.personas).forEach(([name, msgs]) => {
        if (msgs && msgs.length > 0) {
          items.push({
            source: 'persona',
            title: `${name} Conversation`,
            preview: msgs.slice(-2).map(m => m.content.substring(0, 100)).join(' | '),
            messages: msgs,
            date: null,
          });
        }
      });
    }

    // Dev notes
    const notes = notesRef.current;
    if (notes.entries) {
      Object.entries(notes.entries).forEach(([key, entries]) => {
        if (entries && entries.length > 0) {
          items.push({
            source: 'notes',
            title: `Notes: ${key}`,
            preview: entries.map(e => e.text).join(' | ').substring(0, 200),
            entries,
            date: null,
          });
        }
      });
    }

    return items;
  }, []);

  const value = {
    forgeData,
    saveForge,
    journeySyntheses,
    addJourneySynthesis,
    getConversation,
    saveConversation,
    notesData,
    saveNotes,
    getAllWritings,
    loaded,
  };

  return (
    <WritingsContext.Provider value={value}>
      {children}
    </WritingsContext.Provider>
  );
}
