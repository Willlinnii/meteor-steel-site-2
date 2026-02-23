import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useWritings } from '../writings/WritingsContext';
import { useProfile } from '../profile/ProfileContext';
import { useCoursework } from '../coursework/CourseworkContext';
import { computeCardsFromSources, CATEGORY_CONFIG } from './storyCardDefs';

const DEBOUNCE_MS = 2000;

/**
 * Syncs story cards to Firestore subcollection `users/{uid}/story-cards/{sourceId}`.
 * Loads current cards via onSnapshot, diffs vs computed desired set, and batch writes changes.
 */
export function useStoryCardSync() {
  const { user } = useAuth();
  const { personalStories, forgeData, journeySyntheses, loaded: writingsLoaded } = useWritings();
  const { natalChart, numerologyName, luckyNumber, loaded: profileLoaded } = useProfile();
  const { isElementCompleted, certificateData, allCourses, loaded: cwLoaded } = useCoursework();

  const [cards, setCards] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Current Firestore docs (Map<sourceId, docData>)
  const firestoreCards = useRef(new Map());
  const firestoreLoaded = useRef(false);
  const debounceTimer = useRef(null);

  // Listen to Firestore story-cards subcollection
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      firestoreCards.current = new Map();
      firestoreLoaded.current = false;
      setCards([]);
      setLoaded(false);
      return;
    }

    const colRef = collection(db, 'users', user.uid, 'story-cards');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const map = new Map();
      snapshot.forEach((d) => {
        map.set(d.id, d.data());
      });
      firestoreCards.current = map;
      firestoreLoaded.current = true;

      // Update local state from Firestore
      const arr = [];
      map.forEach((data, id) => arr.push({ ...data, sourceId: id }));
      setCards(arr);
      setLoaded(true);
    }, (err) => {
      console.error('Story cards snapshot error:', err);
      firestoreLoaded.current = true;
      setLoaded(true);
    });

    return () => unsub();
  }, [user]);

  // Sync function: compute desired cards, diff, batch write
  const syncCards = useCallback(async () => {
    if (!user || !firebaseConfigured || !db) return;
    if (!firestoreLoaded.current) return;

    const desired = computeCardsFromSources({
      natalChart,
      numerologyName,
      luckyNumber,
      journeySyntheses,
      personalStories,
      forgeData,
      isElementCompleted,
      certificateData,
      allCourses,
    });

    const current = firestoreCards.current;
    const batch = writeBatch(db);
    let hasChanges = false;

    // Create or update
    for (const [sourceId, cardData] of desired) {
      const existing = current.get(sourceId);
      const config = CATEGORY_CONFIG[cardData.category] || {};
      const fullCard = {
        ...cardData,
        icon: config.icon || '',
        color: config.color || '#888',
        sourceId,
      };

      if (!existing) {
        // New card
        const ref = doc(db, 'users', user.uid, 'story-cards', sourceId);
        batch.set(ref, { ...fullCard, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        hasChanges = true;
      } else if (hasChanged(existing, fullCard)) {
        // Updated card
        const ref = doc(db, 'users', user.uid, 'story-cards', sourceId);
        batch.set(ref, { ...fullCard, createdAt: existing.createdAt || serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        hasChanges = true;
      }
    }

    // Delete cards no longer present
    for (const sourceId of current.keys()) {
      if (!desired.has(sourceId)) {
        const ref = doc(db, 'users', user.uid, 'story-cards', sourceId);
        batch.delete(ref);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setSyncing(true);
      try {
        await batch.commit();
      } catch (err) {
        console.error('Story card sync error:', err);
      }
      setSyncing(false);
    }
  }, [user, natalChart, numerologyName, luckyNumber, journeySyntheses, personalStories, forgeData, isElementCompleted, certificateData, allCourses]);

  // Debounced sync when dependencies change
  useEffect(() => {
    // Wait for all contexts to load
    if (!writingsLoaded || !profileLoaded || !cwLoaded) return;
    if (!firestoreLoaded.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncCards();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [writingsLoaded, profileLoaded, cwLoaded, syncCards]);

  return { cards, loaded, syncing };
}

// Compare relevant fields to detect changes
function hasChanged(existing, desired) {
  return (
    existing.title !== desired.title ||
    existing.subtitle !== desired.subtitle ||
    existing.summary !== desired.summary ||
    existing.category !== desired.category
  );
}
