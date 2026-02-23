import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useScope } from './ScopeContext';

const TraditionsContext = createContext(null);

export function useTraditions() {
  const ctx = useContext(TraditionsContext);
  if (!ctx) throw new Error('useTraditions must be used within TraditionsProvider');
  return ctx;
}

export function TraditionsProvider({ children }) {
  const { user } = useAuth();
  const { activeScope } = useScope();
  const [traditions, setTraditions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to traditions scoped to activeScope
  useEffect(() => {
    if (!activeScope || !db) {
      setTraditions([]);
      setLoading(false);
      return;
    }

    const tradRef = collection(db, activeScope.collection, activeScope.id, 'traditions');
    const q = query(tradRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setTraditions(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [activeScope]);

  const addTradition = useCallback(async (data) => {
    if (!activeScope || !user || !db) return;
    await addDoc(collection(db, activeScope.collection, activeScope.id, 'traditions'), {
      ...data,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [activeScope, user]);

  const updateTradition = useCallback(async (id, data) => {
    if (!activeScope || !db) return;
    await updateDoc(doc(db, activeScope.collection, activeScope.id, 'traditions', id), data);
  }, [activeScope]);

  const deleteTradition = useCallback(async (id) => {
    if (!activeScope || !db) return;
    await deleteDoc(doc(db, activeScope.collection, activeScope.id, 'traditions', id));
  }, [activeScope]);

  return (
    <TraditionsContext.Provider value={{ traditions, loading, addTradition, updateTradition, deleteTradition }}>
      {children}
    </TraditionsContext.Provider>
  );
}
