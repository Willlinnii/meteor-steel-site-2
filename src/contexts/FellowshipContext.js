import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp, limit as firestoreLimit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useFriendRequests } from './FriendRequestsContext';

// Pure filtering helpers — exported for testing
export function filterFeedItems(rawItems, userUid, familyUids) {
  return rawItems.filter(item => {
    const vis = item.visibility || 'friends';
    if (vis === 'vault' || vis === 'profile') return false;
    if (vis === 'family') {
      if (item.authorUid === userUid) return true;
      return familyUids.has(item.authorUid);
    }
    return true; // friends + public pass through
  });
}

export function filterMyVaultPosts(rawItems, userUid) {
  return userUid ? rawItems.filter(i => i.authorUid === userUid && i.visibility === 'vault') : [];
}

export function filterMyProfilePosts(rawItems, userUid) {
  return userUid ? rawItems.filter(i => i.authorUid === userUid && i.visibility === 'profile') : [];
}

const FellowshipContext = createContext(null);

export function useFellowship() {
  const ctx = useContext(FellowshipContext);
  if (!ctx) throw new Error('useFellowship must be used within FellowshipProvider');
  return ctx;
}

export function FellowshipProvider({ children }) {
  const { user } = useAuth();
  const { friends, familyUids } = useFriendRequests();
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build list of UIDs to query: self + friends
  const feedUids = useMemo(() => {
    if (!user) return [];
    const uids = [user.uid];
    friends.forEach(f => { if (f.uid) uids.push(f.uid); });
    return uids;
  }, [user, friends]);

  // Real-time listener for fellowship posts from self + friends
  useEffect(() => {
    if (!user || !firebaseConfigured || !db || feedUids.length === 0) {
      setRawItems([]);
      setLoading(false);
      return;
    }

    // Firestore `in` supports up to 30 values; batch if needed
    const batches = [];
    for (let i = 0; i < feedUids.length; i += 10) {
      batches.push(feedUids.slice(i, i + 10));
    }

    const unsubscribers = [];
    const batchResults = new Array(batches.length).fill(null).map(() => []);

    const mergeAndSet = () => {
      const all = batchResults.flat();
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setRawItems(all);
      setLoading(false);
    };

    batches.forEach((batch, idx) => {
      const q = query(
        collection(db, 'fellowship-posts'),
        where('authorUid', 'in', batch),
        orderBy('createdAt', 'desc'),
        firestoreLimit(50),
      );
      const unsub = onSnapshot(q, (snap) => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        batchResults[idx] = items;
        mergeAndSet();
      }, () => {
        batchResults[idx] = [];
        mergeAndSet();
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(u => u());
  }, [user, feedUids]);

  // Derived views from rawItems
  const feedItems = useMemo(() => filterFeedItems(rawItems, user?.uid, familyUids), [rawItems, user, familyUids]);
  const myVaultPosts = useMemo(() => filterMyVaultPosts(rawItems, user?.uid), [user, rawItems]);
  const myProfilePosts = useMemo(() => filterMyProfilePosts(rawItems, user?.uid), [user, rawItems]);

  // Check if user already posted for a given completion
  const hasPostedCompletion = useCallback((completionType, completionId) => {
    if (!user) return false;
    return rawItems.some(
      item => item.authorUid === user.uid
        && item.completionType === completionType
        && item.completionId === completionId
    );
  }, [user, rawItems]);

  // Upload images to Firebase Storage
  const uploadImages = useCallback(async (files) => {
    if (!user || !storage) return [];
    const results = [];
    for (const file of files) {
      const timestamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `fellowship/${user.uid}/${timestamp}-${rand}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      results.push({ url, storagePath, name: file.name });
    }
    return results;
  }, [user]);

  // Post a completion share
  const postCompletionShare = useCallback(async ({ summary, fullStory, completionType, completionId, completionLabel, images, videoURL, visibility = 'friends', privateMatching = false }) => {
    if (!user || !db) return null;
    const postData = {
      authorUid: user.uid,
      authorHandle: user.displayName || '',
      authorName: user.displayName || '',
      authorPhotoURL: user.photoURL || null,
      type: 'completion-share',
      completionType: completionType || null,
      completionId: completionId || null,
      completionLabel: completionLabel || null,
      summary: summary || '',
      fullStory: fullStory || null,
      images: images || [],
      videoURL: videoURL || null,
      activityType: null,
      activityTargetHandle: null,
      activityMessage: null,
      visibility,
      privateMatching: visibility === 'vault' ? privateMatching : false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'fellowship-posts'), postData);
    return docRef.id;
  }, [user]);

  // Post an activity item (e.g. friend accepted)
  const postActivity = useCallback(async ({ activityType, activityTargetHandle, activityMessage }) => {
    if (!user || !db) return null;
    const postData = {
      authorUid: user.uid,
      authorHandle: user.displayName || '',
      authorName: user.displayName || '',
      authorPhotoURL: user.photoURL || null,
      type: 'activity',
      completionType: null,
      completionId: null,
      completionLabel: null,
      summary: activityMessage || '',
      fullStory: null,
      images: [],
      videoURL: null,
      activityType,
      activityTargetHandle: activityTargetHandle || null,
      activityMessage: activityMessage || null,
      visibility: 'friends',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'fellowship-posts'), postData);
    return docRef.id;
  }, [user]);

  // Delete own post
  const deletePost = useCallback(async (postId) => {
    if (!db) return;
    await deleteDoc(doc(db, 'fellowship-posts', postId));
  }, []);

  return (
    <FellowshipContext.Provider value={{
      feedItems,
      myVaultPosts,
      myProfilePosts,
      loading,
      postCompletionShare,
      postActivity,
      deletePost,
      hasPostedCompletion,
      uploadImages,
    }}>
      {children}
    </FellowshipContext.Provider>
  );
}
