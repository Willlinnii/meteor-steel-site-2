import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
import { CowrieDiceDisplay } from '../shared/DiceDisplay';
import { rollCowrieShells } from '../shared/diceEngine';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import {
  CELL, CASTLES, CIRCUIT_LENGTH, HOME_STRETCH,
  getAllBoardCells, getPlayerPath, gridToSVG, piecePositionToSVG,
} from './pachisiData';

const BOARD_PX = 19 * CELL + 20;
const PIECES_PER_PLAYER = 4;
const FINISH = CIRCUIT_LENGTH + HOME_STRETCH; // = 75

const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

function initPieces() {
  return [
    Array(PIECES_PER_PLAYER).fill(-1), // -1 = not on board
    Array(PIECES_PER_PLAYER).fill(-1),
  ];
}

export default function PachisiGame({ mode, onExit }) {
  const [pieces, setPieces] = useState(initPieces);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceResult, setDiceResult] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling');
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the cowrie shells!');
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveLog, setMoveLog] = useState([]);
  const aiTimer = useRef(null);
  const isAI = mode === 'ai';

  const resetGame = useCallback(() => {
    setPieces(initPieces());
    setCurrentPlayer(0);
    setDiceResult(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the cowrie shells!');
    setLegalMoves([]);
    setMoveLog([]);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const getLegalMoves = useCallback((player, roll, currentPieces) => {
    const myPieces = currentPieces[player];
    const oppPieces = currentPieces[1 - player];
    const moves = [];

    // Get opponent positions on the shared circuit for collision checking
    const oppPath = getPlayerPath(1 - player);
    const myPath = getPlayerPath(player);

    for (let i = 0; i < myPieces.length; i++) {
      const pos = myPieces[i];

      // Enter board: need a grace throw (1, 6, or 25)
      if (pos === -1) {
        if (roll === 1 || roll === 6 || roll === 25) {
          // Check if entry square (pos 0) is free of own pieces
          const entryOccupied = myPieces.some((p, j) => j !== i && p === 0);
          if (!entryOccupied) {
            moves.push({ pieceIdx: i, from: -1, to: 0, type: 'enter' });
          }
        }
        continue;
      }

      // Already finished
      if (pos >= FINISH) continue;

      const dest = pos + roll;

      // Overshoot
      if (dest > FINISH) continue;

      // Exact finish
      if (dest === FINISH) {
        moves.push({ pieceIdx: i, from: pos, to: FINISH, type: 'finish' });
        continue;
      }

      // Can't land on own piece
      const ownOccupied = myPieces.some((p, j) => j !== i && p === dest);
      if (ownOccupied) continue;

      // Check if landing on opponent (only in shared circuit, not home stretch)
      let capture = false;
      if (dest < CIRCUIT_LENGTH) {
        const destGrid = myPath[dest];
        const isCastle = CASTLES.has(dest);

        // Check if opponent is on this grid position
        for (let oi = 0; oi < oppPieces.length; oi++) {
          const op = oppPieces[oi];
          if (op >= 0 && op < CIRCUIT_LENGTH) {
            const oppGrid = oppPath[op];
            if (oppGrid && destGrid && oppGrid.row === destGrid.row && oppGrid.col === destGrid.col) {
              if (isCastle) {
                // Can't land on opponent on castle
                capture = false;
                break;
              }
              capture = true;
            }
          }
        }
      }

      moves.push({ pieceIdx: i, from: pos, to: dest, type: capture ? 'capture' : 'move' });
    }

    return moves;
  }, []);

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return;
    const result = rollCowrieShells();
    setDiceResult(result);

    const moves = getLegalMoves(currentPlayer, result.total, pieces);
    if (moves.length === 0) {
      setMessage(`Rolled ${result.total} — no legal moves!`);
      setMoveLog(log => [...log, `${isAI ? (currentPlayer === 0 ? 'You' : 'Atlas') : 'Player ' + (currentPlayer + 1)} rolled ${result.total} — no legal moves`]);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      if (!result.extraTurn) {
        setCurrentPlayer(p => 1 - p);
      }
      setDiceResult(result);
      return;
    }

    setLegalMoves(moves);
    setGamePhase('moving');
    setMessage(`Rolled ${result.total} — choose a piece to move`);
  }, [gamePhase, winner, currentPlayer, pieces, getLegalMoves]);

  const makeMove = useCallback((move) => {
    setPieces(prev => {
      const next = [prev[0].slice(), prev[1].slice()];

      // Handle capture
      if (move.type === 'capture') {
        const oppPath = getPlayerPath(1 - currentPlayer);
        const myPath = getPlayerPath(currentPlayer);
        const destGrid = myPath[move.to];

        for (let oi = 0; oi < next[1 - currentPlayer].length; oi++) {
          const op = next[1 - currentPlayer][oi];
          if (op >= 0 && op < CIRCUIT_LENGTH) {
            const oppGrid = oppPath[op];
            if (oppGrid && destGrid && oppGrid.row === destGrid.row && oppGrid.col === destGrid.col) {
              next[1 - currentPlayer][oi] = -1; // Send back
              break;
            }
          }
        }
      }

      next[currentPlayer][move.pieceIdx] = move.to;

      // Check win
      if (next[currentPlayer].every(p => p >= FINISH)) {
        setWinner(currentPlayer);
        setGamePhase('gameover');
        const msg = `${isAI ? (currentPlayer === 0 ? 'You win' : 'Atlas wins') : `Player ${currentPlayer + 1} wins`}!`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
        return next;
      }

      const msgParts = [];
      if (move.type === 'enter') msgParts.push('Piece enters the board!');
      else if (move.type === 'capture') msgParts.push('Captured an opponent!');
      else if (move.type === 'finish') msgParts.push('Piece reaches home!');
      else msgParts.push(`Moved to position ${move.to}`);

      if (diceResult?.extraTurn) {
        msgParts.push('Extra turn!');
        setGamePhase('rolling');
      } else {
        setCurrentPlayer(p => 1 - p);
        setGamePhase('rolling');
      }
      setTurnCount(t => t + 1);
      setMessage(msgParts.join(' '));
      setMoveLog(log => [...log, `${isAI ? (currentPlayer === 0 ? 'You' : 'Atlas') : 'Player ' + (currentPlayer + 1)}: ${msgParts.join(' ')}`]);
      setLegalMoves([]);

      return next;
    });
  }, [currentPlayer, diceResult, isAI]);

  const handlePieceClick = useCallback((pieceIdx) => {
    if (gamePhase !== 'moving') return;
    const move = legalMoves.find(m => m.pieceIdx === pieceIdx);
    if (move) makeMove(move);
  }, [gamePhase, legalMoves, makeMove]);

  // AI auto-play
  useEffect(() => {
    if (isAI && currentPlayer === 1 && winner === null) {
      if (gamePhase === 'rolling') {
        aiTimer.current = setTimeout(handleRoll, 700);
      } else if (gamePhase === 'moving' && legalMoves.length > 0) {
        aiTimer.current = setTimeout(() => {
          const move = chooseBestMove(legalMoves, (m) => {
            let score = 0;
            if (m.type === 'finish') score += 25;
            if (m.type === 'capture') score += 15;
            if (m.type === 'enter') score += 5;
            if (CASTLES.has(m.to)) score += 8;
            score += (m.to - Math.max(m.from, 0)) * 2;
            return evaluateWithNoise(score);
          });
          if (move) makeMove(move);
        }, 500);
      }
    }
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [isAI, currentPlayer, gamePhase, winner, legalMoves, handleRoll, makeMove]);

  const players = isAI
    ? [{ name: 'You', color: PLAYER_COLORS[0] }, { name: 'Atlas', color: PLAYER_COLORS[1] }]
    : [{ name: 'Player 1', color: PLAYER_COLORS[0] }, { name: 'Player 2', color: PLAYER_COLORS[1] }];

  // Draw the cross-shaped board
  const boardCells = getAllBoardCells();
  const legalPieceIndices = new Set(legalMoves.map(m => m.pieceIdx));

  return (
    <GameShell
      gameName="Pachisi"
      players={players}
      currentPlayer={currentPlayer}
      diceResult={diceResult}
      gamePhase={gamePhase}
      winner={winner}
      turnCount={turnCount}
      onRoll={handleRoll}
      onRestart={resetGame}
      onExit={onExit}
      diceDisplay={diceResult ? <CowrieDiceDisplay shells={diceResult.shells} /> : null}
      extraInfo={message}
      moveLog={moveLog}
    >
      <svg className="game-board-svg" viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`} style={{ maxWidth: 480 }}>
        {/* Draw board cells */}
        {boardCells.map(({ row, col }) => {
          const { x, y } = gridToSVG(row, col);
          const isCenterCell = row === 9 && col === 9;
          return (
            <rect
              key={`${row}-${col}`}
              x={x - CELL / 2}
              y={y - CELL / 2}
              width={CELL}
              height={CELL}
              className={`board-cell ${isCenterCell ? 'pachisi-home' : 'board-cell-light'}`}
              rx="1"
            />
          );
        })}

        {/* Draw castle markers */}
        {[0, 1].map(player => {
          const path = getPlayerPath(player);
          return Array.from(CASTLES).map(pos => {
            if (pos >= path.length) return null;
            const grid = path[pos];
            const { x, y } = gridToSVG(grid.row, grid.col);
            return (
              <g key={`castle-${player}-${pos}`}>
                <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5}
                  stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0.4" />
                <line x1={x + 5} y1={y - 5} x2={x - 5} y2={y + 5}
                  stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0.4" />
              </g>
            );
          });
        })}

        {/* Draw pieces */}
        {[0, 1].map(player =>
          pieces[player].map((pos, i) => {
            if (pos < 0 || pos >= FINISH) return null;
            const { x, y } = piecePositionToSVG(pos, player);
            const offset = player === 0 ? -4 : 4;
            const isClickable = gamePhase === 'moving' && player === currentPlayer && legalPieceIndices.has(i);
            return (
              <circle
                key={`p${player}-${i}`}
                cx={x + offset}
                cy={y}
                r={6}
                fill={PLAYER_COLORS[player]}
                stroke={isClickable ? 'var(--accent-ember)' : 'var(--bg-dark)'}
                strokeWidth={isClickable ? 2 : 1}
                className={`board-piece${isClickable ? ' board-piece-highlight' : ''}`}
                onClick={() => isClickable && handlePieceClick(i)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              />
            );
          })
        )}

        {/* Off-board piece counts */}
        {[0, 1].map(player => {
          const offBoard = pieces[player].filter(p => p === -1).length;
          const finished = pieces[player].filter(p => p >= FINISH).length;
          const px = player === 0 ? 30 : BOARD_PX - 30;
          return (
            <g key={`info-${player}`}>
              <text x={px} y={BOARD_PX - 8} textAnchor="middle" fontSize="8"
                fill={PLAYER_COLORS[player]}>
                Wait: {offBoard} | Home: {finished}
              </text>
            </g>
          );
        })}
      </svg>
    </GameShell>
  );
}
