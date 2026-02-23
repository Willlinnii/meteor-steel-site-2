import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

/**
 * Real-time list of all match conversations for the current user.
 * Returns conversations sorted by lastMessageAt descending.
 */
export function useMatchConversations() {
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
      collection(db, 'match-conversations'),
      where('participantUids', 'array-contains', user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      // Sort by lastMessageAt descending (most recent first)
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

  // Count of conversations where current user is in unreadBy
  const unreadCount = conversations.filter(c =>
    user && (c.unreadBy || []).includes(user.uid)
  ).length;

  return { conversations, unreadCount, loading };
}
