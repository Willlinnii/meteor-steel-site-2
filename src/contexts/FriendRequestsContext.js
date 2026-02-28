import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs,
  serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

const FriendRequestsContext = createContext(null);

export function useFriendRequests() {
  const ctx = useContext(FriendRequestsContext);
  if (!ctx) throw new Error('useFriendRequests must be used within FriendRequestsProvider');
  return ctx;
}

export function FriendRequestsProvider({ children }) {
  const { user } = useAuth();
  const [sentDocs, setSentDocs] = useState([]);
  const [receivedDocs, setReceivedDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener: requests where user is sender
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setSentDocs([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'friend-requests'), where('senderUid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setSentDocs(items);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  // Real-time listener: requests where user is recipient
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setReceivedDocs([]);
      return;
    }
    const q = query(collection(db, 'friend-requests'), where('recipientUid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setReceivedDocs(items);
    });
    return unsub;
  }, [user]);

  // Derived state
  const friends = useMemo(() => {
    const list = [];
    sentDocs.filter(d => d.status === 'accepted').forEach(d => {
      list.push({ uid: d.recipientUid, handle: d.recipientHandle, requestId: d.id, relationship: d.relationship || 'friend' });
    });
    receivedDocs.filter(d => d.status === 'accepted').forEach(d => {
      list.push({ uid: d.senderUid, handle: d.senderHandle, requestId: d.id, relationship: d.relationship || 'friend' });
    });
    return list;
  }, [sentDocs, receivedDocs]);

  // Family members (friends marked as family)
  const familyMembers = useMemo(() => friends.filter(f => f.relationship === 'family'), [friends]);

  // Quick-lookup Sets
  const friendUids = useMemo(() => new Set(friends.map(f => f.uid)), [friends]);
  const familyUids = useMemo(() => new Set(familyMembers.map(f => f.uid)), [familyMembers]);

  const incomingRequests = useMemo(() =>
    receivedDocs.filter(d => d.status === 'pending'),
    [receivedDocs]
  );

  const outgoingRequests = useMemo(() =>
    sentDocs.filter(d => d.status === 'pending'),
    [sentDocs]
  );

  // All UIDs the user has a relationship with (pending or accepted)
  const connectedUids = useMemo(() => {
    const set = new Set();
    sentDocs.forEach(d => { if (d.status !== 'declined') set.add(d.recipientUid); });
    receivedDocs.forEach(d => { if (d.status !== 'declined') set.add(d.senderUid); });
    return set;
  }, [sentDocs, receivedDocs]);

  const sendRequest = useCallback(async (recipientUid, recipientHandle, senderHandle) => {
    if (!user || !db) return;
    // Dedup check
    if (connectedUids.has(recipientUid)) return;
    // Also check Firestore directly for declined requests we might re-send
    const q1 = query(
      collection(db, 'friend-requests'),
      where('senderUid', '==', user.uid),
      where('recipientUid', '==', recipientUid),
      where('status', '==', 'pending'),
    );
    const existing = await getDocs(q1);
    if (!existing.empty) return;

    await addDoc(collection(db, 'friend-requests'), {
      senderUid: user.uid,
      senderHandle: senderHandle || '',
      recipientUid,
      recipientHandle: recipientHandle || '',
      status: 'pending',
      relationship: 'friend',
      createdAt: serverTimestamp(),
      respondedAt: null,
    });
  }, [user, connectedUids]);

  const acceptRequest = useCallback(async (requestId) => {
    if (!db || !user) return;
    await updateDoc(doc(db, 'friend-requests', requestId), {
      status: 'accepted',
      respondedAt: serverTimestamp(),
    });
    // Post fellowship activity
    try {
      const reqDoc = await getDoc(doc(db, 'friend-requests', requestId));
      const reqData = reqDoc.data();
      if (reqData) {
        await addDoc(collection(db, 'fellowship-posts'), {
          authorUid: user.uid,
          authorHandle: reqData.recipientHandle || user.displayName || '',
          authorName: user.displayName || '',
          authorPhotoURL: user.photoURL || null,
          type: 'activity',
          completionType: null,
          completionId: null,
          completionLabel: null,
          summary: `${reqData.recipientHandle || 'A fellow'} and ${reqData.senderHandle || 'a fellow'} are now friends`,
          fullStory: null,
          images: [],
          videoURL: null,
          activityType: 'friend-accepted',
          activityTargetHandle: reqData.senderHandle || null,
          activityMessage: `${reqData.recipientHandle || 'A fellow'} and ${reqData.senderHandle || 'a fellow'} are now friends`,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Fellowship activity post error:', err);
    }
  }, [user]);

  const declineRequest = useCallback(async (requestId) => {
    if (!db) return;
    await updateDoc(doc(db, 'friend-requests', requestId), {
      status: 'declined',
      respondedAt: serverTimestamp(),
    });
  }, []);

  const removeFriend = useCallback(async (requestId) => {
    if (!db) return;
    await deleteDoc(doc(db, 'friend-requests', requestId));
  }, []);

  const setRelationship = useCallback(async (requestId, rel) => {
    if (!db) return;
    await updateDoc(doc(db, 'friend-requests', requestId), { relationship: rel });
  }, []);

  return (
    <FriendRequestsContext.Provider value={{
      friends,
      familyMembers,
      friendUids,
      familyUids,
      incomingRequests,
      outgoingRequests,
      connectedUids,
      sendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      setRelationship,
      loading,
    }}>
      {children}
    </FriendRequestsContext.Provider>
  );
}
