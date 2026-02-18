import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameShell from '../shared/GameShell';
import GAME_BOOK from '../shared/gameBookData';
import { TetrahedralDiceDisplay } from '../shared/DiceDisplay';
import { rollTetrahedralDice } from '../shared/diceEngine';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import {
  BOARD_CELLS,
  PLAYER_PATHS,
  ROSETTE_POSITIONS,
  cellToSVG,
  pathToSVG,
  isCellRosette,
} from './royalGameOfUrData';

const CELL_SIZE = 50;
const PADDING = 5;
const TOTAL_PIECES = 7;
const BEAR_OFF = 15;

const PLAYER_COLORS = ['#c9a961', '#8b9dc3']; // gold, steel
const PLAYER_STROKE = ['#a88832', '#5a6f94'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSharedZone(pathPos) {
  return pathPos >= 5 && pathPos <= 12;
}

function getLegalMoves(pieces, currentPlayer, roll) {
  if (roll === 0) return [];
  const myPieces = pieces[currentPlayer];
  const opponentPieces = pieces[1 - currentPlayer];
  const myPath = PLAYER_PATHS[currentPlayer];
  const opPath = PLAYER_PATHS[1 - currentPlayer];
  const moves = [];

  for (let i = 0; i < myPieces.length; i++) {
    const pos = myPieces[i];
    if (pos === BEAR_OFF) continue; // already borne off
    const newPos = pos + roll;
    if (newPos > BEAR_OFF) continue; // overshoot

    // Check: can't land on own piece (unless bearing off)
    if (newPos <= 14) {
      const targetCell = myPath[newPos - 1];
      // Check own pieces at target
      const ownAtTarget = myPieces.some(
        (p, j) => j !== i && p >= 1 && p <= 14 && myPath[p - 1].row === targetCell.row && myPath[p - 1].col === targetCell.col
      );
      if (ownAtTarget) continue;

      // Check opponent piece on rosette (can't capture on rosette)
      if (isSharedZone(newPos) && ROSETTE_POSITIONS.has(newPos)) {
        const opponentOnTarget = opponentPieces.some(
          (p) => p >= 1 && p <= 14 && opPath[p - 1].row === targetCell.row && opPath[p - 1].col === targetCell.col
        );
        if (opponentOnTarget) continue;
      }
    }

    moves.push({ pieceIdx: i, from: pos, to: newPos });
  }

  // Deduplicate: if multiple pieces are at the same position, only offer one move
  const seen = new Set();
  return moves.filter((m) => {
    const key = `${m.from}->${m.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyMove(pieces, currentPlayer, move) {
  const newPieces = pieces.map((arr) => [...arr]);
  // Find the actual piece index (first piece at the 'from' position)
  const actualIdx = newPieces[currentPlayer].findIndex((p) => p === move.from);
  newPieces[currentPlayer][actualIdx] = move.to;

  // Check for capture in shared zone
  if (move.to >= 1 && move.to <= 14 && isSharedZone(move.to)) {
    const myCell = PLAYER_PATHS[currentPlayer][move.to - 1];
    const opPath = PLAYER_PATHS[1 - currentPlayer];
    for (let j = 0; j < newPieces[1 - currentPlayer].length; j++) {
      const opPos = newPieces[1 - currentPlayer][j];
      if (opPos >= 1 && opPos <= 14) {
        const opCell = opPath[opPos - 1];
        if (opCell.row === myCell.row && opCell.col === myCell.col) {
          newPieces[1 - currentPlayer][j] = 0; // send back
          break;
        }
      }
    }
  }

  return newPieces;
}

function checkWinner(pieces) {
  for (let p = 0; p < 2; p++) {
    if (pieces[p].every((pos) => pos === BEAR_OFF)) return p;
  }
  return null;
}

// ── AI Evaluation ────────────────────────────────────────────────────────────

function evaluateMove(pieces, currentPlayer, move) {
  let score = 0;

  // Bear off bonus
  if (move.to === BEAR_OFF) {
    score += 20;
  }

  // Capture bonus
  if (move.to >= 1 && move.to <= 14 && isSharedZone(move.to)) {
    const myCell = PLAYER_PATHS[currentPlayer][move.to - 1];
    const opPath = PLAYER_PATHS[1 - currentPlayer];
    const captured = pieces[1 - currentPlayer].some((opPos) => {
      if (opPos < 1 || opPos > 14) return false;
      const opCell = opPath[opPos - 1];
      return opCell.row === myCell.row && opCell.col === myCell.col;
    });
    if (captured) score += 15;
  }

  // Rosette bonus (extra turn)
  if (move.to >= 1 && move.to <= 14 && ROSETTE_POSITIONS.has(move.to)) {
    score += 8;
  }

  // Progress bonus
  score += (move.to - move.from) * 3;

  // Vulnerability penalty: piece in shared zone and not on rosette
  if (move.to >= 1 && move.to <= 14 && isSharedZone(move.to) && !ROSETTE_POSITIONS.has(move.to)) {
    score -= 5;
  }

  return evaluateWithNoise(score);
}

// ── SVG Drawing Helpers ──────────────────────────────────────────────────────

function RosettePattern({ cx, cy, size }) {
  const r = size * 0.35;
  const petalR = size * 0.15;
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    petals.push(
      <circle
        key={i}
        cx={cx + Math.cos(angle) * r * 0.7}
        cy={cy + Math.sin(angle) * r * 0.7}
        r={petalR}
        fill="none"
        stroke="#c9a961"
        strokeWidth="1.5"
        opacity="0.7"
      />
    );
  }
  return (
    <g className="ur-rosette">
      {petals}
      <circle cx={cx} cy={cy} r={petalR * 0.8} fill="none" stroke="#c9a961" strokeWidth="1.5" opacity="0.7" />
    </g>
  );
}

function BoardCell({ row, col, cellSize, padding, isRosette, highlight, onClick }) {
  const x = padding + col * cellSize;
  const y = padding + row * cellSize;
  const center = cellToSVG(row, col, cellSize, padding);
  const isDark = (row + col) % 2 === 1;

  return (
    <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <rect
        x={x}
        y={y}
        width={cellSize}
        height={cellSize}
        className={`board-cell ${isDark ? 'board-cell-dark' : 'board-cell-light'}`}
        stroke="#4a3520"
        strokeWidth="1"
        fill={highlight ? 'rgba(100, 200, 100, 0.3)' : isDark ? '#5c4a2e' : '#d4b87a'}
      />
      {isRosette && <RosettePattern cx={center.x} cy={center.y} size={cellSize} />}
    </g>
  );
}

function Piece({ cx, cy, player, isMovable, onClick, isHighlight }) {
  const r = CELL_SIZE * 0.32;
  return (
    <g
      className="board-piece"
      onClick={onClick}
      style={isMovable ? { cursor: 'pointer' } : undefined}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={PLAYER_COLORS[player]}
        stroke={isHighlight ? '#00ff88' : PLAYER_STROKE[player]}
        strokeWidth={isHighlight ? 3 : 2}
        opacity={0.95}
      />
      {isMovable && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 3}
          fill="none"
          stroke="#00ff88"
          strokeWidth="2"
          opacity="0.8"
        >
          <animate attributeName="r" values={`${r + 2};${r + 5};${r + 2}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function MoveTarget({ cx, cy }) {
  return (
    <circle
      className="board-move-target"
      cx={cx}
      cy={cy}
      r={CELL_SIZE * 0.15}
      fill="#00ff88"
      opacity="0.5"
    >
      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1s" repeatCount="indefinite" />
    </circle>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function RoyalGameOfUrGame({ mode, onExit }) {
  const [pieces, setPieces] = useState([
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceResult, setDiceResult] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling'); // rolling | moving | gameover
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the dice to begin!');
  const [moveLog, setMoveLog] = useState([]);
  const aiTimeoutRef = useRef(null);
  const isAI = mode === 'ai';
  const playerNames = useMemo(() => isAI ? ['You', 'Atlas'] : ['Player 1', 'Player 2'], [isAI]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // ── Roll Dice ────────────────────────────────────────────────────────────

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    if (isAI && currentPlayer === 1) return; // AI rolls automatically

    const result = rollTetrahedralDice(4);
    const total = result.total;
    setDiceResult(result);

    if (total === 0) {
      setMessage(`${playerNames[currentPlayer]} rolled 0. Turn skipped!`);
      setMoveLog(log => [...log, `${playerNames[currentPlayer]} rolled 0 — turn skipped`]);
      setTurnCount((t) => t + 1);
      // Switch player after brief delay
      setTimeout(() => {
        setCurrentPlayer((p) => 1 - p);
        setDiceResult(null);
        setMessage(`${playerNames[1 - currentPlayer]}'s turn. Roll the dice!`);
      }, 1000);
    } else {
      const moves = getLegalMoves(pieces, currentPlayer, total);
      if (moves.length === 0) {
        setMessage(`${playerNames[currentPlayer]} rolled ${total} but has no legal moves!`);
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} rolled ${total} — no legal moves`]);
        setTurnCount((t) => t + 1);
        setTimeout(() => {
          setCurrentPlayer((p) => 1 - p);
          setDiceResult(null);
          setMessage(`${playerNames[1 - currentPlayer]}'s turn. Roll the dice!`);
        }, 1000);
      } else {
        setGamePhase('moving');
        setMessage(`${playerNames[currentPlayer]} rolled ${total}. Choose a piece to move.`);
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} rolled ${total}`]);
      }
    }
  }, [gamePhase, currentPlayer, pieces, isAI, playerNames]);

  // ── Execute Move ─────────────────────────────────────────────────────────

  const executeMove = useCallback(
    (move) => {
      const newPieces = applyMove(pieces, currentPlayer, move);
      setPieces(newPieces);
      
      // Check for capture messaging
      let captureMsg = '';
      if (move.to >= 1 && move.to <= 14 && isSharedZone(move.to)) {
        const myCell = PLAYER_PATHS[currentPlayer][move.to - 1];
        const opPath = PLAYER_PATHS[1 - currentPlayer];
        const captured = pieces[1 - currentPlayer].some((opPos) => {
          if (opPos < 1 || opPos > 14) return false;
          const opCell = opPath[opPos - 1];
          return opCell.row === myCell.row && opCell.col === myCell.col;
        });
        if (captured) captureMsg = ' Captured opponent piece!';
      }

      // Check for bear off
      let bearMsg = '';
      if (move.to === BEAR_OFF) {
        bearMsg = ' Piece borne off!';
      }

      // Log the move
      if (captureMsg) {
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} moved to position ${move.to}. Captured opponent!`]);
      } else if (move.to === BEAR_OFF) {
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} bore off a piece!`]);
      } else if (move.to >= 1 && move.to <= 14 && ROSETTE_POSITIONS.has(move.to)) {
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} landed on a rosette — extra turn!`]);
      } else {
        setMoveLog(log => [...log, `${playerNames[currentPlayer]} moved from ${move.from} to ${move.to}`]);
      }

      // Check win
      const w = checkWinner(newPieces);
      if (w !== null) {
        setWinner(w);
        setGamePhase('gameover');
        setMessage(`${playerNames[w]} wins!${captureMsg}${bearMsg}`);
        setTurnCount((t) => t + 1);
        return;
      }

      // Rosette = extra turn
      if (move.to >= 1 && move.to <= 14 && ROSETTE_POSITIONS.has(move.to)) {
        setMessage(
          `${playerNames[currentPlayer]} lands on a rosette! Extra turn.${captureMsg}${bearMsg}`
        );
        setGamePhase('rolling');
        setDiceResult(null);
        setTurnCount((t) => t + 1);
      } else {
        setTurnCount((t) => t + 1);
        const nextPlayer = 1 - currentPlayer;
        setCurrentPlayer(nextPlayer);
        setGamePhase('rolling');
        setDiceResult(null);
        setMessage(`${playerNames[nextPlayer]}'s turn. Roll the dice!${captureMsg}${bearMsg}`);
      }
    },
    [pieces, currentPlayer, playerNames]
  );

  // ── Handle Piece Click ───────────────────────────────────────────────────

  const handlePieceClick = useCallback(
    (pieceFrom) => {
      if (gamePhase !== 'moving') return;
      if (isAI && currentPlayer === 1) return;
      if (!diceResult) return;

      const moves = getLegalMoves(pieces, currentPlayer, diceResult.total);
      const move = moves.find((m) => m.from === pieceFrom);
      if (move) {
        executeMove(move);
      }
    },
    [gamePhase, currentPlayer, diceResult, pieces, isAI, executeMove]
  );

  // ── AI Turn ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAI || currentPlayer !== 1 || gamePhase === 'gameover') return;

    if (gamePhase === 'rolling') {
      aiTimeoutRef.current = setTimeout(() => {
        const result = rollTetrahedralDice(4);
        const total = result.total;
        // Only update diceResult and message here — these are NOT in the
        // useEffect deps, so they won't trigger cleanup of the inner timeout.
        setDiceResult(result);

        if (total === 0) {
          setMessage(`${playerNames[1]} rolled 0. Turn skipped!`);
          setMoveLog(log => [...log, `${playerNames[1]} rolled 0 — turn skipped`]);
          aiTimeoutRef.current = setTimeout(() => {
            setTurnCount((t) => t + 1);
            setCurrentPlayer(0);
            setDiceResult(null);
            setMessage(`${playerNames[0]}'s turn. Roll the dice!`);
          }, 800);
          return;
        }

        const moves = getLegalMoves(pieces, 1, total);
        if (moves.length === 0) {
          setMessage(`${playerNames[1]} rolled ${total} but has no legal moves!`);
          setMoveLog(log => [...log, `${playerNames[1]} rolled ${total} — no legal moves`]);
          aiTimeoutRef.current = setTimeout(() => {
            setTurnCount((t) => t + 1);
            setCurrentPlayer(0);
            setDiceResult(null);
            setMessage(`${playerNames[0]}'s turn. Roll the dice!`);
          }, 800);
          return;
        }

        // Don't set gamePhase here — changing deps would cancel the inner timeout
        setMessage(`${playerNames[1]} rolled ${total}. Thinking...`);
        setMoveLog(log => [...log, `${playerNames[1]} rolled ${total}`]);

        // AI picks a move
        aiTimeoutRef.current = setTimeout(() => {
          const bestMove = chooseBestMove(moves, (move) =>
            evaluateMove(pieces, 1, move)
          );
          if (bestMove) {
            const newPieces = applyMove(pieces, 1, bestMove);
            setPieces(newPieces);

            let captureMsg = '';
            if (bestMove.to >= 1 && bestMove.to <= 14 && isSharedZone(bestMove.to)) {
              const myCell = PLAYER_PATHS[1][bestMove.to - 1];
              const opPath = PLAYER_PATHS[0];
              const captured = pieces[0].some((opPos) => {
                if (opPos < 1 || opPos > 14) return false;
                const opCell = opPath[opPos - 1];
                return opCell.row === myCell.row && opCell.col === myCell.col;
              });
              if (captured) captureMsg = ' Captured your piece!';
            }

            let bearMsg = '';
            if (bestMove.to === BEAR_OFF) bearMsg = ' Piece borne off!';

            // Log the AI move
            if (captureMsg) {
              setMoveLog(log => [...log, `${playerNames[1]} moved to position ${bestMove.to}. Captured opponent!`]);
            } else if (bestMove.to === BEAR_OFF) {
              setMoveLog(log => [...log, `${playerNames[1]} bore off a piece!`]);
            } else if (bestMove.to >= 1 && bestMove.to <= 14 && ROSETTE_POSITIONS.has(bestMove.to)) {
              setMoveLog(log => [...log, `${playerNames[1]} landed on a rosette — extra turn!`]);
            } else {
              setMoveLog(log => [...log, `${playerNames[1]} moved from ${bestMove.from} to ${bestMove.to}`]);
            }

            const w = checkWinner(newPieces);
            if (w !== null) {
              setWinner(w);
              setGamePhase('gameover');
              setMessage(`${playerNames[w]} wins!${captureMsg}${bearMsg}`);
              setTurnCount((t) => t + 1);
              return;
            }

            if (bestMove.to >= 1 && bestMove.to <= 14 && ROSETTE_POSITIONS.has(bestMove.to)) {
              setMessage(`${playerNames[1]} lands on a rosette! Extra turn.${captureMsg}${bearMsg}`);
              setGamePhase('rolling');
              setDiceResult(null);
              setTurnCount((t) => t + 1);
            } else {
              setTurnCount((t) => t + 1);
              setCurrentPlayer(0);
              setGamePhase('rolling');
              setDiceResult(null);
              setMessage(`${playerNames[0]}'s turn. Roll the dice!${captureMsg}${bearMsg}`);
            }
          }
        }, 500);
      }, 700);
    }

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isAI, currentPlayer, gamePhase, pieces, playerNames, turnCount]);

  // ── Reset Game ───────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setPieces([
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ]);
    setCurrentPlayer(0);
    setDiceResult(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the dice to begin!');
    setMoveLog([]);
      }, []);

  // ── Compute Legal Moves for Display ──────────────────────────────────────

  const legalMoves =
    gamePhase === 'moving' && diceResult
      ? getLegalMoves(pieces, currentPlayer, diceResult.total)
      : [];

  const legalFromPositions = new Set(legalMoves.map((m) => m.from));

  // ── Compute Piece Counts ─────────────────────────────────────────────────

  const piecesOffBoard = [
    pieces[0].filter((p) => p === 0).length,
    pieces[1].filter((p) => p === 0).length,
  ];
  const piecesBorneOff = [
    pieces[0].filter((p) => p === BEAR_OFF).length,
    pieces[1].filter((p) => p === BEAR_OFF).length,
  ];

  // ── Collect pieces on each cell for rendering ────────────────────────────

  function getPiecesAtCell(row, col) {
    const result = [];
    for (let player = 0; player < 2; player++) {
      const path = PLAYER_PATHS[player];
      for (let i = 0; i < pieces[player].length; i++) {
        const pos = pieces[player][i];
        if (pos >= 1 && pos <= 14) {
          const cell = path[pos - 1];
          if (cell.row === row && cell.col === col) {
            result.push({ player, pieceIdx: i, pathPos: pos });
          }
        }
      }
    }
    return result;
  }

  // ── Highlight cells that are legal move targets ──────────────────────────

  function isHighlightCell(row, col) {
    if (gamePhase !== 'moving' || (isAI && currentPlayer === 1)) return false;
    for (const move of legalMoves) {
      if (move.to >= 1 && move.to <= 14) {
        const targetCell = PLAYER_PATHS[currentPlayer][move.to - 1];
        if (targetCell.row === row && targetCell.col === col) return true;
      }
    }
    return false;
  }

  // ── SVG Board ────────────────────────────────────────────────────────────

  const boardWidth = 8 * CELL_SIZE + 2 * PADDING;
  const boardHeight = 3 * CELL_SIZE + 2 * PADDING;
  const svgWidth = boardWidth + 120; // extra space for side panels
  const svgHeight = boardHeight + 20;

  const renderBoard = () => (
    <svg
      viewBox={`-60 -10 ${svgWidth} ${svgHeight}`}
      width="100%"
      style={{ maxWidth: '600px', display: 'block', margin: '0 auto' }}
    >
      {/* Board cells */}
      {BOARD_CELLS.map(({ row, col }) => (
        <BoardCell
          key={`cell-${row}-${col}`}
          row={row}
          col={col}
          cellSize={CELL_SIZE}
          padding={PADDING}
          isRosette={isCellRosette(row, col)}
          highlight={isHighlightCell(row, col)}
        />
      ))}

      {/* Off-board piece counts - left side (unplaced) */}
      {[0, 1].map((player) => {
        const yBase = player === 0 ? PADDING + CELL_SIZE * 0.5 : PADDING + CELL_SIZE * 2.5;
        return (
          <g key={`offboard-${player}`}>
            <text
              x={-10}
              y={yBase - 12}
              textAnchor="end"
              fontSize="10"
              fill="#999"
              className="board-number"
            >
              Wait
            </text>
            {Array.from({ length: piecesOffBoard[player] }).map((_, i) => (
              <circle
                key={`wait-${player}-${i}`}
                cx={-30 + (i % 4) * 14}
                cy={yBase + 4 + Math.floor(i / 4) * 14}
                r={5}
                fill={PLAYER_COLORS[player]}
                stroke={PLAYER_STROKE[player]}
                strokeWidth="1"
                opacity="0.7"
                style={
                  gamePhase === 'moving' &&
                  currentPlayer === player &&
                  !(isAI && player === 1) &&
                  legalFromPositions.has(0)
                    ? { cursor: 'pointer' }
                    : undefined
                }
                onClick={() => {
                  if (
                    gamePhase === 'moving' &&
                    currentPlayer === player &&
                    !(isAI && player === 1) &&
                    legalFromPositions.has(0)
                  ) {
                    handlePieceClick(0);
                  }
                }}
              />
            ))}
            {gamePhase === 'moving' &&
              currentPlayer === player &&
              !(isAI && player === 1) &&
              legalFromPositions.has(0) && (
                <circle
                  cx={-30}
                  cy={yBase + 4}
                  r={8}
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="1.5"
                  opacity="0.6"
                >
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
          </g>
        );
      })}

      {/* Borne off counts - right side */}
      {[0, 1].map((player) => {
        const yBase = player === 0 ? PADDING + CELL_SIZE * 0.5 : PADDING + CELL_SIZE * 2.5;
        return (
          <g key={`borne-${player}`}>
            <text
              x={boardWidth + 10}
              y={yBase - 12}
              textAnchor="start"
              fontSize="10"
              fill="#999"
              className="board-number"
            >
              Home
            </text>
            {Array.from({ length: piecesBorneOff[player] }).map((_, i) => (
              <circle
                key={`home-${player}-${i}`}
                cx={boardWidth + 15 + (i % 4) * 14}
                cy={yBase + 4 + Math.floor(i / 4) * 14}
                r={5}
                fill={PLAYER_COLORS[player]}
                stroke={PLAYER_STROKE[player]}
                strokeWidth="1"
                opacity="0.9"
              />
            ))}
          </g>
        );
      })}

      {/* Move targets (dots showing where pieces can go) */}
      {gamePhase === 'moving' &&
        !(isAI && currentPlayer === 1) &&
        legalMoves.map((move) => {
          if (move.to >= 1 && move.to <= 14) {
            const pos = pathToSVG(move.to, currentPlayer, CELL_SIZE, PADDING);
            if (pos) {
              // Only show target dot if no piece already rendered there from this player
              const targetCell = PLAYER_PATHS[currentPlayer][move.to - 1];
              const piecesHere = getPiecesAtCell(targetCell.row, targetCell.col);
              const hasOwnPiece = piecesHere.some((p) => p.player === currentPlayer);
              if (!hasOwnPiece) {
                return (
                  <MoveTarget
                    key={`target-${move.from}-${move.to}`}
                    cx={pos.x}
                    cy={pos.y}
                  />
                );
              }
            }
          }
          return null;
        })}

      {/* Pieces on board */}
      {BOARD_CELLS.map(({ row, col }) => {
        const piecesHere = getPiecesAtCell(row, col);
        if (piecesHere.length === 0) return null;
        const center = cellToSVG(row, col, CELL_SIZE, PADDING);
        return piecesHere.map((p, idx) => {
          const offsetX = piecesHere.length > 1 ? (idx - (piecesHere.length - 1) / 2) * 12 : 0;
          const isMovable =
            gamePhase === 'moving' &&
            p.player === currentPlayer &&
            !(isAI && currentPlayer === 1) &&
            legalFromPositions.has(p.pathPos);
          return (
            <Piece
              key={`piece-${p.player}-${p.pieceIdx}`}
              cx={center.x + offsetX}
              cy={center.y}
              player={p.player}
              isMovable={isMovable}
              isHighlight={isMovable}
              onClick={() => isMovable && handlePieceClick(p.pathPos)}
            />
          );
        });
      })}

      {/* Player labels */}
      {[0, 1].map((player) => {
        const yBase = player === 0 ? PADDING + CELL_SIZE * 0.5 : PADDING + CELL_SIZE * 2.5;
        const isActive = currentPlayer === player && gamePhase !== 'gameover';
        return (
          <text
            key={`label-${player}`}
            x={-55}
            y={yBase - 12}
            textAnchor="start"
            fontSize="11"
            fontWeight={isActive ? 'bold' : 'normal'}
            fill={isActive ? PLAYER_COLORS[player] : '#666'}
          >
            {playerNames[player]}
          </text>
        );
      })}
    </svg>
  );

  // ── Dice Display ─────────────────────────────────────────────────────────

  const diceDisplay = diceResult ? (
    <TetrahedralDiceDisplay result={diceResult} />
  ) : null;

  // ── Score Info ────────────────────────────────────────────────────────────

  const scoreInfo = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '8px 0' }}>
      {[0, 1].map((player) => (
        <div
          key={player}
          style={{
            textAlign: 'center',
            opacity: currentPlayer === player && gamePhase !== 'gameover' ? 1 : 0.6,
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: currentPlayer === player ? 'bold' : 'normal',
              color: PLAYER_COLORS[player],
            }}
          >
            {playerNames[player]}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {piecesBorneOff[player]}/{TOTAL_PIECES} home
          </div>
        </div>
      ))}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <GameShell
      gameName="Royal Game of Ur"
      onExit={onExit}
      onReset={handleReset}
      message={message}
      gamePhase={gamePhase}
      winner={winner !== null ? playerNames[winner] : null}
      currentPlayer={currentPlayer}
      playerNames={playerNames}
      diceDisplay={diceDisplay}
      onRoll={
        gamePhase === 'rolling' && !(isAI && currentPlayer === 1)
          ? handleRoll
          : undefined
      }
      turnCount={turnCount}
      moveLog={moveLog}
      rules={GAME_BOOK['royal-game-of-ur'].rules}
      secrets={GAME_BOOK['royal-game-of-ur'].secrets}
    >
      {scoreInfo}
      {renderBoard()}
    </GameShell>
  );
}
