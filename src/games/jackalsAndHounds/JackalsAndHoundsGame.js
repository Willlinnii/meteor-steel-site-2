import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameShell from '../shared/GameShell';
import MultiplayerChat from '../shared/MultiplayerChat';
import GAME_BOOK from '../shared/gameBookData';
import { D6Display } from '../shared/DiceDisplay';
import { rollD6 } from '../shared/diceEngine';
import { TRACK_LENGTH, PIECES_PER_PLAYER, SHORTCUT_MAP, holeToSVG } from './jackalsAndHoundsData';

const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

function JackalsAndHoundsGame({
  mode, onExit,
  // Online multiplayer props (optional)
  onlineState, myPlayerIndex, isMyTurn, onStateChange, matchData, playerNames: onlinePlayerNames,
  chatMessages, sendChat, onForfeit, onPlayerClick,
}) {
  const isOnline = mode === 'online';

  const [pieces, setPieces] = useState(
    isOnline ? (onlineState?.pieces || [[0,0,0,0,0],[0,0,0,0,0]]) : [[0,0,0,0,0],[0,0,0,0,0]]
  );
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
    setPieces(onlineState.pieces || [[0,0,0,0,0],[0,0,0,0,0]]);
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
    [isAI, isOnline, onlinePlayerNames]
  );

  // Cleanup AI timeouts on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // Check if a piece can be moved
  const canMovePiece = useCallback((playerPieces, pieceIdx, roll) => {
    const currentPos = playerPieces[pieceIdx];
    if (currentPos === TRACK_LENGTH) return false; // already finished
    const newPos = currentPos + roll;
    if (newPos > TRACK_LENGTH) return false; // need exact roll
    // Can't land on own piece (unless finishing)
    if (newPos < TRACK_LENGTH) {
      for (let i = 0; i < PIECES_PER_PLAYER; i++) {
        if (i !== pieceIdx && playerPieces[i] === newPos) return false;
      }
      // Also check after shortcut
      const afterShortcut = SHORTCUT_MAP[newPos] || newPos;
      if (afterShortcut !== newPos) {
        for (let i = 0; i < PIECES_PER_PLAYER; i++) {
          if (i !== pieceIdx && playerPieces[i] === afterShortcut) return false;
        }
      }
    }
    return true;
  }, []);

  // Get all valid moves
  const getValidMoves = useCallback((playerPieces, roll) => {
    const moves = [];
    for (let i = 0; i < PIECES_PER_PLAYER; i++) {
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
    let newPos = newPieces[player][pieceIdx] + diceValue;
    newPieces[player][pieceIdx] = newPos;

    let msg;
    let newLog;

    // Check for shortcut
    if (newPos < TRACK_LENGTH && SHORTCUT_MAP[newPos] !== undefined) {
      const shortcutDest = SHORTCUT_MAP[newPos];
      msg = `${playerNames[player]} hit a shortcut! ${newPos} -> ${shortcutDest}`;
      newPieces[player][pieceIdx] = shortcutDest;
      newLog = [...moveLog, `${playerNames[player]} rolled ${diceValue}, hit shortcut ${newPos} → ${shortcutDest}`];
    } else {
      msg = `${playerNames[player]} rolled ${diceValue}, moved piece to hole ${newPieces[player][pieceIdx]}`;
      newLog = [...moveLog, msg];
    }

    // Check win
    if (newPieces[player].every(p => p === TRACK_LENGTH)) {
      const winMsg = `${playerNames[player]} wins!`;
      const winLog = [...newLog, winMsg];

      if (isOnline && onStateChange) {
        onStateChange(
          { pieces: newPieces, diceValue, message: winMsg, moveLog: winLog },
          { currentPlayer: player, gamePhase: 'gameOver', winner: player, status: 'completed', completedAt: new Date() }
        );
        return;
      }

      setPieces(newPieces);
      setWinner(player);
      setGamePhase('gameOver');
      setMessage(winMsg);
      setMoveLog(winLog);
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
    setMessage(msg);
    setMoveLog(newLog);
    setCurrentPlayer(nextPlayer);
    setDiceValue(null);
    setGamePhase('roll');
    setTurnCount(tc => tc + 1);
    setMessage(turnMsg);
  }, [pieces, currentPlayer, diceValue, playerNames, isOnline, onStateChange, moveLog]);

  // Handle roll
  const handleRoll = useCallback(() => {
    if (gamePhase !== 'roll' || winner !== null) return;
    if (isOnline && !isMyTurn) return;
    const roll = rollD6();
    setDiceValue(roll);

    const validMoves = getValidMoves(pieces[currentPlayer], roll);
    if (validMoves.length === 0) {
      const msg = `${playerNames[currentPlayer]} rolled ${roll} — no valid moves! Turn skipped.`;
      const nextPlayer = 1 - currentPlayer;
      const newLog = [...moveLog, `${playerNames[currentPlayer]} rolled ${roll} — no valid moves`];

      if (isOnline && onStateChange) {
        const turnMsg = `${playerNames[nextPlayer]}'s turn — roll the die!`;
        onStateChange(
          { pieces, diceValue: roll, message: turnMsg, moveLog: newLog },
          { currentPlayer: nextPlayer, gamePhase: 'roll' }
        );
        return;
      }

      setMessage(msg);
      setMoveLog(newLog);
      setTimeout(() => {
        setCurrentPlayer(nextPlayer);
        setDiceValue(null);
        setGamePhase('roll');
        setTurnCount(tc => tc + 1);
        setMessage(`${playerNames[nextPlayer]}'s turn — roll the die!`);
      }, 800);
    } else {
      setGamePhase('selectPiece');
      setMessage(`${playerNames[currentPlayer]} rolled ${roll}. Select a piece to move.`);
    }
  }, [gamePhase, winner, pieces, currentPlayer, getValidMoves, playerNames, isOnline, isMyTurn, onStateChange, moveLog]);

  // Handle piece selection
  const handleSelectPiece = useCallback((pieceIdx) => {
    if (gamePhase !== 'selectPiece' || winner !== null) return;
    if (isOnline && !isMyTurn) return;
    if (!canMovePiece(pieces[currentPlayer], pieceIdx, diceValue)) return;
    executeMove(pieceIdx);
  }, [gamePhase, winner, pieces, currentPlayer, diceValue, canMovePiece, executeMove, isOnline, isMyTurn]);

  // AI turn: roll + select + move in one self-contained sequence
  useEffect(() => {
    if (!isAI || currentPlayer !== 1 || winner !== null || gamePhase !== 'roll') return;

    const rollTimer = setTimeout(() => {
      const roll = rollD6();
      setDiceValue(roll);

      const aiPieces = pieces[1];
      const moves = getValidMoves(aiPieces, roll);

      if (moves.length === 0) {
        setMessage(`${playerNames[1]} rolled ${roll} — no valid moves! Turn skipped.`);
        aiTimeoutRef.current = setTimeout(() => {
          setCurrentPlayer(0);
          setDiceValue(null);
          setGamePhase('roll');
          setTurnCount(tc => tc + 1);
          setMessage(`${playerNames[0]}'s turn — roll the die!`);
        }, 800);
        return;
      }

      setMessage(`${playerNames[1]} rolled ${roll}. Choosing...`);

      // Pick the piece that is furthest behind (catch-up strategy)
      let bestIdx = moves[0];
      let minPos = aiPieces[moves[0]];
      for (const idx of moves) {
        if (aiPieces[idx] < minPos) {
          minPos = aiPieces[idx];
          bestIdx = idx;
        }
      }

      aiTimeoutRef.current = setTimeout(() => {
        // Execute move inline to avoid stale-closure issues
        const newPieces = [pieces[0].slice(), pieces[1].slice()];
        let newPos = newPieces[1][bestIdx] + roll;
        newPieces[1][bestIdx] = newPos;

        if (newPos < TRACK_LENGTH && SHORTCUT_MAP[newPos] !== undefined) {
          const dest = SHORTCUT_MAP[newPos];
          setMessage(`${playerNames[1]} hit a shortcut! ${newPos} → ${dest}`);
          newPieces[1][bestIdx] = dest;
        }

        setPieces(newPieces);

        if (newPieces[1].every(p => p === TRACK_LENGTH)) {
          setWinner(1);
          setGamePhase('gameOver');
          setMessage(`${playerNames[1]} wins!`);
          return;
        }

        setCurrentPlayer(0);
        setDiceValue(null);
        setGamePhase('roll');
        setTurnCount(tc => tc + 1);
        setMessage(`${playerNames[0]}'s turn — roll the die!`);
      }, 500);
    }, 700);

    return () => {
      clearTimeout(rollTimer);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isAI, currentPlayer, winner, gamePhase, pieces, getValidMoves, playerNames]);

  // Reset game
  const handleReset = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setPieces([[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setGamePhase('roll');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the die to begin!');
    setMoveLog([]);
  }, []);

  // Determine valid moves for current selection phase
  const validMoves = gamePhase === 'selectPiece'
    ? getValidMoves(pieces[currentPlayer], diceValue)
    : [];

  const isPlayerTurn = isOnline ? isMyTurn : (!isAI || currentPlayer === 0);

  // Build shortcut lines data
  const shortcutLines = Object.entries(SHORTCUT_MAP).filter(
    ([from, to]) => Number(from) < Number(to) // draw each shortcut only once
  );

  const renderBoard = () => (
    <svg className="game-board-svg" viewBox="0 0 300 500">
      <defs>
        <linearGradient id="jh-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a2f1e" />
          <stop offset="50%" stopColor="#2a1f14" />
          <stop offset="100%" stopColor="#1a1510" />
        </linearGradient>
        <radialGradient id="jh-hole-depth" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#5a4a30" />
          <stop offset="100%" stopColor="#3a2a18" />
        </radialGradient>
        <radialGradient id="jh-piece-gold" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#e8c878" />
          <stop offset="100%" stopColor="#a88832" />
        </radialGradient>
        <radialGradient id="jh-piece-steel" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a8b8d8" />
          <stop offset="100%" stopColor="#5a6f94" />
        </radialGradient>
        <filter id="jh-shortcut-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="300" height="500" fill="url(#jh-bg)" rx="10" />

      {/* Decorative palm tree between columns */}
      <g opacity="0.5" style={{ pointerEvents: 'none' }}>
        {/* Trunk — slight S-curve with taper */}
        <path
          d="M 148 430 Q 144 320 150 220 Q 154 140 150 80"
          fill="none" stroke="#8b5e3c" strokeWidth="11" strokeLinecap="round"
        />
        <path
          d="M 148 430 Q 144 320 150 220 Q 154 140 150 80"
          fill="none" stroke="#6b4226" strokeWidth="8" strokeLinecap="round"
        />
        {/* Bark texture lines */}
        {[110, 140, 170, 200, 235, 270, 305, 340, 370, 400].map((y, i) => {
          const xOff = (i % 2 === 0 ? -1 : 1) * 0.5;
          return (
            <line key={`bark-${i}`}
              x1={144 + xOff} y1={y} x2={156 + xOff} y2={y + 2}
              stroke="#5a3018" strokeWidth="0.8" opacity="0.5"
            />
          );
        })}
        {/* Fronds — individual leaf shapes with midrib */}
        {[
          { angle: -70, len: 52, curve: -20 },
          { angle: -35, len: 55, curve: -15 },
          { angle: -10, len: 48, curve: 8 },
          { angle: 15, len: 54, curve: 12 },
          { angle: 40, len: 50, curve: 18 },
          { angle: 70, len: 48, curve: 22 },
          { angle: -55, len: 42, curve: -25 },
          { angle: 55, len: 44, curve: 20 },
        ].map(({ angle, len, curve }, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 150;
          const cy = 78;
          const tipX = cx + Math.cos(rad) * len;
          const tipY = cy + Math.sin(rad) * len;
          const cpX = cx + Math.cos(rad) * len * 0.5 + curve;
          const cpY = cy + Math.sin(rad) * len * 0.5 - 8;
          const green = i < 4 ? '#4a8a3a' : i < 6 ? '#5a9a4a' : '#3a7a2a';
          return (
            <g key={`frond-${i}`}>
              {/* Leaf outline */}
              <path
                d={`M ${cx} ${cy} Q ${cpX - 4} ${cpY - 3} ${tipX} ${tipY} Q ${cpX + 4} ${cpY + 3} ${cx} ${cy}`}
                fill={green} opacity="0.7" stroke="#2a5a1a" strokeWidth="0.5"
              />
              {/* Midrib */}
              <path
                d={`M ${cx} ${cy} Q ${cpX} ${cpY} ${tipX} ${tipY}`}
                fill="none" stroke="#2a5a1a" strokeWidth="0.7" opacity="0.6"
              />
            </g>
          );
        })}
        {/* Coconuts */}
        <circle cx={146} cy={83} r={3} fill="#8b6914" stroke="#5a4410" strokeWidth="0.5" />
        <circle cx={154} cy={85} r={2.8} fill="#7a5c12" stroke="#5a4410" strokeWidth="0.5" />
        <circle cx={150} cy={87} r={2.5} fill="#9a7a20" stroke="#5a4410" strokeWidth="0.5" />
      </g>

      {/* Shortcut connections */}
      {shortcutLines.map(([from, to]) => {
        // Draw shortcut lines for both players
        const fromNum = Number(from);
        const toNum = Number(to);
        return [0, 1].map(player => {
          const p1 = holeToSVG(fromNum, player);
          const p2 = holeToSVG(toNum, player);
          return (
            <line
              key={`shortcut-${from}-${to}-p${player}`}
              className="jh-shortcut"
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#d4a84b"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.5"
              filter="url(#jh-shortcut-glow)"
            />
          );
        });
      })}

      {/* Cross-column shortcut indicators (horizontal lines between columns) */}
      {shortcutLines.map(([from]) => {
        const fromNum = Number(from);
        const left = holeToSVG(fromNum, 0);
        const right = holeToSVG(fromNum, 1);
        return (
          <line
            key={`cross-${from}`}
            x1={left.x + 8}
            y1={left.y}
            x2={right.x - 8}
            y2={right.y}
            stroke="#d4a84b"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.25"
          />
        );
      })}

      {/* Track labels */}
      <text x={85} y={25} textAnchor="middle" fontSize="11" fill={PLAYER_COLORS[0]} fontWeight="bold">
        {playerNames[0]}
      </text>
      <text x={215} y={25} textAnchor="middle" fontSize="11" fill={PLAYER_COLORS[1]} fontWeight="bold">
        {playerNames[1]}
      </text>

      {/* Holes for both players */}
      {[0, 1].map(player =>
        Array.from({ length: TRACK_LENGTH }, (_, i) => {
          const hole = i + 1;
          const { x, y } = holeToSVG(hole, player);
          const isShortcut = SHORTCUT_MAP[hole] !== undefined;
          return (
            <g key={`hole-${player}-${hole}`}>
              <circle
                className="jh-hole"
                cx={x}
                cy={y}
                r={isShortcut ? 7 : 5}
                fill={isShortcut ? '#3a3018' : 'url(#jh-hole-depth)'}
                stroke={isShortcut ? '#d4a84b' : '#6a5a3a'}
                strokeWidth={isShortcut ? 1.5 : 1}
                opacity="0.9"
              />
              {hole === 1 && (
                <text x={x} y={y + 18} textAnchor="middle" fontSize="8" fill="#888">1</text>
              )}
              {hole === TRACK_LENGTH && (
                <text x={x} y={y - 10} textAnchor="middle" fontSize="8" fill="#aaa">29</text>
              )}
              {isShortcut && (
                <text x={x + (player === 0 ? -12 : 12)} y={y + 3} textAnchor="middle" fontSize="7" fill="#d4a84b">
                  {hole}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Pieces on the board */}
      {pieces.map((playerPieces, pIdx) =>
        playerPieces.map((pos, pieceIdx) => {
          if (pos === 0 || pos === TRACK_LENGTH) return null;
          const { x, y } = holeToSVG(pos, pIdx);
          // Offset slightly if multiple pieces on same hole (shouldn't happen, but safety)
          const offset = pieceIdx * 2 - 4;
          return (
            <circle
              key={`piece-${pIdx}-${pieceIdx}`}
              className="board-piece"
              cx={x + offset}
              cy={y}
              r={5}
              fill={pIdx === 0 ? 'url(#jh-piece-gold)' : 'url(#jh-piece-steel)'}
              stroke={pIdx === 0 ? '#a88832' : '#5a6f94'}
              strokeWidth="1.5"
              style={{
                cursor: (gamePhase === 'selectPiece' && pIdx === currentPlayer && validMoves.includes(pieceIdx) && isPlayerTurn)
                  ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (pIdx === currentPlayer && isPlayerTurn) {
                  handleSelectPiece(pieceIdx);
                }
              }}
            />
          );
        })
      )}

      {/* Move targets */}
      {gamePhase === 'selectPiece' && isPlayerTurn && validMoves.map(pieceIdx => {
        const currentPos = pieces[currentPlayer][pieceIdx];
        let targetPos = currentPos + diceValue;
        if (targetPos > TRACK_LENGTH || targetPos <= 0) return null;
        // Show shortcut destination if applicable
        if (targetPos < TRACK_LENGTH && SHORTCUT_MAP[targetPos] !== undefined) {
          targetPos = SHORTCUT_MAP[targetPos];
        }
        const { x, y } = holeToSVG(targetPos, currentPlayer);
        return (
          <circle
            key={`target-${pieceIdx}`}
            className="board-move-target"
            cx={x}
            cy={y}
            r={9}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray="3 2"
            opacity="0.8"
          />
        );
      })}

      {/* Finish markers */}
      {[0, 1].map(player => {
        const { x, y } = holeToSVG(TRACK_LENGTH, player);
        return (
          <text key={`finish-${player}`} x={x} y={y - 18} textAnchor="middle" fontSize="10" fill="#ffd700">
            &#9734;
          </text>
        );
      })}
    </svg>
  );

  // Piece status display
  const renderPieceStatus = () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
      {[0, 1].map(pIdx => (
        <div key={pIdx} style={{ textAlign: 'center' }}>
          <div style={{ color: PLAYER_COLORS[pIdx], fontWeight: 'bold', marginBottom: 4, fontSize: 13 }}>
            {playerNames[pIdx]}
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {pieces[pIdx].map((pos, i) => {
              const isSelectable = gamePhase === 'selectPiece' && pIdx === currentPlayer && validMoves.includes(i) && isPlayerTurn;
              const label = pos === 0 ? 'Start' : pos === TRACK_LENGTH ? 'Done' : `H${pos}`;
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
                    padding: '2px 6px',
                    fontSize: 10,
                    cursor: isSelectable ? 'pointer' : 'default',
                    minWidth: 40,
                  }}
                >
                  {label}
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
      gameName="Jackals &amp; Hounds"
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
      rules={GAME_BOOK['jackals-and-hounds'].rules}
      secrets={GAME_BOOK['jackals-and-hounds'].secrets}
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

export default JackalsAndHoundsGame;
