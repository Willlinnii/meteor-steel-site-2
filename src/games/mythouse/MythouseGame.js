import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
import { D6Display } from '../shared/DiceDisplay';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import {
  RINGS, SPACES_PER_RING, RING_DICE, GEMSTONE_VALUES, FALLEN_STARLIGHT_VALUE,
  PIECE_TYPES, LADDERS, CHUTES, ORDEAL_POSITIONS,
  ringPosToSVG, rollForRing, getLadderAt, getChuteAt,
} from './mythouseData';

const BOARD_SIZE = 560;
const CENTER = BOARD_SIZE / 2;
const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

function initPieces() {
  // Each player starts with 7 pieces at ring 1, positions 0-6 (alternating)
  return [
    PIECE_TYPES.map((_, i) => ({ ring: 1, pos: i * 2, finished: false })),
    PIECE_TYPES.map((_, i) => ({ ring: 1, pos: i * 2 + 1, finished: false })),
  ];
}

export default function MythouseGame({ mode, onExit }) {
  const [pieces, setPieces] = useState(initPieces);
  const [scores, setScores] = useState([0, 0]);
  const [gems, setGems] = useState(() => {
    const g = {};
    for (let r = 1; r <= RINGS; r++) g[r] = true;
    return g;
  });
  const [starlightClaimed, setStarlightClaimed] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling');
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the dice to begin your ascent!');
  const [legalMoves, setLegalMoves] = useState([]);
  const [ordeal, setOrdeal] = useState(null); // { challenger, defender, cards: [null,null], revealed: false }
  const [moveLog, setMoveLog] = useState([]);
  const [direction, setDirection] = useState(1); // 1 = clockwise, -1 = counter-clockwise
  const aiTimer = useRef(null);
  const isAI = mode === 'ai';

  const resetGame = useCallback(() => {
    setPieces(initPieces());
    setScores([0, 0]);
    setGems(() => {
      const g = {};
      for (let r = 1; r <= RINGS; r++) g[r] = true;
      return g;
    });
    setStarlightClaimed(false);
    setCurrentPlayer(0);
    setDiceValue(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the dice to begin your ascent!');
    setLegalMoves([]);
    setOrdeal(null);
    setMoveLog([]);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const getHighestRing = useCallback((player) => {
    return Math.max(...pieces[player].filter(p => !p.finished).map(p => p.ring), 1);
  }, [pieces]);

  const getLegalMovesForPlayer = useCallback((player, roll, currentPieces) => {
    const myPieces = currentPieces[player];
    const oppPieces = currentPieces[1 - player];
    const moves = [];

    for (let i = 0; i < myPieces.length; i++) {
      const piece = myPieces[i];
      if (piece.finished) continue;

      let newPos = piece.pos + roll;
      let newRing = piece.ring;

      // If we go past 27, we advance to next ring
      if (newPos >= SPACES_PER_RING) {
        if (piece.ring >= RINGS) {
          // At the top ring — can we finish?
          if (newPos === SPACES_PER_RING) {
            moves.push({ pieceIdx: i, toRing: RINGS, toPos: SPACES_PER_RING, type: 'summit' });
          }
          continue; // overshoot
        }
        newRing = piece.ring + 1;
        newPos = newPos - SPACES_PER_RING;
      }

      // Check if landing on own piece (push it back)
      const ownBlocked = myPieces.some((p, j) =>
        j !== i && !p.finished && p.ring === newRing && p.pos === newPos
      );

      // Check for opponent on destination
      const oppOnDest = oppPieces.some(p =>
        !p.finished && p.ring === newRing && p.pos === newPos
      );

      moves.push({
        pieceIdx: i,
        fromRing: piece.ring,
        fromPos: piece.pos,
        toRing: newRing,
        toPos: newPos,
        type: ownBlocked ? 'push' : oppOnDest ? 'displace' : 'move',
      });
    }

    return moves;
  }, []);

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return;
    const highRing = getHighestRing(currentPlayer);
    const roll = rollForRing(highRing);
    setDiceValue(roll);

    const moves = getLegalMovesForPlayer(currentPlayer, roll, pieces);
    if (moves.length === 0) {
      setMessage(`Rolled ${roll} — no legal moves`);
      setMoveLog(log => [...log, `${isAI ? (currentPlayer === 0 ? 'You' : 'Atlas') : 'Player ' + (currentPlayer + 1)} rolled ${roll} — no legal moves`]);
      setCurrentPlayer(p => 1 - p);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      return;
    }

    setLegalMoves(moves);
    setGamePhase('moving');
    setMessage(`Rolled ${roll} (${RING_DICE[highRing].name}) — choose a piece`);
  }, [gamePhase, winner, currentPlayer, pieces, getHighestRing, getLegalMovesForPlayer]);

  const applyMove = useCallback((move) => {
    setPieces(prev => {
      const next = [prev[0].map(p => ({ ...p })), prev[1].map(p => ({ ...p }))];

      // Summit
      if (move.type === 'summit') {
        next[currentPlayer][move.pieceIdx].finished = true;

        // Check if any pieces reached summit — game could end
        const allFinished = next[currentPlayer].every(p => p.finished);
        if (allFinished || !starlightClaimed) {
          // First to summit claims starlight
          if (!starlightClaimed) {
            setStarlightClaimed(true);
            setScores(s => {
              const ns = [...s];
              ns[currentPlayer] += FALLEN_STARLIGHT_VALUE;
              return ns;
            });
            setMessage(`Reached the summit! Claimed Fallen Starlight (+${FALLEN_STARLIGHT_VALUE})`);
            setMoveLog(log => [...log, `Reached the summit! Claimed Fallen Starlight (+${FALLEN_STARLIGHT_VALUE})`]);
          }

          // Game ends when first player finishes all pieces (simplified)
          // Actually per rules: game ends when first player reaches top
          setWinner(null); // will be determined by score
          setGamePhase('gameover');

          // Determine winner by score
          const finalScores = [...scores];
          finalScores[currentPlayer] += FALLEN_STARLIGHT_VALUE;
          const w = finalScores[0] > finalScores[1] ? 0 : finalScores[1] > finalScores[0] ? 1 : 0;
          setWinner(w);
          return next;
        }

        setMessage('Piece reaches the summit!');
        setMoveLog(log => [...log, 'Piece reaches the summit!']);
        setCurrentPlayer(p => 1 - p);
        setGamePhase('rolling');
        setTurnCount(t => t + 1);
        setLegalMoves([]);
        return next;
      }

      let destRing = move.toRing;
      let destPos = move.toPos;

      // Handle push (landing on own piece)
      if (move.type === 'push') {
        const pushIdx = next[currentPlayer].findIndex((p, j) =>
          j !== move.pieceIdx && !p.finished && p.ring === destRing && p.pos === destPos
        );
        if (pushIdx !== -1) {
          next[currentPlayer][pushIdx].pos = Math.max(0, next[currentPlayer][pushIdx].pos - 3);
        }
      }

      // Handle displace (landing on opponent)
      if (move.type === 'displace') {
        const oppIdx = next[1 - currentPlayer].findIndex(p =>
          !p.finished && p.ring === destRing && p.pos === destPos
        );
        if (oppIdx !== -1) {
          // Send back to start of their current ring
          next[1 - currentPlayer][oppIdx].pos = 0;
        }
      }

      next[currentPlayer][move.pieceIdx].ring = destRing;
      next[currentPlayer][move.pieceIdx].pos = destPos;

      // Check for ladder
      const ladder = getLadderAt(destRing, destPos);
      if (ladder) {
        next[currentPlayer][move.pieceIdx].ring = ladder.toRing;
        next[currentPlayer][move.pieceIdx].pos = ladder.toPos;
        setMessage(`Ladder! Climb to ring ${ladder.toRing}`);
        setMoveLog(log => [...log, `Ladder! Climb to ring ${ladder.toRing}`]);
      }
      // Check for chute
      else {
        const chute = getChuteAt(destRing, destPos);
        if (chute) {
          next[currentPlayer][move.pieceIdx].ring = chute.toRing;
          next[currentPlayer][move.pieceIdx].pos = chute.toPos;
          setMessage(`Chute! Slide to ring ${chute.toRing}`);
          setMoveLog(log => [...log, `Chute! Slide to ring ${chute.toRing}`]);
        } else {
          setMessage(`Moved to ring ${destRing}, position ${destPos}`);
          setMoveLog(log => [...log, `Moved to ring ${destRing}, position ${destPos}`]);
        }
      }

      // Check for gemstone
      if (gems[destRing] && destPos === 0) {
        setGems(g => ({ ...g, [destRing]: false }));
        const val = GEMSTONE_VALUES[destRing];
        setScores(s => {
          const ns = [...s];
          ns[currentPlayer] += val;
          return ns;
        });
        setMessage(m => m + ` Collected gemstone (+${val} pts)!`);
        setMoveLog(log => [...log, `Collected gemstone (+${val} pts)!`]);
      }

      // Check for ordeal (entering a new ring at position 0)
      const finalRing = next[currentPlayer][move.pieceIdx].ring;
      if (ORDEAL_POSITIONS.includes(finalRing) && next[currentPlayer][move.pieceIdx].pos === 0 &&
          move.fromRing !== finalRing) {
        // Trigger ordeal
        setOrdeal({
          challenger: currentPlayer,
          defender: 1 - currentPlayer,
          cards: [null, null],
          revealed: false,
          pieceIdx: move.pieceIdx,
        });
        setGamePhase('ordeal');
        setLegalMoves([]);
        return next;
      }

      setCurrentPlayer(p => 1 - p);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      setLegalMoves([]);
      return next;
    });
  }, [currentPlayer, gems, scores, starlightClaimed]);

  const handlePieceClick = useCallback((pieceIdx) => {
    if (gamePhase !== 'moving') return;
    const move = legalMoves.find(m => m.pieceIdx === pieceIdx);
    if (move) applyMove(move);
  }, [gamePhase, legalMoves, applyMove]);

  // Ordeal resolution
  const handleOrdealReveal = useCallback(() => {
    if (!ordeal || ordeal.revealed) return;
    const card0 = Math.floor(Math.random() * 10) + 1;
    const card1 = Math.floor(Math.random() * 10) + 1;
    setOrdeal(prev => ({ ...prev, cards: [card0, card1], revealed: true }));
  }, [ordeal]);

  const handleOrdealClose = useCallback(() => {
    if (!ordeal || !ordeal.revealed) return;
    const ordealWinner = ordeal.cards[0] >= ordeal.cards[1] ? ordeal.challenger : ordeal.defender;

    if (ordealWinner === ordeal.challenger) {
      setMessage('Won the ordeal! Advance!');
      setMoveLog(log => [...log, 'Won the ordeal! Advance!']);
      setScores(s => {
        const ns = [...s];
        ns[ordeal.challenger] += 10;
        return ns;
      });
    } else {
      setMessage('Lost the ordeal! Pushed back.');
      setMoveLog(log => [...log, 'Lost the ordeal! Pushed back.']);
      setPieces(prev => {
        const next = [prev[0].map(p => ({ ...p })), prev[1].map(p => ({ ...p }))];
        const piece = next[ordeal.challenger][ordeal.pieceIdx];
        piece.pos = Math.max(0, piece.pos - 5);
        return next;
      });
    }

    setOrdeal(null);
    setCurrentPlayer(p => 1 - p);
    setGamePhase('rolling');
    setTurnCount(t => t + 1);
  }, [ordeal]);

  // AI auto-play
  useEffect(() => {
    if (isAI && currentPlayer === 1 && winner === null) {
      if (gamePhase === 'rolling') {
        aiTimer.current = setTimeout(handleRoll, 700);
      } else if (gamePhase === 'moving' && legalMoves.length > 0) {
        aiTimer.current = setTimeout(() => {
          const move = chooseBestMove(legalMoves, (m) => {
            let score = 0;
            if (m.type === 'summit') score += 100;
            if (m.type === 'displace') score += 10;
            if (m.toRing > m.fromRing) score += 15;
            score += m.toPos * 0.5;
            const ladder = getLadderAt(m.toRing, m.toPos);
            if (ladder) score += 20;
            const chute = getChuteAt(m.toRing, m.toPos);
            if (chute) score -= 15;
            if (m.type === 'push') score -= 5;
            return evaluateWithNoise(score);
          });
          if (move) applyMove(move);
        }, 500);
      } else if (gamePhase === 'ordeal') {
        aiTimer.current = setTimeout(() => {
          if (!ordeal?.revealed) {
            handleOrdealReveal();
            setTimeout(handleOrdealClose, 800);
          }
        }, 600);
      }
    }
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [isAI, currentPlayer, gamePhase, winner, legalMoves, ordeal,
      handleRoll, applyMove, handleOrdealReveal, handleOrdealClose]);

  const players = isAI
    ? [{ name: 'You', color: PLAYER_COLORS[0] }, { name: 'Atlas', color: PLAYER_COLORS[1] }]
    : [{ name: 'Player 1', color: PLAYER_COLORS[0] }, { name: 'Player 2', color: PLAYER_COLORS[1] }];

  const legalPieceIndices = new Set(legalMoves.map(m => m.pieceIdx));

  const scoreInfo = `Gold: ${scores[0]} pts | Steel: ${scores[1]} pts`;

  return (
    <GameShell
      gameName="Mythouse Game"
      players={players}
      currentPlayer={currentPlayer}
      diceResult={diceValue}
      gamePhase={gamePhase}
      winner={winner}
      turnCount={turnCount}
      onRoll={handleRoll}
      onRestart={resetGame}
      onExit={onExit}
      diceDisplay={diceValue ? <D6Display value={Math.min(diceValue, 6)} /> : null}
      extraInfo={<>{message}<br /><small>{scoreInfo}</small></>}
      moveLog={moveLog}
    >
      <div style={{ textAlign: 'right', marginBottom: 4 }}>
        <button
          onClick={() => setDirection(d => d * -1)}
          className="game-btn"
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          title={direction === 1 ? 'Currently clockwise — click to flip' : 'Currently counter-clockwise — click to flip'}
        >
          {direction === 1 ? '\u21BB CW' : '\u21BA CCW'}
        </button>
      </div>
      <svg className="game-board-svg" viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} style={{ maxWidth: 560 }}>
        {/* Draw rings */}
        {Array.from({ length: RINGS }, (_, i) => {
          const ring = i + 1;
          const maxR = 250;
          const minR = 40;
          const r = maxR - ((ring - 1) / (RINGS - 1)) * (maxR - minR);
          return (
            <circle
              key={`ring-${ring}`}
              cx={CENTER}
              cy={CENTER}
              r={r}
              className="mythouse-ring"
            />
          );
        })}

        {/* Draw spaces */}
        {Array.from({ length: RINGS }, (_, ri) => {
          const ring = ri + 1;
          return Array.from({ length: SPACES_PER_RING }, (_, pi) => {
            const { x, y } = ringPosToSVG(ring, pi, CENTER, CENTER, direction);
            return (
              <circle
                key={`sp-${ring}-${pi}`}
                cx={x}
                cy={y}
                r={4}
                fill="rgba(26,26,36,0.8)"
                stroke="var(--border-subtle)"
                strokeWidth="0.3"
              />
            );
          });
        })}

        {/* Draw ladders */}
        {LADDERS.map((l, i) => {
          const from = ringPosToSVG(l.fromRing, l.fromPos, CENTER, CENTER, direction);
          const to = ringPosToSVG(l.toRing, l.toPos, CENTER, CENTER, direction);
          return (
            <line
              key={`lad-${i}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              className="mythouse-ladder-line"
            />
          );
        })}

        {/* Draw chutes */}
        {CHUTES.map((c, i) => {
          const from = ringPosToSVG(c.fromRing, c.fromPos, CENTER, CENTER, direction);
          const to = ringPosToSVG(c.toRing, c.toPos, CENTER, CENTER, direction);
          return (
            <line
              key={`chu-${i}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              className="mythouse-chute"
            />
          );
        })}

        {/* Draw gemstones */}
        {Object.entries(gems).map(([ring, available]) => {
          if (!available) return null;
          const { x, y } = ringPosToSVG(Number(ring), 0, CENTER, CENTER, direction);
          return (
            <polygon
              key={`gem-${ring}`}
              points={`${x},${y - 6} ${x + 5},${y + 3} ${x - 5},${y + 3}`}
              className="mythouse-gem"
            />
          );
        })}

        {/* Fallen Starlight at center */}
        {!starlightClaimed && (
          <g>
            <polygon
              points={`${CENTER},${CENTER - 12} ${CENTER + 4},${CENTER - 3} ${CENTER + 12},${CENTER - 3} ${CENTER + 6},${CENTER + 3} ${CENTER + 8},${CENTER + 12} ${CENTER},${CENTER + 6} ${CENTER - 8},${CENTER + 12} ${CENTER - 6},${CENTER + 3} ${CENTER - 12},${CENTER - 3} ${CENTER - 4},${CENTER - 3}`}
              className="mythouse-star"
            />
          </g>
        )}

        {/* Draw pieces */}
        {[0, 1].map(player =>
          pieces[player].map((piece, i) => {
            if (piece.finished) return null;
            const { x, y } = ringPosToSVG(piece.ring, piece.pos, CENTER, CENTER, direction);
            const offset = player === 0 ? -5 : 5;
            const isClickable = gamePhase === 'moving' && player === currentPlayer && legalPieceIndices.has(i);
            return (
              <g
                key={`p${player}-${i}`}
                className={`board-piece${isClickable ? ' board-piece-highlight' : ''}`}
                onClick={() => isClickable && handlePieceClick(i)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <circle
                  cx={x + offset}
                  cy={y}
                  r={6}
                  fill={PLAYER_COLORS[player]}
                  stroke={isClickable ? 'var(--accent-ember)' : 'var(--bg-dark)'}
                  strokeWidth={isClickable ? 1.5 : 0.8}
                />
                <text
                  x={x + offset}
                  y={y + 1}
                  textAnchor="middle"
                  fontSize="6"
                  fill="var(--bg-dark)"
                  pointerEvents="none"
                >
                  {PIECE_TYPES[i].symbol}
                </text>
              </g>
            );
          })
        )}

        {/* Ring labels */}
        {Array.from({ length: RINGS }, (_, i) => {
          const ring = i + 1;
          const { x, y } = ringPosToSVG(ring, 14, CENTER, CENTER, direction);
          return (
            <text
              key={`rl-${ring}`}
              x={x}
              y={y - 8}
              textAnchor="middle"
              fontSize="7"
              fill="var(--text-secondary)"
              opacity="0.5"
            >
              Ring {ring}
            </text>
          );
        })}
      </svg>

      {/* Ordeal overlay */}
      {ordeal && (
        <div className="mythouse-ordeal-overlay" onClick={ordeal.revealed ? handleOrdealClose : undefined}>
          <div className="mythouse-ordeal-panel">
            <h3 className="mythouse-ordeal-title">The Ordeal!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
              A duel at the gate. Each player draws a card.
            </p>
            <div className="mythouse-ordeal-cards">
              <div
                className={`mythouse-ordeal-card ${ordeal.revealed ? 'face-up' : 'face-down'}`}
                onClick={!ordeal.revealed ? handleOrdealReveal : undefined}
                style={{ cursor: !ordeal.revealed ? 'pointer' : 'default' }}
              >
                {ordeal.revealed ? ordeal.cards[ordeal.challenger] : '?'}
              </div>
              <div className={`mythouse-ordeal-card ${ordeal.revealed ? 'face-up' : 'face-down'}`}>
                {ordeal.revealed ? ordeal.cards[ordeal.defender] : '?'}
              </div>
            </div>
            {ordeal.revealed && (
              <p style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                {ordeal.cards[ordeal.challenger] >= ordeal.cards[ordeal.defender]
                  ? 'You win the ordeal!'
                  : 'You lose the ordeal...'}
                <br />
                <small style={{ color: 'var(--text-secondary)' }}>Click to continue</small>
              </p>
            )}
            {!ordeal.revealed && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Click a card to reveal</p>
            )}
          </div>
        </div>
      )}
    </GameShell>
  );
}
