import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameShell from '../shared/GameShell';
import { D6Display } from '../shared/DiceDisplay';
import { rollD6 } from '../shared/diceEngine';
import { TRACK_LENGTH, PIECES_PER_PLAYER, SHORTCUT_MAP, holeToSVG } from './jackalsAndHoundsData';

const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

function JackalsAndHoundsGame({ mode, onExit }) {
  const [pieces, setPieces] = useState([
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [gamePhase, setGamePhase] = useState('roll'); // roll, selectPiece, gameOver
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the die to begin!');
  const [moveLog, setMoveLog] = useState([]);
  const aiTimeoutRef = useRef(null);

  const isAI = mode === 'ai';
  const playerNames = useMemo(() => isAI ? ['You', 'Atlas'] : ['Player 1', 'Player 2'], [isAI]);

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

    // Check for shortcut
    if (newPos < TRACK_LENGTH && SHORTCUT_MAP[newPos] !== undefined) {
      const shortcutDest = SHORTCUT_MAP[newPos];
      setMessage(`${playerNames[player]} hit a shortcut! ${newPos} -> ${shortcutDest}`);
      newPieces[player][pieceIdx] = shortcutDest;
      setMoveLog(log => [...log, `${playerNames[player]} rolled ${diceValue}, hit shortcut ${newPos} → ${shortcutDest}`]);
    } else {
      setMoveLog(log => [...log, `${playerNames[player]} rolled ${diceValue}, moved piece to hole ${newPieces[player][pieceIdx]}`]);
    }

    setPieces(newPieces);

    // Check win
    if (newPieces[player].every(p => p === TRACK_LENGTH)) {
      setWinner(player);
      setGamePhase('gameOver');
      setMessage(`${playerNames[player]} wins!`);
      setMoveLog(log => [...log, `${playerNames[player]} wins!`]);
      return;
    }

    // Switch turns
    const nextPlayer = 1 - player;
    setCurrentPlayer(nextPlayer);
    setDiceValue(null);
    setGamePhase('roll');
    setTurnCount(tc => tc + 1);
    setMessage(`${playerNames[nextPlayer]}'s turn — roll the die!`);
  }, [pieces, currentPlayer, diceValue, playerNames]);

  // Handle roll
  const handleRoll = useCallback(() => {
    if (gamePhase !== 'roll' || winner !== null) return;
    const roll = rollD6();
    setDiceValue(roll);

    const validMoves = getValidMoves(pieces[currentPlayer], roll);
    if (validMoves.length === 0) {
      setMessage(`${playerNames[currentPlayer]} rolled ${roll} — no valid moves! Turn skipped.`);
      setMoveLog(log => [...log, `${playerNames[currentPlayer]} rolled ${roll} — no valid moves`]);
      const nextPlayer = 1 - currentPlayer;
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
  }, [gamePhase, winner, pieces, currentPlayer, getValidMoves, playerNames]);

  // Handle piece selection
  const handleSelectPiece = useCallback((pieceIdx) => {
    if (gamePhase !== 'selectPiece' || winner !== null) return;
    if (!canMovePiece(pieces[currentPlayer], pieceIdx, diceValue)) return;
    executeMove(pieceIdx);
  }, [gamePhase, winner, pieces, currentPlayer, diceValue, canMovePiece, executeMove]);

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

  const isPlayerTurn = !isAI || currentPlayer === 0;

  // Build shortcut lines data
  const shortcutLines = Object.entries(SHORTCUT_MAP).filter(
    ([from, to]) => Number(from) < Number(to) // draw each shortcut only once
  );

  const renderBoard = () => (
    <svg viewBox="0 0 300 500" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }}>
      {/* Background */}
      <rect x="0" y="0" width="300" height="500" fill="#2a1f14" rx="10" />

      {/* Decorative palm tree between columns */}
      <g opacity="0.35">
        {/* Trunk */}
        <rect x="145" y="80" width="10" height="350" fill="#6b4226" rx="3" />
        {/* Fronds */}
        <ellipse cx="150" cy="75" rx="40" ry="15" fill="#4a7a3a" transform="rotate(-15 150 75)" />
        <ellipse cx="150" cy="75" rx="40" ry="15" fill="#4a7a3a" transform="rotate(15 150 75)" />
        <ellipse cx="150" cy="70" rx="35" ry="12" fill="#5a8a4a" transform="rotate(-40 150 70)" />
        <ellipse cx="150" cy="70" rx="35" ry="12" fill="#5a8a4a" transform="rotate(40 150 70)" />
        <ellipse cx="150" cy="65" rx="30" ry="10" fill="#6a9a5a" />
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
              opacity="0.4"
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
                fill={isShortcut ? '#3a3a1a' : '#3a3a2a'}
                stroke={isShortcut ? '#d4a84b' : '#6a6a4a'}
                strokeWidth={isShortcut ? 1.5 : 1}
                opacity="0.8"
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
              fill={PLAYER_COLORS[pIdx]}
              stroke="#fff"
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
    <GameShell gameName="Jackals &amp; Hounds" onExit={onExit} onReset={handleReset} moveLog={moveLog}>
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
        <div style={{ color: '#d0c8a8', fontSize: 12, minHeight: 18 }}>{message}</div>
      </div>

      {renderBoard()}
      {renderPieceStatus()}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <D6Display value={diceValue} />
        {gamePhase === 'roll' && winner === null && isPlayerTurn && (
          <button
            onClick={handleRoll}
            style={{
              background: '#c9a961',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: 8,
              padding: '8px 24px',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Roll Die
          </button>
        )}
      </div>
    </GameShell>
  );
}

export default JackalsAndHoundsGame;
