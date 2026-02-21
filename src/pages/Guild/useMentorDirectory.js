import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';

const PAGE_SIZE = 50;

export const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'scholar', label: 'Mythologist' },
  { id: 'storyteller', label: 'Storyteller' },
  { id: 'healer', label: 'Healer' },
  { id: 'mediaVoice', label: 'Media Voice' },
  { id: 'adventurer', label: 'Adventurer' },
];

/**
 * Shared hook for fetching and paginating the mentor directory.
 * Used by both GuildDirectory and MentorDirectoryPage.
 */
export function useMentorDirectory() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    async function fetchMentors() {
      try {
        const dirRef = collection(db, 'mentor-directory');
        const q = query(
          dirRef,
          where('active', '==', true),
          orderBy('availableSlots', 'desc'),
          limit(PAGE_SIZE),
        );
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setMentors(results);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.size === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to fetch mentor directory:', err);
      }
      setLoading(false);
    }

    fetchMentors();
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !hasMore) return;
    try {
      const dirRef = collection(db, 'mentor-directory');
      const q = query(
        dirRef,
        where('active', '==', true),
        orderBy('availableSlots', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      setMentors(prev => [...prev, ...results]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more mentors:', err);
    }
  }, [lastDoc, hasMore]);

  const filteredMentors = activeFilter === 'all'
    ? mentors
    : mentors.filter(m => m.mentorType === activeFilter);

  return {
    mentors: filteredMentors,
    allMentors: mentors,
    loading,
    activeFilter,
    setActiveFilter,
    hasMore,
    loadMore,
  };
}
