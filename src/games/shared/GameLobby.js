import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { useMultiplayer } from '../../multiplayer/MultiplayerContext';
import { SERIALIZERS } from './gameSerializers';
import OpponentSearch from './OpponentSearch';
import { checkAvailability, registerHandle } from '../../multiplayer/handleService';

export default function GameLobby({ gameId, gameName, onExit }) {
  const { user } = useAuth();
  const { handle, refreshProfile } = useProfile();
  const { getMatchesForGame } = useMultiplayer();
  const navigate = useNavigate();

  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Inline handle setup state
  const [handleInput, setHandleInput] = useState('');
  const [handleStatus, setHandleStatus] = useState(null);
  const [handleSaving, setHandleSaving] = useState(false);

  const existingMatches = getMatchesForGame(gameId);

  const checkHandle = useCallback(async (value) => {
    if (!value || value.length < 3) { setHandleStatus(null); return; }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(value)) { setHandleStatus('format'); return; }
    setHandleStatus('checking');
    try {
      const available = await checkAvailability(value);
      setHandleStatus(available ? 'available' : 'taken');
    } catch (err) {
      console.error('Handle availability check failed:', err);
      setHandleStatus('check-error');
    }
  }, []);

  const saveHandle = useCallback(async () => {
    if (handleStatus !== 'available' || handleSaving) return;
    setHandleSaving(true);
    try {
      await registerHandle(handleInput);
      await refreshProfile();
      setHandleInput('');
      setHandleStatus(null);
    } catch (err) {
      console.error('Handle registration failed:', err);
      setHandleStatus('save-error');
    }
    setHandleSaving(false);
  }, [handleInput, handleStatus, handleSaving, refreshProfile]);

  const createMatch = useCallback(async () => {
    if (!selectedOpponent || !handle || creating) return;
    setCreating(true);
    setError(null);

    try {
      const serializer = SERIALIZERS[gameId];
      if (!serializer) throw new Error('Game not configured for multiplayer');

      const matchDoc = {
        gameType: gameId,
        players: {
          0: { uid: user.uid, handle, displayName: user.displayName || handle },
          1: { uid: selectedOpponent.uid, handle: selectedOpponent.handle, displayName: selectedOpponent.handle },
        },
        playerUids: [user.uid, selectedOpponent.uid],
        createdBy: user.uid,
        status: 'active',
        currentPlayer: 0,
        gamePhase: 'rolling',
        turnCount: 0,
        winner: null,
        gameState: serializer.initialState(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        lastMoveBy: null,
        lastMoveAt: null,
      };

      const ref = await addDoc(collection(db, 'matches'), matchDoc);
      navigate(`/games/${gameId}/online/${ref.id}`);
    } catch (err) {
      console.error('Failed to create match:', err);
      setError(err.message);
      setCreating(false);
    }
  }, [selectedOpponent, handle, creating, gameId, user, navigate]);

  // If user has no handle, show inline setup
  if (!handle) {
    return (
      <div className="game-lobby">
        <button className="game-shell-back" onClick={onExit}>&#8592; Games</button>
        <h2 className="game-lobby-title">{gameName} — Online</h2>
        <div className="game-lobby-handle-setup">
          <p>You need a handle to play online.</p>
          <div className="profile-handle-form">
            <input
              className="profile-handle-input"
              type="text"
              placeholder="Choose a handle..."
              value={handleInput}
              maxLength={20}
              onChange={e => { setHandleInput(e.target.value); checkHandle(e.target.value); }}
            />
            <button
              className="profile-handle-save-btn"
              disabled={handleStatus !== 'available' || handleSaving}
              onClick={saveHandle}
            >
              {handleSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {handleStatus === 'checking' && <div className="profile-handle-status">Checking...</div>}
          {handleStatus === 'available' && <div className="profile-handle-status available">Available</div>}
          {handleStatus === 'taken' && <div className="profile-handle-status taken">Already taken</div>}
          {handleStatus === 'format' && <div className="profile-handle-status error">3-20 chars, letters/numbers/_/- only</div>}
          {handleStatus === 'check-error' && <div className="profile-handle-status error">Could not check availability — check console</div>}
          {handleStatus === 'save-error' && <div className="profile-handle-status error">Failed to save handle — check console</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="game-lobby">
      <button className="game-shell-back" onClick={onExit}>&#8592; Games</button>
      <h2 className="game-lobby-title">{gameName} — Online</h2>
      <p className="game-lobby-playing-as">Playing as <strong>@{handle}</strong></p>

      {/* Existing matches */}
      {existingMatches.length > 0 && (
        <div className="game-lobby-matches">
          <h3 className="game-lobby-subtitle">Active Matches</h3>
          {existingMatches.map(match => {
            const opponentIdx = match.players[0]?.uid === user.uid ? 1 : 0;
            const opponent = match.players[opponentIdx];
            const myTurn = match.players[match.currentPlayer]?.uid === user.uid;
            return (
              <button
                key={match.id}
                className={`game-lobby-match-card${myTurn ? ' my-turn' : ''}`}
                onClick={() => navigate(`/games/${gameId}/online/${match.id}`)}
              >
                <span className="game-lobby-match-opponent">vs @{opponent?.handle}</span>
                <span className="game-lobby-match-status">
                  {match.status === 'waiting' ? 'Waiting...' : myTurn ? 'Your turn' : 'Their turn'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Challenge opponent */}
      <div className="game-lobby-challenge">
        <h3 className="game-lobby-subtitle">Challenge a Player</h3>
        <OpponentSearch onSelect={setSelectedOpponent} />
        {selectedOpponent && (
          <div className="game-lobby-selected">
            <span>Challenge @{selectedOpponent.handle}?</span>
            <button
              className="game-lobby-challenge-btn"
              onClick={createMatch}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Challenge!'}
            </button>
            <button
              className="game-lobby-cancel-btn"
              onClick={() => setSelectedOpponent(null)}
            >
              Cancel
            </button>
          </div>
        )}
        {error && <div className="game-lobby-error">{error}</div>}
      </div>
    </div>
  );
}
