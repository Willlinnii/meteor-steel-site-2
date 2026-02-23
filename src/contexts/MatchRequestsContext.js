import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs,
  serverTimestamp, getDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { apiFetch } from '../lib/chatApi';

const MatchRequestsContext = createContext(null);

export function useMatchRequests() {
  const ctx = useContext(MatchRequestsContext);
  if (!ctx) throw new Error('useMatchRequests must be used within MatchRequestsProvider');
  return ctx;
}

/** Deterministic conversation ID from two UIDs */
function makeConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export function MatchRequestsProvider({ children }) {
  const { user } = useAuth();
  const { handle, photoURL } = useProfile();
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
    const q = query(collection(db, 'match-requests'), where('senderUid', '==', user.uid));
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
    const q = query(collection(db, 'match-requests'), where('recipientUid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setReceivedDocs(items);
    });
    return unsub;
  }, [user]);

  // Derived state
  const mutualMatches = useMemo(() => {
    const list = [];
    sentDocs.filter(d => d.status === 'accepted').forEach(d => {
      list.push({ uid: d.recipientUid, handle: d.recipientHandle, photoURL: d.recipientPhotoURL, requestId: d.id, conversationId: d.conversationId });
    });
    receivedDocs.filter(d => d.status === 'accepted').forEach(d => {
      list.push({ uid: d.senderUid, handle: d.senderHandle, photoURL: d.senderPhotoURL, requestId: d.id, conversationId: d.conversationId });
    });
    return list;
  }, [sentDocs, receivedDocs]);

  const incomingRequests = useMemo(() =>
    receivedDocs.filter(d => d.status === 'pending'),
    [receivedDocs]
  );

  const outgoingRequests = useMemo(() =>
    sentDocs.filter(d => d.status === 'pending'),
    [sentDocs]
  );

  // All UIDs the user has a match-request relationship with (pending or accepted)
  const connectedUids = useMemo(() => {
    const set = new Set();
    sentDocs.forEach(d => { if (d.status !== 'declined') set.add(d.recipientUid); });
    receivedDocs.forEach(d => { if (d.status !== 'declined') set.add(d.senderUid); });
    return set;
  }, [sentDocs, receivedDocs]);

  // Send a match request
  const sendMatchRequest = useCallback(async (recipientUid, recipientHandle, recipientPhotoURL, matchMode, quickScore) => {
    if (!user || !db) return;
    if (connectedUids.has(recipientUid)) return;

    // Dedup check
    const q1 = query(
      collection(db, 'match-requests'),
      where('senderUid', '==', user.uid),
      where('recipientUid', '==', recipientUid),
      where('status', '==', 'pending'),
    );
    const existing = await getDocs(q1);
    if (!existing.empty) return;

    await addDoc(collection(db, 'match-requests'), {
      senderUid: user.uid,
      senderHandle: handle || '',
      senderPhotoURL: photoURL || null,
      recipientUid,
      recipientHandle: recipientHandle || '',
      recipientPhotoURL: recipientPhotoURL || null,
      matchMode: matchMode || 'friends',
      status: 'pending',
      conversationId: null,
      quickScore: quickScore || 0,
      createdAt: serverTimestamp(),
      respondedAt: null,
    });
  }, [user, handle, photoURL, connectedUids]);

  // Accept a match request — creates conversation, triggers deep match
  const acceptMatchRequest = useCallback(async (requestId) => {
    if (!db || !user) return;

    const reqRef = doc(db, 'match-requests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return;
    const reqData = reqSnap.data();

    const conversationId = makeConversationId(user.uid, reqData.senderUid);

    // Create conversation doc
    const convRef = doc(db, 'match-conversations', conversationId);
    await setDoc(convRef, {
      participantUids: [reqData.senderUid, user.uid],
      participantHandles: {
        [reqData.senderUid]: reqData.senderHandle || '',
        [user.uid]: handle || '',
      },
      participantPhotos: {
        [reqData.senderUid]: reqData.senderPhotoURL || null,
        [user.uid]: photoURL || null,
      },
      matchRequestId: requestId,
      lastMessage: 'Match accepted! Generating your story...',
      lastMessageAt: serverTimestamp(),
      lastMessageBy: 'system',
      unreadBy: [reqData.senderUid],
      createdAt: serverTimestamp(),
    });

    // Update match request with conversationId and accepted status
    await updateDoc(reqRef, {
      status: 'accepted',
      conversationId,
      respondedAt: serverTimestamp(),
    });

    // Trigger deep-match API to generate AI story as first message
    try {
      await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story-match',
          targetUid: reqData.senderUid,
          conversationId,
        }),
      });
    } catch (err) {
      console.error('Failed to trigger deep match for conversation:', err);
    }

    // Post fellowship activity
    try {
      await addDoc(collection(db, 'fellowship-posts'), {
        authorUid: user.uid,
        authorHandle: handle || user.displayName || '',
        authorName: user.displayName || '',
        authorPhotoURL: photoURL || user.photoURL || null,
        type: 'activity',
        completionType: null,
        completionId: null,
        completionLabel: null,
        summary: `${handle || 'A fellow'} and ${reqData.senderHandle || 'a fellow'} are now story matches`,
        fullStory: null,
        images: [],
        videoURL: null,
        activityType: 'match-accepted',
        activityTargetHandle: reqData.senderHandle || null,
        activityMessage: `${handle || 'A fellow'} and ${reqData.senderHandle || 'a fellow'} are now story matches`,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Fellowship activity post error:', err);
    }
  }, [user, handle, photoURL]);

  const declineMatchRequest = useCallback(async (requestId) => {
    if (!db) return;
    await updateDoc(doc(db, 'match-requests', requestId), {
      status: 'declined',
      respondedAt: serverTimestamp(),
    });
  }, []);

  const cancelMatchRequest = useCallback(async (requestId) => {
    if (!db) return;
    await deleteDoc(doc(db, 'match-requests', requestId));
  }, []);

  return (
    <MatchRequestsContext.Provider value={{
      mutualMatches,
      incomingRequests,
      outgoingRequests,
      connectedUids,
      sendMatchRequest,
      acceptMatchRequest,
      declineMatchRequest,
      cancelMatchRequest,
      loading,
    }}>
      {children}
    </MatchRequestsContext.Provider>
  );
}
