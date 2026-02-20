import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameShell from '../shared/GameShell';
import MultiplayerChat from '../shared/MultiplayerChat'; // eslint-disable-line no-unused-vars
import GAME_BOOK from '../shared/gameBookData';
import { D6Display } from '../shared/DiceDisplay';
import { rollD6 } from '../shared/diceEngine';
import { TOTAL_SPACES, CENTER, mehenPositionToSVG } from './mehenData';

const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];
const PIECE_COUNT = 3;

function MehenGame({
  mode, onExit,
  // Online multiplayer props (optional)
  onlineState, myPlayerIndex, isMyTurn, onStateChange, matchData, playerNames: onlinePlayerNames,
  chatMessages, sendChat, onForfeit, onPlayerClick,
}) {
  const isOnline = mode === 'online';

  const [pieces, setPieces] = useState(isOnline ? (onlineState?.pieces || [[0, 0, 0], [0, 0, 0]]) : [[0, 0, 0], [0, 0, 0]]);
  const [currentPlayer, setCurrentPlayer] = useState(isOnline ? (matchData?.currentPlayer ?? 0) : 0);
  const [diceValue, setDiceValue] = useState(isOnline ? (onlineState?.diceValue || null) : null);
  const [gamePhase, setGamePhase] = useState(isOnline ? (matchData?.gamePhase || 'roll') : 'roll'); // roll, selectPiece, gameOver
  const [winner, setWinner] = useState(isOnline ? (matchData?.winner ?? null) : null);
  const [turnCount, setTurnCount] = useState(isOnline ? (matchData?.turnCount || 0) : 0);
  const [message, setMessage] = useState(isOnline ? (onlineState?.message || '') : 'Roll the die to begin!');
  const [moveLog, setMoveLog] = useState(isOnline ? (onlineState?.moveLog || []) : []);
  const aiTimeoutRef = useRef(null);

  // Sync from Firestore when online state changes
  useEffect(() => {
    if (!isOnline || !onlineState || !matchData) return;
    setPieces(onlineState.pieces || [[0, 0, 0], [0, 0, 0]]);
    setDiceValue(onlineState.diceValue || null);
    setMessage(onlineState.message || '');
    setMoveLog(onlineState.moveLog || []);
    setCurrentPlayer(matchData.currentPlayer ?? 0);
    setGamePhase(matchData.gamePhase || 'roll');
    setWinner(matchData.winner ?? null);
    setTurnCount(matchData.turnCount || 0);
  }, [isOnline, onlineState, matchData]);

  const isAI = mode === 'ai';
  const playerNames = useMemo(() =>
    isOnline
      ? [onlinePlayerNames?.[0] || 'Player 1', onlinePlayerNames?.[1] || 'Player 2']
      : isAI ? ['You', 'Atlas'] : ['Player 1', 'Player 2'],
    [isAI, isOnline, onlinePlayerNames]);

  // Cleanup AI timeouts on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // Check if a move is valid for a given piece
  const canMovePiece = useCallback((playerPieces, pieceIdx, roll) => {
    const currentPos = playerPieces[pieceIdx];
    if (currentPos === TOTAL_SPACES) return false; // already finished
    const newPos = currentPos + roll;
    if (newPos > TOTAL_SPACES) return false; // need exact roll
    // Can't land on own piece (unless finishing)
    if (newPos < TOTAL_SPACES) {
      for (let i = 0; i < playerPieces.length; i++) {
        if (i !== pieceIdx && playerPieces[i] === newPos) return false;
      }
    }
    return true;
  }, []);

  // Get all valid moves for a player
  const getValidMoves = useCallback((playerPieces, roll) => {
    const moves = [];
    for (let i = 0; i < PIECE_COUNT; i++) {
      if (canMovePiece(playerPieces, i, roll)) {
        moves.push(i);
      }
    }
    return moves;
  }, [canMovePiece]);

  // Execute a move
  const executeMove = useCallback((pieceIdx) => {
    const newPieces = [pieces[0].slice(), pieces[1].slice()];
    const player = currentPlayer;
    const opponent = 1 - player;
    const newPos = newPieces[player][pieceIdx] + diceValue;

    newPieces[player][pieceIdx] = newPos;
    let msg = `${playerNames[player]} rolled ${diceValue}, moved piece to position ${newPos}`;
    const newLog = [...moveLog, msg];

    // Landing on opponent's piece pushes them back 3
    if (newPos > 0 && newPos < TOTAL_SPACES) {
      for (let i = 0; i < PIECE_COUNT; i++) {
        if (newPieces[opponent][i] === newPos) {
          newPieces[opponent][i] = Math.max(0, newPieces[opponent][i] - 3);
          msg = `${playerNames[player]} bumped ${playerNames[opponent]}'s piece back!`;
          newLog.push(msg);
        }
      }
    }

    // Check for win
    const allFinished = newPieces[player].every(p => p === TOTAL_SPACES);
    if (allFinished) {
      const winMsg = `${playerNames[player]} wins!`;
      newLog.push(winMsg);

      if (isOnline && onStateChange) {
        onStateChange(
          { pieces: newPieces, diceValue, message: winMsg, moveLog: newLog },
          { currentPlayer: player, gamePhase: 'gameOver', winner: player, status: 'completed', completedAt: new Date() }
        );
        return;
      }

      setPieces(newPieces);
      setWinner(player);
      setGamePhase('gameOver');
      setMessage(winMsg);
      setMoveLog(newLog);
      return;
    }

    // Switch turns
    const nextPlayer = 1 - player;
    const turnMsg = `${playerNames[nextPlayer]}'s turn — roll the die!`;

    if (isOnline && onStateChange) {
      onStateChange(
        { pieces: newPieces, diceValue, message: turnMsg, moveLog: newLog },
        { currentPlayer: nextPlayer, gamePhase: 'roll' }
      );
      return;
    }

    setPieces(newPieces);
    setMoveLog(newLog);
    setMessage(turnMsg);
    setCurrentPlayer(nextPlayer);
    setDiceValue(null);
    setGamePhase('roll');
    setTurnCount(tc => tc + 1);
  }, [pieces, currentPlayer, diceValue, playerNames, moveLog, isOnline, onStateChange]);

  // Handle rolling the die
  const handleRoll = useCallback(() => {
    if (gamePhase !== 'roll' || winner !== null) return;
    if (isOnline && !isMyTurn) return;
    const roll = rollD6();
    setDiceValue(roll);

    const validMoves = getValidMoves(pieces[currentPlayer], roll);
    if (validMoves.length === 0) {
      const skipMsg = `${playerNames[currentPlayer]} rolled ${roll} — no valid moves! Turn skipped.`;
      const nextPlayer = 1 - currentPlayer;

      if (isOnline && onStateChange) {
        const newLog = [...moveLog, `${playerNames[currentPlayer]} rolled ${roll} — no valid moves`];
        onStateChange(
          { pieces, diceValue: roll, message: skipMsg, moveLog: newLog },
          { currentPlayer: nextPlayer, gamePhase: 'roll' }
        );
      } else {
        setMessage(skipMsg);
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} rolled ${roll} — no valid moves`]);
        setTimeout(() => {
          setCurrentPlayer(nextPlayer);
          setDiceValue(null);
          setGamePhase('roll');
          setTurnCount(tc => tc + 1);
          setMessage(`${playerNames[nextPlayer]}'s turn — roll the die!`);
        }, 800);
      }
    } else {
      if (isOnline && onStateChange) {
        const newLog = [...moveLog, `${playerNames[currentPlayer]} rolled ${roll}`];
        onStateChange(
          { pieces, diceValue: roll, message: `${playerNames[currentPlayer]} rolled ${roll}. Select a piece to move.`, moveLog: newLog },
          { currentPlayer, gamePhase: 'selectPiece' }
        );
      } else {
        setGamePhase('selectPiece');
        setMessage(`${playerNames[currentPlayer]} rolled ${roll}. Select a piece to move.`);
      }
    }
  }, [gamePhase, winner, pieces, currentPlayer, getValidMoves, playerNames, isOnline, isMyTurn, onStateChange, moveLog]);

  // Handle piece selection
  const handleSelectPiece = useCallback((pieceIdx) => {
    if (gamePhase !== 'selectPiece' || winner !== null) return;
    if (isOnline && !isMyTurn) return;
    if (!canMovePiece(pieces[currentPlayer], pieceIdx, diceValue)) return;
    executeMove(pieceIdx);
  }, [gamePhase, winner, pieces, currentPlayer, diceValue, canMovePiece, executeMove, isOnline, isMyTurn]);

  // AI logic
  useEffect(() => {
    if (!isAI || currentPlayer !== 1 || winner !== null) return;

    if (gamePhase === 'roll') {
      aiTimeoutRef.current = setTimeout(() => {
        handleRoll();
      }, 700);
    } else if (gamePhase === 'selectPiece') {
      aiTimeoutRef.current = setTimeout(() => {
        const validMoves = getValidMoves(pieces[1], diceValue);
        if (validMoves.length > 0) {
          // AI: random piece selection (nearly all luck)
          const pick = validMoves[Math.floor(Math.random() * validMoves.length)];
          executeMove(pick);
        }
      }, 500);
    }

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isAI, currentPlayer, gamePhase, winner, handleRoll, getValidMoves, pieces, diceValue, executeMove]);

  // Reset game
  const handleReset = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setPieces([[0, 0, 0], [0, 0, 0]]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setGamePhase('roll');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the die to begin!');
    setMoveLog([]);
  }, []);

  // Build spiral path for the serpent body
  const buildSerpentPath = () => {
    const outerRadius = 220;
    const innerRadius = 30;
    const cx = 250;
    const cy = 250;
    let d = '';
    // Inward spiral
    for (let i = 0; i <= 200; i++) {
      const t = i / 200; // 0 to 1
      const pos = t * 40;
      const angle = pos * (4 * Math.PI / 40);
      const radius = outerRadius - (outerRadius - innerRadius) * (pos / 40);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return d;
  };

  const buildReturnPath = () => {
    const outerRadius = 220;
    const innerRadius = 30;
    const cx = 250;
    const cy = 250;
    const angleOffset = Math.PI / 40;
    let d = '';
    // Outward spiral (drawn from center out)
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const effectivePos = t * 40; // 0 = center, 40 = outer
      const angle = effectivePos * (4 * Math.PI / 40) + angleOffset;
      const radius = outerRadius - (outerRadius - innerRadius) * (effectivePos / 40);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return d;
  };

  // Determine which pieces can be moved
  const validMoves = gamePhase === 'selectPiece'
    ? getValidMoves(pieces[currentPlayer], diceValue)
    : [];

  const isPlayerTurn = isOnline ? isMyTurn : (!isAI || currentPlayer === 0);

  const renderBoard = () => (
    <svg viewBox="0 0 500 500" style={{ width: '100%', maxWidth: 500, display: 'block', margin: '0 auto' }}>
      {/* Background */}
      <rect x="0" y="0" width="500" height="500" fill="#2a1f14" rx="12" />

      {/* Serpent head at outer start */}
      <circle cx={mehenPositionToSVG(1).x} cy={mehenPositionToSVG(1).y} r="10" fill="#5a7a3a" />
      <text
        x={mehenPositionToSVG(1).x}
        y={mehenPositionToSVG(1).y + 4}
        textAnchor="middle"
        fontSize="10"
        fill="#fff"
      >S</text>

      {/* Serpent body - inward spiral */}
      <path
        className="mehen-serpent"
        d={buildSerpentPath()}
        fill="none"
        stroke="#5a7a3a"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Return path - outward spiral */}
      <path
        className="mehen-serpent"
        d={buildReturnPath()}
        fill="none"
        stroke="#7a5a3a"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="6 4"
      />

      {/* Center marker */}
      <circle cx={250} cy={250} r={18} fill="#8b6914" opacity="0.6" />
      <text x={250} y={254} textAnchor="middle" fontSize="10" fill="#fff">Center</text>

      {/* Spaces along inward spiral */}
      {Array.from({ length: 40 }, (_, i) => {
        const pos = i + 1;
        const { x, y } = mehenPositionToSVG(pos);
        return (
          <circle
            key={`in-${pos}`}
            className="mehen-space"
            cx={x}
            cy={y}
            r={5}
            fill="#3a3a2a"
            stroke="#6a6a4a"
            strokeWidth="1"
            opacity="0.7"
          />
        );
      })}

      {/* Spaces along outward spiral */}
      {Array.from({ length: 40 }, (_, i) => {
        const pos = 41 + i;
        const { x, y } = mehenPositionToSVG(pos);
        return (
          <circle
            key={`out-${pos}`}
            className="mehen-space"
            cx={x}
            cy={y}
            r={4}
            fill="#2a2a3a"
            stroke="#5a5a7a"
            strokeWidth="1"
            opacity="0.6"
          />
        );
      })}

      {/* Pieces */}
      {pieces.map((playerPieces, pIdx) =>
        playerPieces.map((pos, pieceIdx) => {
          if (pos === 0 || pos === TOTAL_SPACES) return null; // not on board or finished
          const { x, y } = mehenPositionToSVG(pos);
          const offset = pIdx === 0 ? -4 : 4;
          return (
            <circle
              key={`piece-${pIdx}-${pieceIdx}`}
              className="board-piece"
              cx={x + offset}
              cy={y}
              r={6}
              fill={PLAYER_COLORS[pIdx]}
              stroke="#fff"
              strokeWidth="1.5"
              style={{ cursor: (gamePhase === 'selectPiece' && pIdx === currentPlayer && validMoves.includes(pieceIdx) && isPlayerTurn) ? 'pointer' : 'default' }}
              onClick={() => {
                if (pIdx === currentPlayer && isPlayerTurn) {
                  handleSelectPiece(pieceIdx);
                }
              }}
            />
          );
        })
      )}

      {/* Move target indicators */}
      {gamePhase === 'selectPiece' && isPlayerTurn && validMoves.map(pieceIdx => {
        const currentPos = pieces[currentPlayer][pieceIdx];
        const targetPos = currentPos + diceValue;
        if (targetPos > TOTAL_SPACES || targetPos <= 0) return null;
        const { x, y } = mehenPositionToSVG(targetPos);
        return (
          <circle
            key={`target-${pieceIdx}`}
            className="board-move-target"
            cx={x}
            cy={y}
            r={8}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray="3 2"
            opacity="0.8"
          />
        );
      })}
    </svg>
  );

  // Piece status display
  const renderPieceStatus = () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
      {[0, 1].map(pIdx => (
        <div key={pIdx} style={{ textAlign: 'center' }}>
          <div style={{ color: PLAYER_COLORS[pIdx], fontWeight: 'bold', marginBottom: 4 }}>
            {playerNames[pIdx]}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {pieces[pIdx].map((pos, i) => {
              const isSelectable = gamePhase === 'selectPiece' && pIdx === currentPlayer && validMoves.includes(i) && isPlayerTurn;
              const label = pos === 0 ? 'Start' : pos === TOTAL_SPACES ? 'Done' : pos <= CENTER ? `In:${pos}` : `Out:${pos - CENTER}`;
              return (
                <button
                  key={i}
                  onClick={() => isSelectable && handleSelectPiece(i)}
                  disabled={!isSelectable}
                  style={{
                    background: isSelectable ? PLAYER_COLORS[pIdx] : '#333',
                    color: isSelectable ? '#000' : '#888',
                    border: isSelectable ? '2px solid #fff' : '1px solid #555',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    cursor: isSelectable ? 'pointer' : 'default',
                    minWidth: 50,
                  }}
                >
                  P{i + 1}: {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <GameShell
      gameName="Mehen"
      onExit={onExit}
      onReset={isOnline ? null : handleReset}
      moveLog={moveLog}
      rules={GAME_BOOK['mehen'].rules}
      secrets={GAME_BOOK['mehen'].secrets}
      onForfeit={isOnline ? onForfeit : undefined}
      onPlayerClick={isOnline ? onPlayerClick : undefined}
      isOnline={isOnline}
      isMyTurn={isMyTurn}
      chatPanel={isOnline ? <MultiplayerChat messages={chatMessages || []} onSend={sendChat} myUid={matchData?.players?.[myPlayerIndex]?.uid} /> : null}
    >
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ color: '#b0a080', fontSize: 13, marginBottom: 4 }}>
          Turn {turnCount + 1} &mdash;{' '}
          <span style={{ color: PLAYER_COLORS[currentPlayer] }}>{playerNames[currentPlayer]}</span>
          {winner !== null && (
            <span style={{ color: '#ffd700', marginLeft: 8 }}>
              {playerNames[winner]} wins!
            </span>
          )}
        </div>
        <div style={{ color: '#d0c8a8', fontSize: 12, minHeight: 18 }}>
          {isOnline && !isMyTurn && !winner ? "Waiting for opponent's move..." : message}
        </div>
      </div>

      {renderBoard()}
      {renderPieceStatus()}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <D6Display value={diceValue} />
        {gamePhase === 'roll' && winner === null && isPlayerTurn && (
          <button
            onClick={handleRoll}
            disabled={isOnline && !isMyTurn}
            style={{
              background: (isOnline && !isMyTurn) ? '#666' : '#c9a961',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: 8,
              padding: '8px 24px',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: (isOnline && !isMyTurn) ? 'not-allowed' : 'pointer',
            }}
          >
            Roll Die
          </button>
        )}
      </div>
    </GameShell>
  );
}

export default MehenGame;
