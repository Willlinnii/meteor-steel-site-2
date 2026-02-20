import React, { useState } from 'react';
import useMultiplayerGame from './useMultiplayerGame';
import { SERIALIZERS } from './gameSerializers';
import PlayerCard from './PlayerCard';

export default function MultiplayerWrapper({ gameId, matchId, GameComponent, onExit }) {
  const {
    matchData, gameState, myPlayerIndex, isMyTurn,
    updateGameState, sendChat, chatMessages, forfeit,
    loading, error,
  } = useMultiplayerGame(matchId);

  const [playerCardTarget, setPlayerCardTarget] = useState(null); // { uid, handle }

  if (loading) {
    return (
      <div className="game-lobby">
        <div className="game-lobby-title">Loading match...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-lobby">
        <div className="game-lobby-error">{error}</div>
        <button className="game-shell-back" onClick={onExit}>&#8592; Games</button>
      </div>
    );
  }

  if (!matchData) return null;

  // Waiting for opponent (status === 'waiting')
  if (matchData.status === 'waiting') {
    return (
      <div className="game-lobby">
        <button className="game-shell-back" onClick={onExit}>&#8592; Games</button>
        <h2 className="game-lobby-title">Waiting for opponent...</h2>
        <p className="game-lobby-playing-as">
          Challenged @{matchData.players[1]?.handle || 'opponent'}
        </p>
      </div>
    );
  }

  // Match completed or forfeited — show end screen
  if (matchData.status === 'completed' || matchData.status === 'forfeited') {
    const winnerIdx = matchData.winner;
    const winnerHandle = matchData.players[winnerIdx]?.handle || `Player ${winnerIdx + 1}`;
    const iWon = winnerIdx === myPlayerIndex;
    const wasForfeited = matchData.status === 'forfeited';

    // Still render the game component so the player sees the final board state,
    // but also show a result overlay they can dismiss
    const serializer = SERIALIZERS[gameId];
    const deserialized = serializer ? serializer.deserialize(gameState || {}) : gameState;
    const playerNames = [
      matchData.players[0]?.handle || 'Player 1',
      matchData.players[1]?.handle || 'Player 2',
    ];

    return (
      <div style={{ position: 'relative' }}>
        <div className="multiplayer-result-overlay">
          <div className="multiplayer-result-card">
            <h2 className="multiplayer-result-heading">
              {iWon ? 'You Win!' : 'You Lost'}
            </h2>
            <p className="multiplayer-result-detail">
              {wasForfeited
                ? (iWon ? 'Your opponent forfeited.' : 'You forfeited the match.')
                : `@${winnerHandle} won the game.`}
            </p>
            <button className="game-shell-back" onClick={onExit}>&#8592; Back to Games</button>
          </div>
        </div>
        <GameComponent
          mode="online"
          onExit={onExit}
          onlineState={deserialized}
          myPlayerIndex={myPlayerIndex}
          isMyTurn={false}
          onStateChange={() => {}}
          matchData={matchData}
          playerNames={playerNames}
          chatMessages={chatMessages}
          sendChat={sendChat}
          onForfeit={null}
        />
      </div>
    );
  }

  const serializer = SERIALIZERS[gameId];
  const deserialized = serializer ? serializer.deserialize(gameState || {}) : gameState;

  // Build handler for state changes from the game component
  const handleStateChange = async (newLocalState, matchUpdates = {}) => {
    const serialized = serializer ? serializer.serialize(newLocalState) : newLocalState;
    await updateGameState(serialized, matchUpdates);
  };

  // Build player names for the game
  const playerNames = [
    matchData.players[0]?.handle || 'Player 1',
    matchData.players[1]?.handle || 'Player 2',
  ];

  // Player click handler for player cards
  const handlePlayerClick = (playerIndex) => {
    const player = matchData.players[playerIndex];
    if (player?.uid) {
      setPlayerCardTarget({ uid: player.uid, handle: player.handle });
    }
  };

  return (
    <>
      <GameComponent
        mode="online"
        onExit={onExit}
        onlineState={deserialized}
        myPlayerIndex={myPlayerIndex}
        isMyTurn={isMyTurn}
        onStateChange={handleStateChange}
        matchData={matchData}
        playerNames={playerNames}
        chatMessages={chatMessages}
        sendChat={sendChat}
        onForfeit={forfeit}
        onPlayerClick={handlePlayerClick}
      />
      {playerCardTarget && (
        <PlayerCard
          uid={playerCardTarget.uid}
          handle={playerCardTarget.handle}
          isActive={true}
          onClose={() => setPlayerCardTarget(null)}
        />
      )}
    </>
  );
}
