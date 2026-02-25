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

    // Landing on opponent's piece sends them to nearest empty space behind
    if (newPos > 0 && newPos < TOTAL_SPACES) {
      for (let i = 0; i < PIECE_COUNT; i++) {
        if (newPieces[opponent][i] === newPos) {
          // Find the nearest empty space behind (searching backward from newPos - 1)
          let bumpDest = 0; // default to start
          for (let s = newPos - 1; s >= 0; s--) {
            const occupied = newPieces[0].some((p, idx) => p === s && !(idx === i && opponent === 0))
              || newPieces[1].some((p, idx) => p === s && !(idx === i && opponent === 1));
            if (!occupied || s === 0) {
              bumpDest = s;
              break;
            }
          }
          newPieces[opponent][i] = bumpDest;
          msg = `${playerNames[player]} bumped ${playerNames[opponent]}'s piece back to ${bumpDest}!`;
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

  // Spiral constants — 7 coils, touching
  const REVOLUTIONS = 7;
  const OUTER_R = 220;
  const INNER_R = 30;
  const CX = 250;
  const CY = 250;
  const RING_SPACING = (OUTER_R - INNER_R) / REVOLUTIONS; // ~27px
  const BODY_W = RING_SPACING; // touching coils
  const STEPS = 500; // high resolution for smooth spiral

  // Build spiral path for the serpent body (single serpent, 7 coils)
  const buildSerpentPath = () => {
    let d = '';
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const pos = t * 40;
      const angle = pos * (REVOLUTIONS * 2 * Math.PI / 40);
      const radius = OUTER_R - (OUTER_R - INNER_R) * (pos / 40);
      const x = CX + radius * Math.cos(angle);
      const y = CY + radius * Math.sin(angle);
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
    <svg className="game-board-svg" viewBox="0 0 500 500">
      <defs>
        <radialGradient id="mehen-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a2f1e" />
          <stop offset="100%" stopColor="#1a1510" />
        </radialGradient>
        <radialGradient id="mehen-solar" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#c9a961" />
          <stop offset="60%" stopColor="#8b6914" />
          <stop offset="100%" stopColor="#5a4410" />
        </radialGradient>
        <linearGradient id="mehen-serpent-in" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a9a4a" />
          <stop offset="100%" stopColor="#3a5a2a" />
        </linearGradient>
        <radialGradient id="mehen-piece-gold" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#e8c878" />
          <stop offset="100%" stopColor="#a88832" />
        </radialGradient>
        <radialGradient id="mehen-piece-steel" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a8b8d8" />
          <stop offset="100%" stopColor="#5a6f94" />
        </radialGradient>
        <filter id="mehen-head-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* No rectangular background — the serpent coil IS the board */}

      {/* Serpent body — single coiled serpent, 7 rings, touching */}
      {/* Dark outline (slightly wider than body to form coil borders) */}
      <path
        d={buildSerpentPath()}
        fill="none"
        stroke="#1a2a10"
        strokeWidth={BODY_W + 2}
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Main body */}
      <path
        className="mehen-serpent"
        d={buildSerpentPath()}
        fill="none"
        stroke="#4a7a2a"
        strokeWidth={BODY_W - 2}
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Belly stripe (lighter center) */}
      <path
        d={buildSerpentPath()}
        fill="none"
        stroke="#8aba6a"
        strokeWidth={5}
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* Scale marks along spiral */}
      {(() => {
        const marks = [];
        const scaleCount = 160;
        const angularSpeed = REVOLUTIONS * 2 * Math.PI / 40;
        const dRadius = -(OUTER_R - INNER_R) / 40;
        for (let i = 1; i < scaleCount; i++) {
          const t = i / scaleCount;
          const pos = t * 40;
          const angle = pos * angularSpeed;
          const radius = OUTER_R - (OUTER_R - INNER_R) * (pos / 40);
          const x = CX + radius * Math.cos(angle);
          const y = CY + radius * Math.sin(angle);
          const tangentX = dRadius * Math.cos(angle) - radius * Math.sin(angle) * angularSpeed;
          const tangentY = dRadius * Math.sin(angle) + radius * Math.cos(angle) * angularSpeed;
          const tLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1;
          const nx = -tangentY / tLen;
          const ny = tangentX / tLen;
          const scaleSize = BODY_W * 0.4;
          marks.push(
            <path
              key={`scale-${i}`}
              d={`M ${x + nx * scaleSize} ${y + ny * scaleSize} L ${x + tangentX / tLen * 2.5} ${y + tangentY / tLen * 2.5} L ${x - nx * scaleSize} ${y - ny * scaleSize} L ${x - tangentX / tLen * 2.5} ${y - tangentY / tLen * 2.5} Z`}
              fill="none"
              stroke="#2a4a1a"
              strokeWidth="0.5"
              opacity="0.35"
            />
          );
        }
        return marks;
      })()}

      {/* Pointed tail at outer edge (near spiral start) */}
      {(() => {
        // Tail at the outermost point of the spiral
        const outerR = OUTER_R;
        const tailX = CX + outerR;
        const tailY = CY;
        // Tangent at start of spiral points roughly "up" (perpendicular to radius)
        const tipX = tailX + 12;
        const tipY = tailY;
        return (
          <path
            d={`M ${tailX} ${tailY - 5} L ${tipX} ${tipY} L ${tailX} ${tailY + 5}`}
            fill="#4a7a2a" opacity="0.6"
          />
        );
      })()}

      {/* Serpent head at center — mouth of the coil */}
      {(() => {
        // Head sits at the innermost end of the spiral
        // Compute the inner end point (t=1, pos=40)
        const innerAngle = 40 * (REVOLUTIONS * 2 * Math.PI / 40);
        const headX = CX + INNER_R * Math.cos(innerAngle);
        const headY = CY + INNER_R * Math.sin(innerAngle);
        // Tangent direction at inner end (pointing inward along spiral)
        const prevAngle = 39 * (REVOLUTIONS * 2 * Math.PI / 40);
        const prevR = OUTER_R - (OUTER_R - INNER_R) * (39 / 40);
        const prevX = CX + prevR * Math.cos(prevAngle);
        const prevY = CY + prevR * Math.sin(prevAngle);
        const hdx = headX - prevX;
        const hdy = headY - prevY;
        const hDist = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
        const hux = hdx / hDist;
        const huy = hdy / hDist;
        const hpx = -huy;
        const hpy = hux;
        const headAngle = Math.atan2(huy, hux) * 180 / Math.PI;
        const hw = BODY_W * 0.6;
        const hh = BODY_W * 0.4;
        // Tongue extends in the direction the serpent is facing (toward center)
        const tongueX = headX + hux * (hw + 3);
        const tongueY = headY + huy * (hw + 3);
        return (
          <g filter="url(#mehen-head-glow)">
            <ellipse
              cx={headX} cy={headY}
              rx={hw} ry={hh}
              fill="#5a7a3a"
              transform={`rotate(${headAngle} ${headX} ${headY})`}
            />
            {/* Eyes */}
            <circle cx={headX + hpx * (hh * 0.55) + hux * 2} cy={headY + hpy * (hh * 0.55) + huy * 2} r="2.2" fill="#fff" />
            <circle cx={headX + hpx * (hh * 0.55) + hux * 2} cy={headY + hpy * (hh * 0.55) + huy * 2} r="1.1" fill="#1a1a00" />
            <circle cx={headX - hpx * (hh * 0.55) + hux * 2} cy={headY - hpy * (hh * 0.55) + huy * 2} r="2.2" fill="#fff" />
            <circle cx={headX - hpx * (hh * 0.55) + hux * 2} cy={headY - hpy * (hh * 0.55) + huy * 2} r="1.1" fill="#1a1a00" />
            {/* Forked tongue */}
            <line x1={headX} y1={headY} x2={tongueX} y2={tongueY}
              stroke="#cc3030" strokeWidth="1.2" />
            <line x1={tongueX} y1={tongueY}
              x2={tongueX + hux * 3 + hpx * 3} y2={tongueY + huy * 3 + hpy * 3}
              stroke="#cc3030" strokeWidth="0.8" />
            <line x1={tongueX} y1={tongueY}
              x2={tongueX + hux * 3 - hpx * 3} y2={tongueY + huy * 3 - hpy * 3}
              stroke="#cc3030" strokeWidth="0.8" />
          </g>
        );
      })()}

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
            r={3.5}
            fill="#3a3420"
            stroke="#6a5a3a"
            strokeWidth="0.8"
            opacity="0.85"
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
            r={3}
            fill="#302820"
            stroke="#5a4a3a"
            strokeWidth="0.7"
            opacity="0.7"
          />
        );
      })}

      {/* Pieces */}
      {pieces.map((playerPieces, pIdx) =>
        playerPieces.map((pos, pieceIdx) => {
          if (pos === 0 || pos === TOTAL_SPACES) return null; // not on board or finished
          const { x, y } = mehenPositionToSVG(pos);
          const offset = pIdx === 0 ? -3 : 3;
          return (
            <circle
              key={`piece-${pIdx}-${pieceIdx}`}
              className="board-piece"
              cx={x + offset}
              cy={y}
              r={4.5}
              fill={pIdx === 0 ? 'url(#mehen-piece-gold)' : 'url(#mehen-piece-steel)'}
              stroke={pIdx === 0 ? '#a88832' : '#5a6f94'}
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
            r={6}
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
      gamePhase={gamePhase}
      winner={winner !== null ? playerNames[winner] : null}
      currentPlayer={currentPlayer}
      playerNames={playerNames}
      turnCount={turnCount}
      onRoll={gamePhase === 'roll' && winner === null && isPlayerTurn ? handleRoll : null}
      diceDisplay={diceValue ? <D6Display value={diceValue} /> : null}
      message={isOnline && !isMyTurn && !winner ? "Waiting for opponent's move..." : message}
      playerStatus={renderPieceStatus()}
      moveLog={moveLog}
      rules={GAME_BOOK['mehen'].rules}
      secrets={GAME_BOOK['mehen'].secrets}
      onForfeit={isOnline ? onForfeit : undefined}
      onPlayerClick={isOnline ? onPlayerClick : undefined}
      isOnline={isOnline}
      isMyTurn={isMyTurn}
      chatPanel={isOnline ? <MultiplayerChat messages={chatMessages || []} onSend={sendChat} myUid={matchData?.players?.[myPlayerIndex]?.uid} /> : null}
    >
      {renderBoard()}
    </GameShell>
  );
}

export default MehenGame;
