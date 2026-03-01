import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';

/**
 * Real-time messages for a single friend conversation.
 * Group-ready: unreadBy marks all non-sender participants.
 */
export function useFriendConversation(conversationId) {
  const { user } = useAuth();
  const { handle } = useProfile();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user || !firebaseConfigured || !db) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'friend-conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setMessages(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [conversationId, user]);

  const sendMessage = useCallback(async (text) => {
    if (!conversationId || !user || !db || !text.trim()) return;

    const convRef = doc(db, 'friend-conversations', conversationId);

    await addDoc(collection(db, 'friend-conversations', conversationId, 'messages'), {
      senderUid: user.uid,
      senderHandle: handle || '',
      text: text.trim(),
      type: 'user',
      createdAt: serverTimestamp(),
    });

    // Group-ready: mark all participants except sender as unread
    // For 1-to-1, this is just the other UID
    const otherUids = conversationId.split('_').filter(uid => uid !== user.uid);
    await updateDoc(convRef, {
      lastMessage: text.trim().substring(0, 100),
      lastMessageAt: serverTimestamp(),
      lastMessageBy: user.uid,
      unreadBy: otherUids,
    });
  }, [conversationId, user, handle]);

  const markRead = useCallback(async () => {
    if (!conversationId || !user || !db) return;
    const convRef = doc(db, 'friend-conversations', conversationId);
    await updateDoc(convRef, {
      unreadBy: arrayRemove(user.uid),
    });
  }, [conversationId, user]);

  return { messages, sendMessage, markRead, loading };
}
