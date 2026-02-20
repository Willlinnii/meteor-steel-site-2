import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
import MultiplayerChat from '../shared/MultiplayerChat';
import GAME_BOOK from '../shared/gameBookData';
import { CowrieDiceDisplay } from '../shared/DiceDisplay';
import { rollCowrieShells } from '../shared/diceEngine';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import {
  CELL, CASTLES, CIRCUIT_LENGTH, HOME_STRETCH, HOME_STRETCHES,
  getAllBoardCells, getPlayerPath, gridToSVG, piecePositionToSVG,
} from './pachisiData';

const BOARD_PX = 19 * CELL + 20;
const PIECES_PER_PLAYER = 4;
const FINISH = CIRCUIT_LENGTH + HOME_STRETCH;

const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

// Staging area positions for waiting (off-board) pieces
// Player 0 (gold): bottom-left corner of cross
// Player 1 (blue): top-right corner of cross
const STAGING = [
  [{ row: 14, col: 3 }, { row: 14, col: 4 }, { row: 15, col: 3 }, { row: 15, col: 4 }],
  [{ row: 3, col: 14 }, { row: 3, col: 15 }, { row: 4, col: 14 }, { row: 4, col: 15 }],
];

// Home stretch cells for visual coloring
const HOME_CELL_KEYS = [
  new Set(HOME_STRETCHES[0].map(c => `${c.row}-${c.col}`)),
  new Set(HOME_STRETCHES[1].map(c => `${c.row}-${c.col}`)),
];

function initPieces() {
  return [
    Array(PIECES_PER_PLAYER).fill(-1),
    Array(PIECES_PER_PLAYER).fill(-1),
  ];
}

export default function PachisiGame({
  mode, onExit,
  // Online multiplayer props (optional)
  onlineState, myPlayerIndex, isMyTurn, onStateChange, matchData, playerNames: onlinePlayerNames,
  chatMessages, sendChat, onForfeit, onPlayerClick,
}) {
  const isOnline = mode === 'online';

  const [pieces, setPieces] = useState(isOnline ? (onlineState?.pieces || initPieces()) : initPieces());
  const [currentPlayer, setCurrentPlayer] = useState(isOnline ? (matchData?.currentPlayer ?? 0) : 0);
  const [diceResult, setDiceResult] = useState(isOnline ? (onlineState?.diceResult || null) : null);
  const [gamePhase, setGamePhase] = useState(isOnline ? (matchData?.gamePhase || 'rolling') : 'rolling');
  const [winner, setWinner] = useState(isOnline ? (matchData?.winner ?? null) : null);
  const [turnCount, setTurnCount] = useState(isOnline ? (matchData?.turnCount || 0) : 0);
  const [message, setMessage] = useState(isOnline ? (onlineState?.message || '') : 'Roll the cowrie shells! Roll 1, 6, or 25 to enter a piece.');
  const [legalMoves, setLegalMoves] = useState(isOnline ? (onlineState?.legalMoves || []) : []);
  const [moveLog, setMoveLog] = useState(isOnline ? (onlineState?.moveLog || []) : []);
  const aiTimer = useRef(null);
  const isAI = mode === 'ai';

  // Sync from Firestore when online state changes
  useEffect(() => {
    if (!isOnline || !onlineState || !matchData) return;
    setPieces(onlineState.pieces || initPieces());
    setDiceResult(onlineState.diceResult || null);
    setMessage(onlineState.message || '');
    setMoveLog(onlineState.moveLog || []);
    setLegalMoves(onlineState.legalMoves || []);
    setCurrentPlayer(matchData.currentPlayer ?? 0);
    setGamePhase(matchData.gamePhase || 'rolling');
    setWinner(matchData.winner ?? null);
    setTurnCount(matchData.turnCount || 0);
  }, [isOnline, onlineState, matchData]);

  const pName = useCallback((p) => {
    if (isOnline) return onlinePlayerNames?.[p] || `Player ${p + 1}`;
    if (isAI) return p === 0 ? 'You' : 'Atlas';
    return `Player ${p + 1}`;
  }, [isAI, isOnline, onlinePlayerNames]);

  const resetGame = useCallback(() => {
    setPieces(initPieces());
    setCurrentPlayer(0);
    setDiceResult(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the cowrie shells! Roll 1, 6, or 25 to enter a piece.');
    setLegalMoves([]);
    setMoveLog([]);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const getLegalMoves = useCallback((player, roll, currentPieces) => {
    const myPieces = currentPieces[player];
    const oppPieces = currentPieces[1 - player];
    const moves = [];
    const oppPath = getPlayerPath(1 - player);
    const myPath = getPlayerPath(player);

    for (let i = 0; i < myPieces.length; i++) {
      const pos = myPieces[i];

      if (pos === -1) {
        if (roll === 1 || roll === 6 || roll === 25) {
          const entryOccupied = myPieces.some((p, j) => j !== i && p === 0);
          if (!entryOccupied) {
            moves.push({ pieceIdx: i, from: -1, to: 0, type: 'enter' });
          }
        }
        continue;
      }

      if (pos >= FINISH) continue;

      const dest = pos + roll;
      if (dest > FINISH) continue;

      if (dest === FINISH) {
        moves.push({ pieceIdx: i, from: pos, to: FINISH, type: 'finish' });
        continue;
      }

      const ownOccupied = myPieces.some((p, j) => j !== i && p === dest);
      if (ownOccupied) continue;

      let capture = false;
      if (dest < CIRCUIT_LENGTH) {
        const destGrid = myPath[dest];
        const isCastle = CASTLES.has(dest);

        for (let oi = 0; oi < oppPieces.length; oi++) {
          const op = oppPieces[oi];
          if (op >= 0 && op < CIRCUIT_LENGTH) {
            const oppGrid = oppPath[op];
            if (oppGrid && destGrid && oppGrid.row === destGrid.row && oppGrid.col === destGrid.col) {
              if (isCastle) {
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
    if (isOnline && !isMyTurn) return;
    if (isAI && currentPlayer === 1) return; // AI rolls automatically
    const result = rollCowrieShells();
    setDiceResult(result);

    const moves = getLegalMoves(currentPlayer, result.total, pieces);
    if (moves.length === 0) {
      const msg = `Rolled ${result.total} — no legal moves!`;
      const newLog = [...moveLog, `${pName(currentPlayer)} rolled ${result.total} — no legal moves`];
      const nextPlayer = result.extraTurn ? currentPlayer : 1 - currentPlayer;

      if (isOnline && onStateChange) {
        onStateChange(
          { pieces, diceResult: result, message: msg, moveLog: newLog, legalMoves: [] },
          { currentPlayer: nextPlayer, gamePhase: 'rolling' }
        );
      } else {
        setMessage(msg);
        setMoveLog(newLog);
        setGamePhase('rolling');
        setTurnCount(t => t + 1);
        if (!result.extraTurn) {
          setCurrentPlayer(p => 1 - p);
        }
      }
      return;
    }

    if (isOnline && onStateChange) {
      // In online mode, broadcast the roll + legal moves so the moving phase is synced
      const hasEnter = moves.some(m => m.type === 'enter');
      let rollMsg;
      if (hasEnter && moves.every(m => m.type === 'enter')) {
        rollMsg = `Rolled ${result.total} — grace throw! Click a waiting piece to enter.`;
      } else if (hasEnter) {
        rollMsg = `Rolled ${result.total} — move a piece or enter a new one from waiting.`;
      } else {
        rollMsg = `Rolled ${result.total} — choose a piece to move.`;
      }
      onStateChange(
        { pieces, diceResult: result, message: rollMsg, moveLog, legalMoves: moves },
        { currentPlayer, gamePhase: 'moving' }
      );
    } else {
      setLegalMoves(moves);
      setGamePhase('moving');
      const hasEnter = moves.some(m => m.type === 'enter');
      if (hasEnter && moves.every(m => m.type === 'enter')) {
        setMessage(`Rolled ${result.total} — grace throw! Click a waiting piece to enter.`);
      } else if (hasEnter) {
        setMessage(`Rolled ${result.total} — move a piece or enter a new one from waiting.`);
      } else {
        setMessage(`Rolled ${result.total} — choose a piece to move.`);
      }
    }
  }, [gamePhase, winner, currentPlayer, pieces, getLegalMoves, isAI, pName, isOnline, isMyTurn, onStateChange, moveLog]);

  // makeMove — state setters pulled out of setPieces updater (fixes React batching)
  const makeMove = useCallback((move) => {
    const next = [pieces[0].slice(), pieces[1].slice()];

    if (move.type === 'capture') {
      const oppPath = getPlayerPath(1 - currentPlayer);
      const myPath = getPlayerPath(currentPlayer);
      const destGrid = myPath[move.to];

      for (let oi = 0; oi < next[1 - currentPlayer].length; oi++) {
        const op = next[1 - currentPlayer][oi];
        if (op >= 0 && op < CIRCUIT_LENGTH) {
          const oppGrid = oppPath[op];
          if (oppGrid && destGrid && oppGrid.row === destGrid.row && oppGrid.col === destGrid.col) {
            next[1 - currentPlayer][oi] = -1;
            break;
          }
        }
      }
    }

    next[currentPlayer][move.pieceIdx] = move.to;

    const isGameOver = next[currentPlayer].every(p => p >= FINISH);

    if (isGameOver) {
      const msg = `${pName(currentPlayer)} wins!`;
      const newLog = [...moveLog, msg];

      if (isOnline && onStateChange) {
        onStateChange(
          { pieces: next, diceResult, message: msg, moveLog: newLog, legalMoves: [] },
          { currentPlayer, gamePhase: 'gameover', winner: currentPlayer, status: 'completed', completedAt: new Date() }
        );
      } else {
        setPieces(next);
        setWinner(currentPlayer);
        setGamePhase('gameover');
        setMessage(msg);
        setMoveLog(newLog);
      }
      return;
    }

    const msgParts = [];
    if (move.type === 'enter') msgParts.push('Piece enters the board!');
    else if (move.type === 'capture') msgParts.push('Captured an opponent!');
    else if (move.type === 'finish') msgParts.push('Piece reaches home!');
    else msgParts.push(`Moved to position ${move.to}`);

    // Extra turns on rolls of 1, 6, or 25 — don't switch player
    const isExtraTurn = diceResult?.extraTurn;
    if (isExtraTurn) {
      msgParts.push('Extra turn!');
    }

    const nextPlayer = isExtraTurn ? currentPlayer : 1 - currentPlayer;
    const newLog = [...moveLog, `${pName(currentPlayer)}: ${msgParts.join(' ')}`];

    if (isOnline && onStateChange) {
      onStateChange(
        { pieces: next, diceResult, message: msgParts.join(' '), moveLog: newLog, legalMoves: [] },
        { currentPlayer: nextPlayer, gamePhase: 'rolling' }
      );
    } else {
      setPieces(next);
      if (!isExtraTurn) {
        setCurrentPlayer(p => 1 - p);
      }
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      setMessage(msgParts.join(' '));
      setMoveLog(newLog);
      setLegalMoves([]);
    }
  }, [currentPlayer, diceResult, pieces, pName, isOnline, onStateChange, moveLog]);

  const handlePieceClick = useCallback((pieceIdx) => {
    if (gamePhase !== 'moving') return;
    if (isOnline && !isMyTurn) return;
    const move = legalMoves.find(m => m.pieceIdx === pieceIdx);
    if (move) makeMove(move);
  }, [gamePhase, legalMoves, makeMove, isOnline, isMyTurn]);

  // AI auto-play — consolidated single sequence (no two-phase race condition)
  useEffect(() => {
    if (!isAI || currentPlayer !== 1 || winner !== null || gamePhase !== 'rolling') return;

    const rollTimer = setTimeout(() => {
      const result = rollCowrieShells();
      setDiceResult(result);

      const moves = getLegalMoves(1, result.total, pieces);
      if (moves.length === 0) {
        setMessage(`Rolled ${result.total} — no legal moves!`);
        setMoveLog(log => [...log, `Atlas rolled ${result.total} — no legal moves`]);
        setTurnCount(t => t + 1);
        if (!result.extraTurn) {
          setCurrentPlayer(0);
        }
        return;
      }

      setMessage(`Rolled ${result.total} — Atlas is thinking...`);

      aiTimer.current = setTimeout(() => {
        const move = chooseBestMove(moves, (m) => {
          let score = 0;
          if (m.type === 'finish') score += 25;
          if (m.type === 'capture') score += 15;
          if (m.type === 'enter') score += 5;
          if (CASTLES.has(m.to)) score += 8;
          score += (m.to - Math.max(m.from, 0)) * 2;
          return evaluateWithNoise(score);
        });

        if (move) {
          const next = [pieces[0].slice(), pieces[1].slice()];

          if (move.type === 'capture') {
            const oppPath = getPlayerPath(0);
            const myPath = getPlayerPath(1);
            const destGrid = myPath[move.to];
            for (let oi = 0; oi < next[0].length; oi++) {
              const op = next[0][oi];
              if (op >= 0 && op < CIRCUIT_LENGTH) {
                const oppGrid = oppPath[op];
                if (oppGrid && destGrid && oppGrid.row === destGrid.row && oppGrid.col === destGrid.col) {
                  next[0][oi] = -1;
                  break;
                }
              }
            }
          }

          next[1][move.pieceIdx] = move.to;
          setPieces(next);

          if (next[1].every(p => p >= FINISH)) {
            setWinner(1);
            setGamePhase('gameover');
            setMessage('Atlas wins!');
            setMoveLog(log => [...log, 'Atlas wins!']);
            return;
          }

          const msgParts = [];
          if (move.type === 'enter') msgParts.push('Piece enters the board!');
          else if (move.type === 'capture') msgParts.push('Captured an opponent!');
          else if (move.type === 'finish') msgParts.push('Piece reaches home!');
          else msgParts.push(`Moved to position ${move.to}`);

          if (result.extraTurn) {
            msgParts.push('Extra turn!');
            setGamePhase('rolling');
          } else {
            setCurrentPlayer(0);
            setGamePhase('rolling');
          }
          setTurnCount(t => t + 1);
          setMessage(msgParts.join(' '));
          setMoveLog(log => [...log, `Atlas: ${msgParts.join(' ')}`]);
          setLegalMoves([]);
        }
      }, 500);
    }, 700);

    return () => {
      clearTimeout(rollTimer);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [isAI, currentPlayer, winner, gamePhase, pieces, getLegalMoves]);

  const players = isOnline
    ? [{ name: onlinePlayerNames?.[0] || 'Player 1', color: PLAYER_COLORS[0] }, { name: onlinePlayerNames?.[1] || 'Player 2', color: PLAYER_COLORS[1] }]
    : isAI
      ? [{ name: 'You', color: PLAYER_COLORS[0] }, { name: 'Atlas', color: PLAYER_COLORS[1] }]
      : [{ name: 'Player 1', color: PLAYER_COLORS[0] }, { name: 'Player 2', color: PLAYER_COLORS[1] }];

  const boardCells = getAllBoardCells();
  const legalPieceIndices = new Set(legalMoves.map(m => m.pieceIdx));

  // Entry point SVG positions for each player
  const entryPoints = [piecePositionToSVG(0, 0), piecePositionToSVG(0, 1)];

  return (
    <GameShell
      gameName="Pachisi"
      players={players}
      currentPlayer={currentPlayer}
      diceResult={diceResult}
      gamePhase={gamePhase}
      winner={winner}
      turnCount={turnCount}
      onRoll={(!isOnline || isMyTurn) ? handleRoll : null}
      onRestart={isOnline ? null : resetGame}
      onExit={onExit}
      onForfeit={isOnline ? onForfeit : undefined}
      onPlayerClick={isOnline ? onPlayerClick : undefined}
      isOnline={isOnline}
      isMyTurn={isMyTurn}
      chatPanel={isOnline ? <MultiplayerChat messages={chatMessages || []} onSend={sendChat} myUid={matchData?.players?.[myPlayerIndex]?.uid} /> : null}
      diceDisplay={diceResult ? <CowrieDiceDisplay shells={diceResult.shells} /> : null}
      extraInfo={isOnline && !isMyTurn && !winner ? "Waiting for opponent's move..." : message}
      moveLog={moveLog}
      rules={GAME_BOOK['pachisi'].rules}
      secrets={GAME_BOOK['pachisi'].secrets}
    >
      <svg className="game-board-svg" viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`} style={{ maxWidth: 500 }}>
        {/* Board cells with home stretch coloring */}
        {boardCells.map(({ row, col }) => {
          const { x, y } = gridToSVG(row, col);
          const key = `${row}-${col}`;
          const isCenterCell = row === 9 && col === 9;
          const isHome0 = HOME_CELL_KEYS[0].has(key);
          const isHome1 = HOME_CELL_KEYS[1].has(key);
          let cellClass = 'board-cell board-cell-light';
          if (isCenterCell) cellClass = 'board-cell pachisi-home';
          else if (isHome0) cellClass = 'board-cell pachisi-home-0';
          else if (isHome1) cellClass = 'board-cell pachisi-home-1';
          return (
            <rect
              key={key}
              x={x - CELL / 2}
              y={y - CELL / 2}
              width={CELL}
              height={CELL}
              className={cellClass}
              rx="1"
            />
          );
        })}

        {/* Castle markers (safe squares) */}
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

        {/* Entry point markers */}
        {[0, 1].map(player => {
          const { x, y } = entryPoints[player];
          return (
            <g key={`entry-${player}`}>
              <rect
                x={x - CELL / 2} y={y - CELL / 2}
                width={CELL} height={CELL}
                fill="none"
                stroke={PLAYER_COLORS[player]}
                strokeWidth="1.5"
                strokeDasharray="3 2"
                rx="2"
                opacity="0.6"
              />
              <text x={x} y={y + 3} textAnchor="middle" fontSize="7"
                fill={PLAYER_COLORS[player]} opacity="0.7">
                Enter
              </text>
            </g>
          );
        })}

        {/* Center HOME label */}
        <text x={gridToSVG(9, 9).x} y={gridToSVG(9, 9).y + 3} textAnchor="middle"
          fontSize="7" fill="var(--accent-ember)" fontWeight="bold">
          HOME
        </text>

        {/* On-board pieces */}
        {[0, 1].map(player =>
          pieces[player].map((pos, i) => {
            if (pos < 0 || pos >= FINISH) return null;
            const { x, y } = piecePositionToSVG(pos, player);
            const offset = player === 0 ? -4 : 4;
            const isClickable = gamePhase === 'moving' && player === currentPlayer && legalPieceIndices.has(i) && (!isOnline || isMyTurn);
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

        {/* Off-board (waiting) pieces in staging areas */}
        {[0, 1].map(player =>
          pieces[player].map((pos, i) => {
            if (pos !== -1) return null;
            const stagingPos = STAGING[player][i];
            const { x, y } = gridToSVG(stagingPos.row, stagingPos.col);
            const isClickable = gamePhase === 'moving' && player === currentPlayer && legalPieceIndices.has(i) && (!isOnline || isMyTurn);
            return (
              <circle
                key={`staging-${player}-${i}`}
                cx={x}
                cy={y}
                r={7}
                fill={PLAYER_COLORS[player]}
                stroke={isClickable ? 'var(--accent-ember)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isClickable ? 2.5 : 1}
                className={`board-piece${isClickable ? ' board-piece-highlight' : ''}`}
                onClick={() => isClickable && handlePieceClick(i)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
                opacity={isClickable ? 1 : 0.6}
              />
            );
          })
        )}

        {/* Staging area labels */}
        {[0, 1].map(player => {
          const labelRow = player === 0 ? 13 : 2;
          const labelCol = player === 0 ? 3.5 : 14.5;
          const { x, y } = gridToSVG(labelRow, labelCol);
          return (
            <text key={`staging-label-${player}`} x={x} y={y} textAnchor="middle"
              fontSize="7" fill={PLAYER_COLORS[player]} opacity="0.8">
              Waiting
            </text>
          );
        })}

        {/* Finished piece indicators near center */}
        {[0, 1].map(player => {
          const finished = pieces[player].filter(p => p >= FINISH).length;
          if (finished === 0) return null;
          const cx = player === 0 ? gridToSVG(9, 8).x : gridToSVG(9, 10).x;
          const cy = gridToSVG(9, 9).y;
          return (
            <g key={`finished-${player}`}>
              <circle cx={cx} cy={cy} r={6} fill={PLAYER_COLORS[player]} opacity="0.5" />
              <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fill="#fff">
                {finished}
              </text>
            </g>
          );
        })}

        {/* Status text at bottom */}
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
