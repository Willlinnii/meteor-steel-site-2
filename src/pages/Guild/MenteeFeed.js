import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import FellowshipPost from '../../components/fellowship/FellowshipPost';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * MenteeFeed — shows fellowship posts from mentor's active mentees.
 * Queries mentor-pairings for accepted mentees, then queries fellowship-posts.
 */
export default function MenteeFeed() {
  const { user } = useAuth();
  const [menteeUids, setMenteeUids] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Load active mentee UIDs
  useEffect(() => {
    if (!user || !db || !firebaseConfigured) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'mentor-pairings'),
      where('mentorUid', '==', user.uid),
      where('status', '==', 'ACCEPTED'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const uids = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.studentUid) uids.push(data.studentUid);
      });
      setMenteeUids(uids);
    }, () => setMenteeUids([]));

    return unsub;
  }, [user]);

  // 2. Load fellowship posts from mentee UIDs
  useEffect(() => {
    if (!db || menteeUids.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Batch mentee UIDs in chunks of 10
    const chunks = [];
    for (let i = 0; i < menteeUids.length; i += 10) {
      chunks.push(menteeUids.slice(i, i + 10));
    }

    const unsubs = [];
    const chunkResults = chunks.map(() => []);

    const mergeAndSet = () => {
      const all = chunkResults.flat();
      all.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setPosts(all.slice(0, 30));
      setLoading(false);
    };

    chunks.forEach((chunk, idx) => {
      const q = query(
        collection(db, 'fellowship-posts'),
        where('authorUid', 'in', chunk),
        orderBy('createdAt', 'desc'),
        limit(30),
      );
      const unsub = onSnapshot(q, (snap) => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        chunkResults[idx] = items;
        mergeAndSet();
      }, () => {
        chunkResults[idx] = [];
        mergeAndSet();
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [menteeUids]);

  const handleCircle = async (postId) => {
    if (!user || !db) return;
    const postRef = doc(db, 'fellowship-posts', postId);
    const post = posts.find(p => p.id === postId);
    const alreadyCircled = post?.circledBy?.includes(user.uid);
    try {
      await updateDoc(postRef, {
        circledBy: alreadyCircled ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (err) {
      console.error('Failed to circle post:', err);
    }
  };

  if (loading) {
    return (
      <div className="guild-members-only">
        <div className="fellowship-spinner" />
      </div>
    );
  }

  if (menteeUids.length === 0) {
    return (
      <div className="guild-members-only">
        <p>No active mentees yet.</p>
        <p>Once you accept mentee requests, their completions will appear here.</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="guild-members-only">
        <p>Your mentees haven't shared any completions yet.</p>
      </div>
    );
  }

  return (
    <div className="guild-mentee-feed">
      {posts.map(post => (
        <FellowshipPost
          key={post.id}
          post={post}
          currentUid={user?.uid}
          onDelete={() => {}}
          onCircle={handleCircle}
        />
      ))}
    </div>
  );
}
