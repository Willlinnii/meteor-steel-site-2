import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

const FriendsContext = createContext(null);

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
  return ctx;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function FriendsProvider({ children }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to friend groups where the user is a member
  useEffect(() => {
    if (!user || !db) {
      setGroups([]);
      setActiveGroup(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'friendGroups'), where('memberUids', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setGroups(items);

      setActiveGroup(prev => {
        if (prev && items.find(g => g.id === prev.id)) {
          return items.find(g => g.id === prev.id);
        }
        return items[0] || null;
      });
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const createGroup = useCallback(async (name) => {
    if (!user || !db) return null;
    const docRef = await addDoc(collection(db, 'friendGroups'), {
      name,
      memberUids: [user.uid],
      members: [{ uid: user.uid, displayName: user.displayName || user.email?.split('@')[0], role: 'admin' }],
      inviteCode: generateInviteCode(),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }, [user]);

  const joinGroup = useCallback(async (inviteCode) => {
    if (!user || !db) return false;
    const q = query(collection(db, 'friendGroups'), where('inviteCode', '==', inviteCode.toUpperCase()));
    return new Promise((resolve) => {
      const unsub = onSnapshot(q, async (snap) => {
        unsub();
        if (snap.empty) { resolve(false); return; }
        const groupDoc = snap.docs[0];
        const data = groupDoc.data();
        if (data.memberUids.includes(user.uid)) { resolve(true); return; }
        await updateDoc(doc(db, 'friendGroups', groupDoc.id), {
          memberUids: arrayUnion(user.uid),
          members: arrayUnion({ uid: user.uid, displayName: user.displayName || user.email?.split('@')[0], role: 'member' }),
        });
        resolve(true);
      }, () => resolve(false));
    });
  }, [user]);

  return (
    <FriendsContext.Provider value={{ groups, activeGroup, setActiveGroup, loading, createGroup, joinGroup }}>
      {children}
    </FriendsContext.Provider>
  );
}
