import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

/**
 * Hook for managing per-user story reveals.
 * Reads/writes `users/{uid}/story-reveals/{otherUid}`.
 * Doc shape: { revealedCardIds: string[], revealedPostIds: string[], updatedAt }
 *
 * Call watchUser(otherUid) to start listening to reveals for that user.
 * Both outgoing (what I revealed to them) and incoming (what they revealed to me)
 * are tracked via real-time onSnapshot listeners.
 */
export function useStoryReveals() {
  const { user } = useAuth();
  // outgoing: what I've revealed to others. { [otherUid]: { revealedCardIds, revealedPostIds } }
  const [outgoing, setOutgoing] = useState({});
  // incoming: what others have revealed to me. { [otherUid]: { revealedCardIds, revealedPostIds } }
  const [incoming, setIncoming] = useState({});
  // Track which UIDs we're already listening to
  const [watchedUids, setWatchedUids] = useState([]);
  const unsubscribers = useRef({});

  // Start watching reveals for a specific user (idempotent)
  const watchUser = useCallback((otherUid) => {
    if (!otherUid) return;
    setWatchedUids(prev => prev.includes(otherUid) ? prev : [...prev, otherUid]);
  }, []);

  // Set up listeners whenever watchedUids changes
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) return;

    // Subscribe to any new UIDs
    for (const otherUid of watchedUids) {
      if (unsubscribers.current[otherUid]) continue; // already listening

      // Outgoing: what I revealed to them
      const outRef = doc(db, 'users', user.uid, 'story-reveals', otherUid);
      const unsubOut = onSnapshot(outRef, (snap) => {
        if (snap.exists()) {
          setOutgoing(prev => ({ ...prev, [otherUid]: snap.data() }));
        }
      }, () => {});

      // Incoming: what they revealed to me
      const inRef = doc(db, 'users', otherUid, 'story-reveals', user.uid);
      const unsubIn = onSnapshot(inRef, (snap) => {
        if (snap.exists()) {
          setIncoming(prev => ({ ...prev, [otherUid]: snap.data() }));
        }
      }, () => {});

      unsubscribers.current[otherUid] = () => { unsubOut(); unsubIn(); };
    }

    return () => {
      // Cleanup all on unmount
      Object.values(unsubscribers.current).forEach(unsub => unsub());
      unsubscribers.current = {};
    };
  }, [user, watchedUids]);

  // Reveal a card to another user
  const revealTo = useCallback(async (otherUid, cardSourceId) => {
    if (!user || !firebaseConfigured || !db || !otherUid || !cardSourceId) return;
    const revealRef = doc(db, 'users', user.uid, 'story-reveals', otherUid);
    await setDoc(revealRef, {
      revealedCardIds: arrayUnion(cardSourceId),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    // onSnapshot will update outgoing state automatically
  }, [user]);

  // Reveal a post to another user
  const revealPostTo = useCallback(async (otherUid, postId) => {
    if (!user || !firebaseConfigured || !db || !otherUid || !postId) return;
    const revealRef = doc(db, 'users', user.uid, 'story-reveals', otherUid);
    await setDoc(revealRef, {
      revealedPostIds: arrayUnion(postId),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [user]);

  // Check if I've revealed a card to a specific user
  const isRevealedTo = useCallback((otherUid, cardSourceId) => {
    const r = outgoing[otherUid];
    return r?.revealedCardIds?.includes(cardSourceId) || false;
  }, [outgoing]);

  // Check if someone else has revealed a card to me
  const isRevealedToMe = useCallback((otherUid, cardSourceId) => {
    const r = incoming[otherUid];
    return r?.revealedCardIds?.includes(cardSourceId) || false;
  }, [incoming]);

  return {
    watchUser,
    revealTo,
    revealPostTo,
    isRevealedTo,
    isRevealedToMe,
  };
}
