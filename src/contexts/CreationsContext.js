import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useScope } from './ScopeContext';

const CreationsContext = createContext(null);

export function useCreations() {
  const ctx = useContext(CreationsContext);
  if (!ctx) throw new Error('useCreations must be used within CreationsProvider');
  return ctx;
}

export function CreationsProvider({ children }) {
  const { user } = useAuth();
  const { activeScope } = useScope();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeScope || !db) {
      setCreations([]);
      setLoading(false);
      return;
    }

    const creRef = collection(db, activeScope.collection, activeScope.id, 'creations');
    const q = query(creRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setCreations(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [activeScope]);

  const addCreation = useCallback(async (data) => {
    if (!activeScope || !user || !db) return;
    await addDoc(collection(db, activeScope.collection, activeScope.id, 'creations'), {
      ...data,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [activeScope, user]);

  const updateCreation = useCallback(async (id, data) => {
    if (!activeScope || !db) return;
    await updateDoc(doc(db, activeScope.collection, activeScope.id, 'creations', id), data);
  }, [activeScope]);

  const deleteCreation = useCallback(async (id) => {
    if (!activeScope || !db) return;
    await deleteDoc(doc(db, activeScope.collection, activeScope.id, 'creations', id));
  }, [activeScope]);

  return (
    <CreationsContext.Provider value={{ creations, loading, addCreation, updateCreation, deleteCreation }}>
      {children}
    </CreationsContext.Provider>
  );
}
