import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useFamily } from './FamilyContext';

const GenealogyContext = createContext(null);

export function useGenealogy() {
  const ctx = useContext(GenealogyContext);
  if (!ctx) throw new Error('useGenealogy must be used within GenealogyProvider');
  return ctx;
}

export function GenealogyProvider({ children }) {
  const { user } = useAuth();
  const { activeFamily } = useFamily();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeFamily || !db) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const gRef = collection(db, 'families', activeFamily.id, 'genealogy');
    const q = query(gRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setPeople(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [activeFamily]);

  const addPerson = useCallback(async (data) => {
    if (!activeFamily || !user || !db) return;
    await addDoc(collection(db, 'families', activeFamily.id, 'genealogy'), {
      ...data,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [activeFamily, user]);

  const updatePerson = useCallback(async (id, data) => {
    if (!activeFamily || !db) return;
    await updateDoc(doc(db, 'families', activeFamily.id, 'genealogy', id), data);
  }, [activeFamily]);

  const deletePerson = useCallback(async (id) => {
    if (!activeFamily || !db) return;
    await deleteDoc(doc(db, 'families', activeFamily.id, 'genealogy', id));
  }, [activeFamily]);

  return (
    <GenealogyContext.Provider value={{ people, loading, addPerson, updatePerson, deletePerson }}>
      {children}
    </GenealogyContext.Provider>
  );
}
