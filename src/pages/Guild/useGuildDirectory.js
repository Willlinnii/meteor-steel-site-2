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
 * Shared hook for fetching and paginating the guild directory.
 * Used by both GuildDirectory and MentorDirectoryPage.
 */
export function useGuildDirectory() {
  const [guildMembers, setGuildMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    async function fetchGuildMembers() {
      try {
        const dirRef = collection(db, 'guild-directory');
        const q = query(
          dirRef,
          where('active', '==', true),
          orderBy('availableSlots', 'desc'),
          limit(PAGE_SIZE),
        );
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setGuildMembers(results);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.size === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to fetch guild directory:', err);
      }
      setLoading(false);
    }

    fetchGuildMembers();
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !hasMore) return;
    try {
      const dirRef = collection(db, 'guild-directory');
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
      setGuildMembers(prev => [...prev, ...results]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more guild members:', err);
    }
  }, [lastDoc, hasMore]);

  const filteredMembers = activeFilter === 'all'
    ? guildMembers
    : guildMembers.filter(m => (m.guildType || m.mentorType) === activeFilter);

  return {
    members: filteredMembers,
    allMembers: guildMembers,
    loading,
    activeFilter,
    setActiveFilter,
    hasMore,
    loadMore,
  };
}
