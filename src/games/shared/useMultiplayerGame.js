import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc, collection, onSnapshot, updateDoc, addDoc, runTransaction,
  serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore';
import { db, auth as firebaseAuth } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';

export default function useMultiplayerGame(matchId) {
  const { user } = useAuth();
  const [matchData, setMatchData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const matchRef = useRef(null);

  // Subscribe to match document
  useEffect(() => {
    if (!matchId || !user || !db) return;

    const ref = doc(db, 'matches', matchId);
    matchRef.current = ref;

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMatchData({ id: snap.id, ...snap.data() });
      } else {
        setError('Match not found');
      }
      setLoading(false);
    }, (err) => {
      console.error('Match listener error:', err);
      setError('Failed to load match');
      setLoading(false);
    });

    return unsub;
  }, [matchId, user]);

  // Subscribe to chat subcollection
  useEffect(() => {
    if (!matchId || !user || !db) return;

    const chatRef = collection(db, 'matches', matchId, 'chat');
    const chatQuery = query(chatRef, orderBy('createdAt', 'asc'), limit(200));

    const unsub = onSnapshot(chatQuery, (snap) => {
      const msgs = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      setChatMessages(msgs);
    });

    return unsub;
  }, [matchId, user]);

  // Cleanup chat when match completes/forfeited
  const cleanupCalledRef = useRef(false);
  useEffect(() => {
    if (!matchData || cleanupCalledRef.current) return;
    if (matchData.status !== 'completed' && matchData.status !== 'forfeited') return;

    cleanupCalledRef.current = true;
    (async () => {
      try {
        const token = await firebaseAuth?.currentUser?.getIdToken();
        if (!token) return;
        await fetch('/api/cleanup-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, matchId }),
        });
      } catch (err) {
        // Non-critical — chat cleanup is best-effort
        console.warn('Chat cleanup failed:', err);
      }
    })();
  }, [matchData, matchId]);

  // Compute derived state
  const myPlayerIndex = matchData?.players
    ? (matchData.players[0]?.uid === user?.uid ? 0 : matchData.players[1]?.uid === user?.uid ? 1 : -1)
    : -1;
  const isMyTurn = matchData?.currentPlayer === myPlayerIndex && matchData?.status === 'active';
  const gameState = matchData?.gameState || null;

  // Update game state with turnCount guard (optimistic concurrency)
  const updateGameState = useCallback(async (newState, updates = {}) => {
    if (!matchRef.current || !matchData) return;

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(matchRef.current);
        if (!snap.exists()) throw new Error('Match not found');

        const data = snap.data();
        if (data.turnCount !== matchData.turnCount) {
          throw new Error('Stale turn — another update occurred');
        }

        tx.update(matchRef.current, {
          gameState: newState,
          turnCount: (data.turnCount || 0) + 1,
          updatedAt: serverTimestamp(),
          lastMoveBy: user.uid,
          lastMoveAt: serverTimestamp(),
          ...updates,
        });
      });
    } catch (err) {
      console.error('updateGameState failed:', err);
      setError(err.message);
    }
  }, [matchData, user]);

  // Send chat message
  const sendChat = useCallback(async (text) => {
    if (!matchId || !user || !db || !text.trim()) return;

    const chatRef = collection(db, 'matches', matchId, 'chat');
    await addDoc(chatRef, {
      uid: user.uid,
      handle: matchData?.players?.[myPlayerIndex]?.handle || 'Player',
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  }, [matchId, user, matchData, myPlayerIndex]);

  // Forfeit
  const forfeit = useCallback(async () => {
    if (!matchRef.current || !matchData) return;

    const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
    await updateDoc(matchRef.current, {
      status: 'forfeited',
      winner: opponentIndex,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, [matchData, myPlayerIndex]);

  return {
    matchData,
    gameState,
    myPlayerIndex,
    isMyTurn,
    updateGameState,
    sendChat,
    chatMessages,
    forfeit,
    loading,
    error,
  };
}
