import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

/**
 * Real-time list of all friend conversations for the current user.
 * Returns conversations sorted by lastMessageAt descending.
 */
export function useFriendConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'friend-conversations'),
      where('participantUids', 'array-contains', user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const aT = a.lastMessageAt?.toMillis?.() || 0;
        const bT = b.lastMessageAt?.toMillis?.() || 0;
        return bT - aT;
      });
      setConversations(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [user]);

  const unreadCount = conversations.filter(c =>
    user && (c.unreadBy || []).includes(user.uid)
  ).length;

  return { conversations, unreadCount, loading };
}
