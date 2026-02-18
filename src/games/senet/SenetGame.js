import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameShell from '../shared/GameShell';
import GAME_BOOK from '../shared/gameBookData';
import { StickDiceDisplay } from '../shared/DiceDisplay';
import { rollStickDice } from '../shared/diceEngine';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import { SPECIAL_SQUARES, pathToGrid, pathToSVG } from './senetData';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CELL_W = 50;
const CELL_H = 55;
const PADDING = 5;
const BOARD_W = CELL_W * 10 + PADDING * 2;
const BOARD_H = CELL_H * 3 + PADDING * 2;
const BORNE_OFF = 31; // sentinel position for pieces that left the board

const PLAYER_COLORS = ['#c9a961', '#8b9dc3']; // gold, steel
const PLAYER_LABELS = ['Gold', 'Steel'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Is `pos` occupied by any piece of `playerIdx`? */
function ownPieceAt(pieces, playerIdx, pos) {
  return pieces[playerIdx].includes(pos);
}

/** Is `pos` occupied by the opponent of `playerIdx`? */
function opponentPieceAt(pieces, playerIdx, pos) {
  const opp = 1 - playerIdx;
  return pieces[opp].includes(pos);
}

/** A piece at `pos` belonging to `owner` is protected if an adjacent
 *  path-neighbour also belongs to `owner`. */
function isProtected(pieces, owner, pos) {
  if (pos < 1 || pos > 30) return false;
  const adj = [pos - 1, pos + 1].filter(p => p >= 1 && p <= 30);
  return adj.some(p => pieces[owner].includes(p));
}

/** Find the nearest open square to target (searching backwards from target,
 *  then forwards), excluding positions held by either player. */
function nearestOpen(pieces, target) {
  // try target first
  const allOccupied = [...pieces[0], ...pieces[1]];
  if (!allOccupied.includes(target)) return target;
  // search outward
  for (let d = 1; d < 30; d++) {
    if (target - d >= 1 && !allOccupied.includes(target - d)) return target - d;
    if (target + d <= 30 && !allOccupied.includes(target + d)) return target + d;
  }
  return target; // fallback (should not happen)
}

/** Does rolling `roll` from `pos` produce a legal move?
 *  Returns null if illegal, otherwise { from, to, captures, capturedTo } */
function getLegalMove(pieces, playerIdx, pos, roll) {
  // already borne off
  if (pos === BORNE_OFF) return null;

  const dest = pos + roll;

  // --- Bearing off logic ---
  // pos 30: any roll bears off
  if (pos === 30) {
    return { from: pos, to: BORNE_OFF, captures: false, capturedTo: null };
  }
  // pos 29: needs exactly 2
  if (pos === 29) {
    if (roll === 2) return { from: pos, to: BORNE_OFF, captures: false, capturedTo: null };
    // can't move otherwise (stuck on House of Re-Atoum)
    return null;
  }
  // pos 28: needs exactly 3
  if (pos === 28) {
    if (roll === 3) return { from: pos, to: BORNE_OFF, captures: false, capturedTo: null };
    return null;
  }

  // Normal movement: dest > 30 means bearing off (if allowed)
  if (dest > 30) {
    // pieces not on 28/29/30 can bear off if dest >= 31 (they pass/land on 30)
    return { from: pos, to: BORNE_OFF, captures: false, capturedTo: null };
  }

  // Can't land on own piece
  if (ownPieceAt(pieces, playerIdx, dest)) return null;

  // Opponent piece at dest?
  const opp = 1 - playerIdx;
  if (opponentPieceAt(pieces, playerIdx, dest)) {
    // protected? can't capture
    if (isProtected(pieces, opp, dest)) return null;
    // capture: swap positions
    return { from: pos, to: dest, captures: true, capturedTo: pos };
  }

  // Landing on House of Water: piece sent to House of Rebirth (15) or nearest open
  // (this isn't illegal — the move is allowed, but the piece ends up at 15)
  // We still return dest=27 and handle relocation in applyMove.

  return { from: pos, to: dest, captures: false, capturedTo: null };
}

/** Generate all legal moves for `playerIdx` given `roll`. */
function generateMoves(pieces, playerIdx, roll) {
  const moves = [];
  const seen = new Set(); // avoid duplicate entries for same position
  for (const pos of pieces[playerIdx]) {
    if (pos === BORNE_OFF) continue;
    if (seen.has(pos)) continue;
    seen.add(pos);
    const move = getLegalMove(pieces, playerIdx, pos, roll);
    if (move) moves.push(move);
  }
  return moves;
}

/** Apply a move, returning new pieces array (immutable). */
function applyMove(pieces, playerIdx, move) {
  const newPieces = [pieces[0].slice(), pieces[1].slice()];
  const opp = 1 - playerIdx;

  // Update moving player's piece
  const idx = newPieces[playerIdx].indexOf(move.from);
  if (idx === -1) return newPieces; // safety

  let finalDest = move.to;

  // Handle House of Water: if landing on 27 (not bearing off), relocate to 15 or nearest open
  if (finalDest === 27) {
    // Remove the moving piece temporarily to find open squares
    newPieces[playerIdx][idx] = BORNE_OFF; // temp
    if (move.captures) {
      // also account for opponent piece being swapped out
      const oppIdx = newPieces[opp].indexOf(27);
      if (oppIdx !== -1) newPieces[opp][oppIdx] = move.capturedTo;
    }
    const rebirth = nearestOpen(newPieces, 15);
    newPieces[playerIdx][idx] = rebirth;
    return newPieces;
  }

  newPieces[playerIdx][idx] = finalDest;

  // Handle capture: swap opponent piece to the vacated square
  if (move.captures) {
    const oppIdx = newPieces[opp].indexOf(move.to);
    if (oppIdx !== -1) {
      let capturedDest = move.capturedTo;
      // If capturedTo is 27 (House of Water), relocate to rebirth
      if (capturedDest === 27) {
        capturedDest = nearestOpen(newPieces, 15);
      }
      newPieces[opp][oppIdx] = capturedDest;
    }
  }

  return newPieces;
}

/** Check win: all 5 pieces borne off */
function checkWin(pieces, playerIdx) {
  return pieces[playerIdx].every(p => p === BORNE_OFF);
}

/** Rolls of 1, 4, 5 grant an extra turn */
function grantsExtraTurn(roll) {
  return roll === 1 || roll === 4 || roll === 5;
}

/* ------------------------------------------------------------------ */
/*  AI evaluation                                                      */
/* ------------------------------------------------------------------ */
function evaluateMove(pieces, playerIdx, move) {
  let score = 0;
  const opp = 1 - playerIdx;

  // Bear off
  if (move.to === BORNE_OFF) {
    score += 20;
    return score;
  }

  // Capture opponent
  if (move.captures) score += 10;

  // Safe square (House of Beauty)
  if (move.to === 26) score += 5;

  // Progress bonus
  score += (move.to - move.from) * 3;

  // Penalty for landing on House of Water
  if (move.to === 27) score -= 15;

  // Penalty for being exposed (unprotected near enemy)
  const newPieces = applyMove(pieces, playerIdx, move);
  const actualDest = (move.to === 27)
    ? newPieces[playerIdx][pieces[playerIdx].indexOf(move.from)] // relocated
    : move.to;

  if (actualDest !== BORNE_OFF && actualDest >= 1 && actualDest <= 30) {
    if (!isProtected(newPieces, playerIdx, actualDest)) {
      // check if any enemy piece is within 1-5 squares behind
      for (let d = 1; d <= 5; d++) {
        const threatPos = actualDest - d;
        if (threatPos >= 1 && newPieces[opp].includes(threatPos)) {
          score -= 8;
          break;
        }
      }
    }
  }

  return score;
}

/* ------------------------------------------------------------------ */
/*  SVG Board Component                                                */
/* ------------------------------------------------------------------ */
function SenetBoard({
  pieces,
  currentPlayer,
  legalMoves,
  onCellClick,
  selectedPiece,
  gamePhase,
  labels: boardLabels,
}) {
  const borneOff = [
    pieces[0].filter(p => p === BORNE_OFF).length,
    pieces[1].filter(p => p === BORNE_OFF).length,
  ];

  // Build set of legal-move destinations for selected piece
  const targetSet = new Set();
  if (selectedPiece != null && legalMoves) {
    legalMoves
      .filter(m => m.from === selectedPiece)
      .forEach(m => targetSet.add(m.to === BORNE_OFF ? 'off' : m.to));
  }

  // Build set of positions that have legal moves
  const movableSet = new Set();
  if (legalMoves) {
    legalMoves.forEach(m => movableSet.add(m.from));
  }

  // Direction arrows for each row
  const arrows = [
    { row: 0, label: '\u2192', x: PADDING + CELL_W * 10 - 12, y: PADDING + 12 },
    { row: 1, label: '\u2190', x: PADDING + 4, y: PADDING + CELL_H + 12 },
    { row: 2, label: '\u2192', x: PADDING + CELL_W * 10 - 12, y: PADDING + CELL_H * 2 + 12 },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${BOARD_W} ${BOARD_H + 40}`}
        width={BOARD_W}
        height={BOARD_H + 40}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
      >
        {/* Board cells */}
        {Array.from({ length: 30 }, (_, i) => {
          const pos = i + 1;
          const grid = pathToGrid(pos);
          const x = PADDING + grid.col * CELL_W;
          const y = PADDING + grid.row * CELL_H;
          const isSpecial = !!SPECIAL_SQUARES[pos];
          const isLight = (grid.row + grid.col) % 2 === 0;
          const isTarget = targetSet.has(pos);

          let fill = isLight ? '#f5e6c8' : '#e8d5a3';
          if (isSpecial) fill = '#d4c5a0';
          if (isTarget) fill = '#a8d8a8';

          const className = [
            'board-cell',
            isLight ? 'board-cell-light' : 'board-cell-dark',
            isSpecial ? 'board-cell-special' : '',
          ].filter(Boolean).join(' ');

          return (
            <g key={pos} onClick={() => onCellClick && onCellClick(pos)} style={{ cursor: 'pointer' }}>
              <rect
                className={className}
                x={x}
                y={y}
                width={CELL_W}
                height={CELL_H}
                fill={fill}
                stroke="#8b7355"
                strokeWidth={1}
                rx={2}
              />
              {/* Position number */}
              <text
                x={x + 4}
                y={y + 12}
                fontSize="9"
                fill="#8b7355"
                opacity={0.6}
              >
                {pos}
              </text>
              {/* Special square symbol */}
              {isSpecial && (
                <text
                  className="senet-special-mark"
                  x={x + CELL_W / 2}
                  y={y + CELL_H - 8}
                  fontSize="14"
                  textAnchor="middle"
                  fill="#6b5b3e"
                  opacity={0.7}
                >
                  {SPECIAL_SQUARES[pos].symbol}
                </text>
              )}
              {/* Legal move target highlight */}
              {isTarget && (
                <circle
                  className="board-move-target"
                  cx={x + CELL_W / 2}
                  cy={y + CELL_H / 2}
                  r={8}
                  fill="none"
                  stroke="#4a4"
                  strokeWidth={2}
                  strokeDasharray="3,2"
                />
              )}
            </g>
          );
        })}

        {/* Direction arrows */}
        {arrows.map((a, i) => (
          <text
            key={i}
            x={a.x}
            y={a.y}
            fontSize="10"
            fill="#8b7355"
            opacity={0.35}
          >
            {a.label}
          </text>
        ))}

        {/* Pieces on board */}
        {[0, 1].map(pIdx =>
          pieces[pIdx].map((pos, pieceIdx) => {
            if (pos === BORNE_OFF || pos < 1 || pos > 30) return null;
            const center = pathToSVG(pos, CELL_W, CELL_H, PADDING);
            if (!center) return null;
            const isMovable =
              gamePhase === 'moving' && pIdx === currentPlayer && movableSet.has(pos);
            const isSelected = selectedPiece === pos && pIdx === currentPlayer;

            return (
              <g
                key={`${pIdx}-${pieceIdx}`}
                onClick={() => isMovable && onCellClick && onCellClick(pos)}
                style={{ cursor: isMovable ? 'pointer' : 'default' }}
              >
                <circle
                  className="board-piece"
                  cx={center.x}
                  cy={center.y}
                  r={14}
                  fill={PLAYER_COLORS[pIdx]}
                  stroke={isSelected ? '#fff' : '#555'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  opacity={0.92}
                />
                {isMovable && (
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={17}
                    fill="none"
                    stroke={isSelected ? '#fff' : '#c4713a'}
                    strokeWidth={2}
                    opacity={0.9}
                  >
                    <animate attributeName="r" values="16;19;16" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Piece label */}
                <text
                  x={center.x}
                  y={center.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={pIdx === 0 ? '#4a3b1f' : '#2a3550'}
                  pointerEvents="none"
                >
                  {pIdx === 0 ? 'G' : 'S'}
                </text>
              </g>
            );
          })
        )}

        {/* Bear-off target (if selected piece can bear off) */}
        {targetSet.has('off') && (
          <g onClick={() => onCellClick && onCellClick(BORNE_OFF)} style={{ cursor: 'pointer' }}>
            <rect
              x={PADDING + CELL_W * 10 + 5}
              y={PADDING + CELL_H}
              width={CELL_W - 10}
              height={CELL_H}
              fill="#a8d8a8"
              stroke="#4a4"
              strokeWidth={2}
              strokeDasharray="3,2"
              rx={4}
            />
            <text
              x={PADDING + CELL_W * 10 + CELL_W / 2 - 5}
              y={PADDING + CELL_H + CELL_H / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fill="#4a4"
            >
              OFF
            </text>
          </g>
        )}

        {/* Borne-off counter */}
        <text x={PADDING} y={BOARD_H + 18} fontSize="12" fill={PLAYER_COLORS[0]}>
          {(boardLabels || PLAYER_LABELS)[0]} borne off: {borneOff[0]} / 5
        </text>
        <text x={PADDING + 260} y={BOARD_H + 18} fontSize="12" fill={PLAYER_COLORS[1]}>
          {(boardLabels || PLAYER_LABELS)[1]} borne off: {borneOff[1]} / 5
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Game Component                                                */
/* ------------------------------------------------------------------ */
export default function SenetGame({ mode, onExit }) {
  const initialPieces = () => [[1, 3, 5, 7, 9], [2, 4, 6, 8, 10]];

  const [pieces, setPieces] = useState(initialPieces);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceResult, setDiceResult] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling'); // rolling | moving | gameover
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState(mode === 'ai' ? 'You roll first.' : 'Gold rolls first.');
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveLog, setMoveLog] = useState([]);

  const aiTimerRef = useRef(null);

  // Clean up AI timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const labels = useMemo(() => mode === 'ai' ? ['You', 'Atlas'] : PLAYER_LABELS, [mode]);

  /* ---- Reset ---- */
  const resetGame = useCallback(() => {
    setPieces(initialPieces());
    setCurrentPlayer(0);
    setDiceResult(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage(`${labels[0]} rolls first.`);
    setSelectedPiece(null);
    setLegalMoves([]);
    setMoveLog([]);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, [labels]);

  /* ---- Switch turn ---- */
  const switchTurn = useCallback((pcs, roll) => {
    const next = grantsExtraTurn(roll) ? (p) => p : (p) => 1 - p;
    setCurrentPlayer(prev => {
      const nextPlayer = next(prev);
      const label = labels[nextPlayer];
      if (grantsExtraTurn(roll)) {
        setMessage(`${labels[prev]} rolled ${roll} — extra turn!`);
      } else {
        setMessage(`${label}'s turn to roll.`);
      }
      return nextPlayer;
    });
    setDiceResult(null);
    setGamePhase('rolling');
    setSelectedPiece(null);
    setLegalMoves([]);
    setTurnCount(t => t + 1);
  }, [labels]);

  /* ---- Roll dice ---- */
  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    const result = rollStickDice();
    const roll = result.total === 0 ? 5 : result.total;
    setDiceResult({ ...result, effectiveTotal: roll });

    // Generate legal moves
    const moves = generateMoves(pieces, currentPlayer, roll);
    if (moves.length === 0) {
      setMessage(
        `${labels[currentPlayer]} rolled ${roll} — no legal moves.`
      );
      setMoveLog(log => [...log, `${labels[currentPlayer]} rolled ${roll} — no legal moves`]);
      setGamePhase('moving'); // briefly show, then auto-switch
      setLegalMoves([]);
      // auto pass after a delay
      setTimeout(() => {
        switchTurn(pieces, roll);
      }, 800);
      return;
    }

    setLegalMoves(moves);
    setGamePhase('moving');
    setMessage(
      `${labels[currentPlayer]} rolled ${roll}. Pick a piece to move.`
    );
    setMoveLog(log => [...log, `${labels[currentPlayer]} rolled ${roll}`]);
  }, [gamePhase, pieces, currentPlayer, switchTurn, labels]);

  /* ---- Execute a move ---- */
  const executeMove = useCallback(
    (move) => {
      const roll = diceResult ? diceResult.effectiveTotal : 0;
      const newPieces = applyMove(pieces, currentPlayer, move);
      setPieces(newPieces);

      let msg = `${labels[currentPlayer]} moved from ${move.from}`;
      if (move.to === BORNE_OFF) {
        msg += ' — borne off!';
      } else if (move.captures) {
        msg += ` to ${move.to} (captured!)`;
      } else if (move.to === 27) {
        msg += ' — landed on House of Water! Sent to rebirth.';
      } else {
        msg += ` to ${move.to}.`;
      }
      setMessage(msg);
      setMoveLog(log => [...log, msg]);
      setSelectedPiece(null);
      setLegalMoves([]);

      // Check win
      if (checkWin(newPieces, currentPlayer)) {
        setGamePhase('gameover');
        setWinner(currentPlayer);
        setMessage(`${labels[currentPlayer]} wins!`);
        return;
      }

      // Schedule turn switch
      setTimeout(() => switchTurn(newPieces, roll), 400);
    },
    [pieces, currentPlayer, diceResult, switchTurn, labels]
  );

  /* ---- Board click handler (human) ---- */
  const handleCellClick = useCallback(
    (pos) => {
      if (gamePhase !== 'moving') return;
      if (mode === 'ai' && currentPlayer === 1) return; // AI's turn

      // If clicking a bear-off target
      if (pos === BORNE_OFF && selectedPiece != null) {
        const move = legalMoves.find(
          m => m.from === selectedPiece && m.to === BORNE_OFF
        );
        if (move) {
          executeMove(move);
          return;
        }
      }

      // If clicking on own piece that can move, execute immediately if only one
      // destination, otherwise select it to show destinations
      if (pieces[currentPlayer].includes(pos) && legalMoves.some(m => m.from === pos)) {
        const movesFromHere = legalMoves.filter(m => m.from === pos);
        if (movesFromHere.length === 1) {
          executeMove(movesFromHere[0]);
          return;
        }
        setSelectedPiece(pos);
        return;
      }

      // If a piece is selected and clicking a legal destination
      if (selectedPiece != null) {
        const move = legalMoves.find(
          m => m.from === selectedPiece && m.to === pos
        );
        if (move) {
          executeMove(move);
          return;
        }
      }

      // If only one move available for that position, execute directly
      if (legalMoves.length === 1) {
        executeMove(legalMoves[0]);
      }
    },
    [gamePhase, mode, currentPlayer, pieces, legalMoves, selectedPiece, executeMove]
  );

  /* ---- AI turn logic ---- */
  useEffect(() => {
    if (mode !== 'ai') return;
    if (currentPlayer !== 1) return;
    if (gamePhase === 'gameover') return;

    if (gamePhase === 'rolling') {
      // AI rolls after a delay
      aiTimerRef.current = setTimeout(() => {
        handleRoll();
      }, 700);
    }
  }, [mode, currentPlayer, gamePhase, handleRoll]);

  // AI makes move after rolling
  useEffect(() => {
    if (mode !== 'ai') return;
    if (currentPlayer !== 1) return;
    if (gamePhase !== 'moving') return;
    if (legalMoves.length === 0) return;

    aiTimerRef.current = setTimeout(() => {
      const best = chooseBestMove(legalMoves, (move) =>
        evaluateWithNoise(evaluateMove(pieces, currentPlayer, move))
      );
      if (best) {
        executeMove(best);
      }
    }, 500);
  }, [mode, currentPlayer, gamePhase, legalMoves, pieces, executeMove]);

  /* ---- Render ---- */
  const statusText = gamePhase === 'gameover'
    ? `Game over — ${labels[winner]} wins!`
    : `Turn ${turnCount + 1} — ${labels[currentPlayer]}'s turn`;

  const isHumanTurn =
    gamePhase !== 'gameover' &&
    (mode === 'local' || currentPlayer === 0);

  return (
    <GameShell gameName="Senet" onExit={onExit} onReset={resetGame} moveLog={moveLog} rules={GAME_BOOK['senet'].rules} secrets={GAME_BOOK['senet'].secrets}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {statusText}
        </div>
        <div style={{ fontSize: 13, color: '#666', minHeight: 20 }}>
          {message}
        </div>
      </div>

      <SenetBoard
        pieces={pieces}
        currentPlayer={currentPlayer}
        legalMoves={gamePhase === 'moving' ? legalMoves : []}
        onCellClick={handleCellClick}
        selectedPiece={selectedPiece}
        gamePhase={gamePhase}
        labels={labels}
      />

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {/* Dice area */}
        {diceResult && (
          <div style={{ marginBottom: 8 }}>
            <StickDiceDisplay result={diceResult} />
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Roll: <strong>{diceResult.effectiveTotal}</strong>
              {grantsExtraTurn(diceResult.effectiveTotal) && (
                <span style={{ color: '#b8860b', marginLeft: 6 }}>
                  (extra turn)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Roll button */}
        {gamePhase === 'rolling' && isHumanTurn && (
          <button
            onClick={handleRoll}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              cursor: 'pointer',
              backgroundColor: PLAYER_COLORS[currentPlayer],
              color: currentPlayer === 0 ? '#3a2a0a' : '#1a2540',
              border: '1px solid #888',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            Roll Sticks
          </button>
        )}

        {/* Game over */}
        {gamePhase === 'gameover' && (
          <button
            onClick={resetGame}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              cursor: 'pointer',
              backgroundColor: '#ddd',
              border: '1px solid #888',
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            Play Again
          </button>
        )}
      </div>

      {/* Special squares legend */}
      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          color: '#777',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px 14px',
        }}
      >
        {Object.entries(SPECIAL_SQUARES).map(([pos, sq]) => (
          <span key={pos}>
            <strong>{sq.symbol}</strong> {pos}: {sq.name}
          </span>
        ))}
      </div>
    </GameShell>
  );
}
