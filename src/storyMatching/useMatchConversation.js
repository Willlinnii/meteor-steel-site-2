import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';

/**
 * Real-time messages for a single match conversation.
 * Provides sendMessage and markRead helpers.
 */
export function useMatchConversation(conversationId) {
  const { user } = useAuth();
  const { handle } = useProfile();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time messages listener
  useEffect(() => {
    if (!conversationId || !user || !firebaseConfigured || !db) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'match-conversations', conversationId, 'messages'),
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

  // Send a user message
  const sendMessage = useCallback(async (text) => {
    if (!conversationId || !user || !db || !text.trim()) return;

    const convRef = doc(db, 'match-conversations', conversationId);

    // Add message to subcollection
    await addDoc(collection(db, 'match-conversations', conversationId, 'messages'), {
      senderUid: user.uid,
      senderHandle: handle || '',
      text: text.trim(),
      type: 'user',
      createdAt: serverTimestamp(),
    });

    // Update conversation metadata — mark other participant as unread
    // We need the other participant's UID
    const otherUid = conversationId.split('_').find(uid => uid !== user.uid);
    await updateDoc(convRef, {
      lastMessage: text.trim().substring(0, 100),
      lastMessageAt: serverTimestamp(),
      lastMessageBy: user.uid,
      unreadBy: otherUid ? [otherUid] : [],
    });
  }, [conversationId, user, handle]);

  // Mark conversation as read for current user
  const markRead = useCallback(async () => {
    if (!conversationId || !user || !db) return;
    const convRef = doc(db, 'match-conversations', conversationId);
    await updateDoc(convRef, {
      unreadBy: arrayRemove(user.uid),
    });
  }, [conversationId, user]);

  return { messages, sendMessage, markRead, loading };
}
