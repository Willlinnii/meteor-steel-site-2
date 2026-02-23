import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useScope } from './ScopeContext';

const StoryBookContext = createContext(null);

export function useStoryBook() {
  const ctx = useContext(StoryBookContext);
  if (!ctx) throw new Error('useStoryBook must be used within StoryBookProvider');
  return ctx;
}

export function StoryBookProvider({ children }) {
  const { user } = useAuth();
  const { activeScope } = useScope();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeScope || !db) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const sbRef = collection(db, activeScope.collection, activeScope.id, 'storybook');
    const q = query(sbRef, orderBy('updatedAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setEntries(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [activeScope]);

  const saveEntry = useCallback(async (memberId, data) => {
    if (!activeScope || !user || !db) return;
    await setDoc(doc(db, activeScope.collection, activeScope.id, 'storybook', memberId), {
      ...data,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [activeScope, user]);

  return (
    <StoryBookContext.Provider value={{ entries, loading, saveEntry }}>
      {children}
    </StoryBookContext.Provider>
  );
}
