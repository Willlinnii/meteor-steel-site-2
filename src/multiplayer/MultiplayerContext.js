import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';

const MultiplayerContext = createContext(null);

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error('useMultiplayer must be used within MultiplayerProvider');
  return ctx;
}

export function MultiplayerProvider({ children }) {
  const { user } = useAuth();
  const [activeMatches, setActiveMatches] = useState([]);

  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setActiveMatches([]);
      return;
    }

    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('playerUids', 'array-contains', user.uid),
      where('status', 'in', ['waiting', 'active']),
      orderBy('updatedAt', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const matches = [];
      snap.forEach(d => matches.push({ id: d.id, ...d.data() }));
      setActiveMatches(matches);
    }, (err) => {
      console.error('Active matches listener error:', err);
    });

    return unsub;
  }, [user]);

  const getMatchesForGame = (gameId) => {
    return activeMatches.filter(m => m.gameType === gameId);
  };

  const myTurnCount = activeMatches.filter(m =>
    m.status === 'active' &&
    m.players?.[m.currentPlayer]?.uid === user?.uid
  ).length;

  const value = {
    activeMatches,
    getMatchesForGame,
    myTurnCount,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}
