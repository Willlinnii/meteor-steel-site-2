import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

const FamilyContext = createContext(null);

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const [families, setFamilies] = useState([]);
  const [activeFamily, setActiveFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to families where the user is a member
  useEffect(() => {
    if (!user || !db) {
      setFamilies([]);
      setActiveFamily(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'families'), where('memberUids', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setFamilies(items);

      // Auto-select first if none active
      setActiveFamily(prev => {
        if (prev && items.find(f => f.id === prev.id)) {
          return items.find(f => f.id === prev.id);
        }
        return items[0] || null;
      });
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const createFamily = useCallback(async (name) => {
    if (!user || !db) return null;
    const docRef = await addDoc(collection(db, 'families'), {
      name,
      memberUids: [user.uid],
      members: [{ uid: user.uid, displayName: user.displayName || user.email?.split('@')[0], role: 'admin' }],
      inviteCode: generateInviteCode(),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }, [user]);

  const joinFamily = useCallback(async (inviteCode) => {
    if (!user || !db) return false;
    // Find family by invite code
    const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCode.toUpperCase()));
    return new Promise((resolve) => {
      const unsub = onSnapshot(q, async (snap) => {
        unsub();
        if (snap.empty) { resolve(false); return; }
        const familyDoc = snap.docs[0];
        const data = familyDoc.data();
        if (data.memberUids.includes(user.uid)) { resolve(true); return; }
        await updateDoc(doc(db, 'families', familyDoc.id), {
          memberUids: arrayUnion(user.uid),
          members: arrayUnion({ uid: user.uid, displayName: user.displayName || user.email?.split('@')[0], role: 'member' }),
        });
        resolve(true);
      }, () => resolve(false));
    });
  }, [user]);

  return (
    <FamilyContext.Provider value={{ families, activeFamily, setActiveFamily, loading, createFamily, joinFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}
