import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { useCoursework } from '../coursework/CourseworkContext';
import { useWritings } from '../writings/WritingsContext';
import { useFriendRequests } from '../contexts/FriendRequestsContext';
import { useFamily } from '../contexts/FamilyContext';
import { useStoryCardSync } from '../storyCards/useStoryCardSync';
import { buildMatchProfile, computeQuickMatch } from './matchEngine';
import { apiFetch } from '../lib/chatApi';

const POOL_LIMIT = 50;

/**
 * Story Matching hook — modes (friends/family/new-friends/romantic),
 * toggle, sync, pool loading, Layer 1+2 matching, Layer 3 on-demand, pair.
 */
export function useStoryMatching() {
  const { user } = useAuth();
  const { profileData, handle, natalChart, photoURL } = useProfile();
  const { certificateData, isElementCompleted } = useCoursework();
  const { journeySyntheses } = useWritings();
  const { friends } = useFriendRequests();
  const { families } = useFamily();
  const { cards: storyCards } = useStoryCardSync();

  const [loading, setLoading] = useState(true);
  const [poolProfiles, setPoolProfiles] = useState([]);
  const [comparisons, setComparisons] = useState({});
  const [deepMatchLoading, setDeepMatchLoading] = useState(null);

  const matchingEnabled = profileData?.matchingEnabled === true;
  const matchMode = profileData?.matchMode || 'friends';
  const matchExcludeFriends = profileData?.matchExcludeFriends === true;
  const pairedWithUid = profileData?.matchPairedWith || null;

  const syncTimer = useRef(null);
  const lastProfileJson = useRef(null);

  // Collect family member UIDs (excluding self)
  const familyUids = useMemo(() => {
    if (!user || !families?.length) return [];
    const uids = new Set();
    for (const fam of families) {
      for (const uid of (fam.memberUids || [])) {
        if (uid !== user.uid) uids.add(uid);
      }
    }
    return [...uids];
  }, [user, families]);

  // Friend UIDs for filtering
  const friendUids = useMemo(() => {
    return friends.map(f => f.uid);
  }, [friends]);

  // Build my match profile from current data
  const myMatchProfile = useMemo(() => {
    if (!user) return null;
    return buildMatchProfile({
      uid: user.uid,
      handle,
      photoURL,
      natalChart,
      storyCards,
      certificateData,
      journeySyntheses,
      isElementCompleted,
      mode: matchMode,
      excludeFriends: matchExcludeFriends,
      pairedWith: pairedWithUid,
    });
  }, [user, handle, photoURL, natalChart, storyCards, certificateData, journeySyntheses, isElementCompleted, matchMode, matchExcludeFriends, pairedWithUid]);

  // --- Dual-write helper: writes a field to both profile doc and match-profile doc ---
  const dualWrite = useCallback(async (fields) => {
    if (!user || !firebaseConfigured || !db) return;
    const profileRef = doc(db, 'users', user.uid, 'meta', 'profile');
    const matchRef = doc(db, 'match-profiles', user.uid);
    try {
      await setDoc(profileRef, { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      if (matchingEnabled) {
        await setDoc(matchRef, { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to dual-write:', err);
    }
  }, [user, matchingEnabled]);

  // Toggle matching on/off
  const toggleMatching = useCallback(async () => {
    if (!user || !firebaseConfigured || !db) return;
    const newVal = !matchingEnabled;
    const profileRef = doc(db, 'users', user.uid, 'meta', 'profile');
    const matchRef = doc(db, 'match-profiles', user.uid);

    try {
      if (newVal) {
        await setDoc(profileRef, { matchingEnabled: true, updatedAt: serverTimestamp() }, { merge: true });
        if (myMatchProfile) {
          await setDoc(matchRef, { ...myMatchProfile, updatedAt: serverTimestamp() });
        }
      } else {
        await setDoc(profileRef, { matchingEnabled: false, updatedAt: serverTimestamp() }, { merge: true });
        await deleteDoc(matchRef);
        setPoolProfiles([]);
      }
    } catch (err) {
      console.error('Failed to toggle matching:', err);
    }
  }, [user, matchingEnabled, myMatchProfile]);

  // Set match mode
  const setMatchMode = useCallback(async (mode) => {
    await dualWrite({ matchMode: mode, mode });
  }, [dualWrite]);

  // Set exclude friends (romantic sub-option)
  const setExcludeFriends = useCallback(async (val) => {
    await dualWrite({ matchExcludeFriends: val, excludeFriends: val });
  }, [dualWrite]);

  // Set pair
  const setPair = useCallback(async (targetUid) => {
    await dualWrite({ matchPairedWith: targetUid, pairedWith: targetUid });
  }, [dualWrite]);

  // Clear pair
  const clearPair = useCallback(async () => {
    await dualWrite({ matchPairedWith: null, pairedWith: null });
  }, [dualWrite]);

  // Auto-sync match-profile when enabled and data changes (debounced 3s)
  useEffect(() => {
    if (!matchingEnabled || !user || !firebaseConfigured || !db || !myMatchProfile) return;

    const json = JSON.stringify(myMatchProfile);
    if (json === lastProfileJson.current) return;

    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      lastProfileJson.current = json;
      try {
        const matchRef = doc(db, 'match-profiles', user.uid);
        await setDoc(matchRef, { ...myMatchProfile, updatedAt: serverTimestamp() });
      } catch (err) {
        console.error('Failed to sync match profile:', err);
      }
    }, 3000);

    return () => clearTimeout(syncTimer.current);
  }, [matchingEnabled, user, myMatchProfile]);

  // Load pool profiles based on current mode
  useEffect(() => {
    if (!matchingEnabled || !user || !firebaseConfigured || !db) {
      setPoolProfiles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      let profiles = [];

      try {
        if (matchMode === 'friends') {
          // Friends mode: fetch match-profiles for each friend
          for (const friend of friends) {
            try {
              const snap = await getDoc(doc(db, 'match-profiles', friend.uid));
              if (snap.exists()) profiles.push(snap.data());
            } catch (err) {
              console.error(`Failed to load match profile for ${friend.uid}:`, err);
            }
          }
        } else if (matchMode === 'family') {
          // Family mode: fetch match-profiles for each family member
          for (const uid of familyUids) {
            try {
              const snap = await getDoc(doc(db, 'match-profiles', uid));
              if (snap.exists()) profiles.push(snap.data());
            } catch (err) {
              console.error(`Failed to load match profile for ${uid}:`, err);
            }
          }
        } else if (matchMode === 'new-friends') {
          // New Friends mode: query all match-profiles, limit 50
          const q = query(collection(db, 'match-profiles'), limit(POOL_LIMIT));
          const snap = await getDocs(q);
          snap.forEach(d => {
            const data = d.data();
            if (data.uid !== user.uid) profiles.push(data);
          });
        } else if (matchMode === 'romantic') {
          // Romantic mode: query match-profiles where mode is romantic or new-friends
          const q = query(
            collection(db, 'match-profiles'),
            where('mode', 'in', ['romantic', 'new-friends']),
            limit(POOL_LIMIT)
          );
          const snap = await getDocs(q);
          const familySet = new Set(familyUids);
          const friendSet = new Set(friendUids);
          snap.forEach(d => {
            const data = d.data();
            if (data.uid === user.uid) return;
            // Always exclude family
            if (familySet.has(data.uid)) return;
            // Optionally exclude friends
            if (matchExcludeFriends && friendSet.has(data.uid)) return;
            profiles.push(data);
          });
        }
      } catch (err) {
        console.error('Failed to load match pool:', err);
      }

      if (!cancelled) {
        setPoolProfiles(profiles);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [matchingEnabled, user, matchMode, friends, familyUids, friendUids, matchExcludeFriends]);

  // Load cached comparisons on mount
  useEffect(() => {
    if (!matchingEnabled || !user || !firebaseConfigured || !db) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'match-profiles', user.uid, 'comparisons'));
        if (cancelled) return;
        const cached = {};
        const now = Date.now();
        snap.forEach(d => {
          const data = d.data();
          const expiresAt = data.expiresAt?.toMillis?.() || 0;
          if (expiresAt > now) {
            cached[d.id] = data;
          }
        });
        setComparisons(cached);
      } catch {
        // No comparisons yet
      }
    })();

    return () => { cancelled = true; };
  }, [matchingEnabled, user]);

  // Compute Layer 1+2 matches — when paired, only show the paired person
  const matches = useMemo(() => {
    if (!matchingEnabled || !myMatchProfile || poolProfiles.length === 0) {
      // If paired, still show paired person even if pool is empty (they might not be in current pool)
      return [];
    }

    const all = poolProfiles
      .map(fp => ({
        ...computeQuickMatch(myMatchProfile, fp),
        uid: fp.uid,
        handle: fp.handle,
        photoURL: fp.photoURL,
        cardCount: fp.completions?.cardCount || 0,
      }));

    if (pairedWithUid) {
      // Show only the paired person — always show even at score 0
      const paired = all.find(m => m.uid === pairedWithUid);
      return paired ? [paired] : [];
    }

    return all
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [matchingEnabled, myMatchProfile, poolProfiles, pairedWithUid]);

  // Request Layer 3 deep match
  const requestDeepMatch = useCallback(async (targetUid) => {
    if (!user || deepMatchLoading) return;
    setDeepMatchLoading(targetUid);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'story-match', targetUid, friendUid: targetUid }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to compute deep match');
      }
      const result = await res.json();
      setComparisons(prev => ({ ...prev, [targetUid]: result }));
    } catch (err) {
      console.error('Deep match failed:', err);
    } finally {
      setDeepMatchLoading(null);
    }
  }, [user, deepMatchLoading]);

  // Auto-trigger deep match when pairing
  const handlePair = useCallback(async (targetUid) => {
    await setPair(targetUid);
    // Auto-trigger deep match for the paired person
    if (!comparisons[targetUid]) {
      requestDeepMatch(targetUid);
    }
  }, [setPair, comparisons, requestDeepMatch]);

  return {
    matchingEnabled,
    toggleMatching,
    matchMode,
    setMatchMode,
    matchExcludeFriends,
    setExcludeFriends,
    pairedWithUid,
    setPair: handlePair,
    clearPair,
    matches,
    comparisons,
    requestDeepMatch,
    deepMatchLoading,
    loading,
  };
}
