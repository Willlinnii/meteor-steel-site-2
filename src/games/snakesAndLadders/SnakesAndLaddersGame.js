import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
import MultiplayerChat from '../shared/MultiplayerChat';
import GAME_BOOK from '../shared/gameBookData';
import { D6Display } from '../shared/DiceDisplay';
import { rollD6 } from '../shared/diceEngine';
import { LADDERS, SNAKES, squareToSVG } from './snakesAndLaddersData';

const CELL = 50;
const PAD = 5;
const BOARD = CELL * 10 + PAD * 2;

const PLAYERS = [
  { name: 'Gold', color: '#c9a961' },
  { name: 'Steel', color: '#8b9dc3' },
];

function drawBoard() {
  const cells = [];
  for (let sq = 1; sq <= 100; sq++) {
    const { x, y } = squareToSVG(sq);
    const row = Math.floor((sq - 1) / 10);
    const isLight = (row + ((sq - 1) % 10)) % 2 === 0;
    cells.push(
      <g key={sq}>
        <rect
          x={x - CELL / 2}
          y={y - CELL / 2}
          width={CELL}
          height={CELL}
          className={`board-cell ${isLight ? 'board-cell-light' : 'board-cell-dark'}`}
        />
        <text x={x} y={y + 1.5} className="board-number">{sq}</text>
      </g>
    );
  }
  return cells;
}

function drawLadders() {
  return Object.entries(LADDERS).map(([from, to]) => {
    const a = squareToSVG(Number(from));
    const b = squareToSVG(Number(to));

    // Direction and perpendicular vectors
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy; // perpendicular
    const py = ux;

    const railSpacing = 4.5;
    const railColor = '#c9a961';
    const railDark = '#8b6914';
    const shadowColor = 'rgba(0,0,0,0.25)';

    // Rail endpoints
    const lBot = { x: a.x + px * railSpacing, y: a.y + py * railSpacing };
    const lTop = { x: b.x + px * railSpacing, y: b.y + py * railSpacing };
    const rBot = { x: a.x - px * railSpacing, y: a.y - py * railSpacing };
    const rTop = { x: b.x - px * railSpacing, y: b.y - py * railSpacing };

    // Rungs
    const rungCount = Math.max(3, Math.round(dist / 22));
    const rungs = [];
    for (let i = 1; i <= rungCount; i++) {
      const t = i / (rungCount + 1);
      const lx = lBot.x + (lTop.x - lBot.x) * t;
      const ly = lBot.y + (lTop.y - lBot.y) * t;
      const rx = rBot.x + (rTop.x - rBot.x) * t;
      const ry = rBot.y + (rTop.y - rBot.y) * t;
      rungs.push(
        <line key={`r-${i}`}
          x1={lx} y1={ly} x2={rx} y2={ry}
          style={{ stroke: railColor, strokeWidth: 1.5, strokeLinecap: 'round', opacity: 0.8 }}
        />
      );
    }

    return (
      <g key={`l-${from}`} style={{ pointerEvents: 'none' }}>
        {/* Shadow */}
        <line x1={lBot.x + 1} y1={lBot.y + 1} x2={lTop.x + 1} y2={lTop.y + 1}
          style={{ stroke: shadowColor, strokeWidth: 3, strokeLinecap: 'round' }} />
        <line x1={rBot.x + 1} y1={rBot.y + 1} x2={rTop.x + 1} y2={rTop.y + 1}
          style={{ stroke: shadowColor, strokeWidth: 3, strokeLinecap: 'round' }} />
        {/* Left rail */}
        <line x1={lBot.x} y1={lBot.y} x2={lTop.x} y2={lTop.y}
          className="snl-ladder"
          style={{ stroke: railDark, strokeWidth: 3 }} />
        <line x1={lBot.x} y1={lBot.y} x2={lTop.x} y2={lTop.y}
          className="snl-ladder"
          style={{ stroke: railColor, strokeWidth: 2 }} />
        {/* Right rail */}
        <line x1={rBot.x} y1={rBot.y} x2={rTop.x} y2={rTop.y}
          className="snl-ladder"
          style={{ stroke: railDark, strokeWidth: 3 }} />
        <line x1={rBot.x} y1={rBot.y} x2={rTop.x} y2={rTop.y}
          className="snl-ladder"
          style={{ stroke: railColor, strokeWidth: 2 }} />
        {/* Rungs */}
        {rungs}
      </g>
    );
  });
}

const SNAKE_COLORS = [
  { body: '#c44040', dark: '#8b1a1a', light: '#e88080', head: '#e04040', eye: '#1a0000', tongue: '#ff3030' },
  { body: '#2a9a3a', dark: '#145020', light: '#70d080', head: '#30b040', eye: '#0a1a00', tongue: '#ff3030' },
  { body: '#7a3aaa', dark: '#4a1a6a', light: '#b080d0', head: '#9040c0', eye: '#1a0020', tongue: '#ff3030' },
];

function drawSnakes() {
  return Object.entries(SNAKES).map(([from, to], idx) => {
    const headPt = squareToSVG(Number(from));
    const tailPt = squareToSVG(Number(to));
    const palette = SNAKE_COLORS[idx % SNAKE_COLORS.length];

    // Direction and perpendicular vectors
    const dx = tailPt.x - headPt.x;
    const dy = tailPt.y - headPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy; // perpendicular
    const py = ux;

    // Build sinusoidal body path using cubic beziers
    const wiggles = Math.max(3, Math.min(5, Math.round(dist / 50)));
    const segLen = 1 / wiggles;
    const baseAmp = Math.min(14, dist * 0.08);
    const sign = Number(from) % 2 === 0 ? 1 : -1;

    let bodyPath = '';
    for (let i = 0; i < wiggles; i++) {
      const t0 = i * segLen;
      const t1 = (i + 1) * segLen;
      const taper = 1 - (i / wiggles) * 0.6; // tapers toward tail
      const amp = baseAmp * taper * (i % 2 === 0 ? sign : -sign);

      const x0 = headPt.x + dx * t0;
      const y0 = headPt.y + dy * t0 + (i === 0 ? 0 : baseAmp * (1 - ((i - 1) / wiggles) * 0.6) * ((i - 1) % 2 === 0 ? sign : -sign) * (i > 0 ? 0 : 1));
      const x1 = headPt.x + dx * t1;
      const y1 = headPt.y + dy * t1;

      const cp1x = headPt.x + dx * (t0 + segLen * 0.33) + px * amp;
      const cp1y = headPt.y + dy * (t0 + segLen * 0.33) + py * amp;
      const cp2x = headPt.x + dx * (t0 + segLen * 0.66) + px * amp;
      const cp2y = headPt.y + dy * (t0 + segLen * 0.66) + py * amp;

      if (i === 0) {
        bodyPath += `M ${x0.toFixed(1)} ${y0.toFixed(1)} `;
      }
      bodyPath += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
    }

    // Tongue direction: opposite of body direction (away from tail)
    const tongueLen = 6;
    const tongueSpread = 2.5;
    const tx = headPt.x - ux * tongueLen;
    const ty = headPt.y - uy * tongueLen;
    const forkL_x = tx + px * tongueSpread - ux * 2;
    const forkL_y = ty + py * tongueSpread - uy * 2;
    const forkR_x = tx - px * tongueSpread - ux * 2;
    const forkR_y = ty - py * tongueSpread - uy * 2;

    // Tail tip
    const tailTipX = tailPt.x + ux * 4;
    const tailTipY = tailPt.y + uy * 4;

    return (
      <g key={`s-${from}`} style={{ pointerEvents: 'none' }}>
        {/* Body shadow */}
        <path
          d={bodyPath}
          className="snl-snake"
          style={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 5.5 }}
          transform="translate(1,1)"
        />
        {/* Body */}
        <path
          d={bodyPath}
          className="snl-snake"
          style={{ stroke: palette.body, strokeWidth: 4.5 }}
        />
        {/* Belly pattern (lighter dashed stripe) */}
        <path
          d={bodyPath}
          className="snl-snake"
          style={{ stroke: palette.light, strokeWidth: 1.5, strokeDasharray: '3 4', opacity: 0.5 }}
        />
        {/* Tail tip */}
        <line
          x1={tailPt.x} y1={tailPt.y}
          x2={tailTipX} y2={tailTipY}
          style={{ stroke: palette.dark, strokeWidth: 2, strokeLinecap: 'round' }}
        />
        {/* Head (wider than body) */}
        <ellipse
          cx={headPt.x} cy={headPt.y}
          rx={5.5} ry={4}
          style={{ fill: palette.head }}
          transform={`rotate(${Math.atan2(uy, ux) * 180 / Math.PI} ${headPt.x} ${headPt.y})`}
        />
        {/* Eyes */}
        <circle cx={headPt.x + px * 2} cy={headPt.y + py * 2} r="1.5" fill="#fff" />
        <circle cx={headPt.x + px * 2} cy={headPt.y + py * 2} r="0.8" fill={palette.eye} />
        <circle cx={headPt.x - px * 2} cy={headPt.y - py * 2} r="1.5" fill="#fff" />
        <circle cx={headPt.x - px * 2} cy={headPt.y - py * 2} r="0.8" fill={palette.eye} />
        {/* Forked tongue */}
        <line x1={headPt.x} y1={headPt.y} x2={tx} y2={ty}
          style={{ stroke: palette.tongue, strokeWidth: 0.8 }} />
        <line x1={tx} y1={ty} x2={forkL_x} y2={forkL_y}
          style={{ stroke: palette.tongue, strokeWidth: 0.6 }} />
        <line x1={tx} y1={ty} x2={forkR_x} y2={forkR_y}
          style={{ stroke: palette.tongue, strokeWidth: 0.6 }} />
      </g>
    );
  });
}

export default function SnakesAndLaddersGame({
  mode, onExit,
  // Online multiplayer props (optional)
  onlineState, myPlayerIndex, isMyTurn, onStateChange, matchData, playerNames: onlinePlayerNames,
  chatMessages, sendChat, onForfeit, onPlayerClick,
}) {
  const isOnline = mode === 'online';

  const [positions, setPositions] = useState(isOnline ? (onlineState?.positions || [0, 0]) : [0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(isOnline ? (matchData?.currentPlayer ?? 0) : 0);
  const [diceValue, setDiceValue] = useState(isOnline ? (onlineState?.diceValue || null) : null);
  const [gamePhase, setGamePhase] = useState(isOnline ? (matchData?.gamePhase || 'rolling') : 'rolling');
  const [winner, setWinner] = useState(isOnline ? (matchData?.winner ?? null) : null);
  const [turnCount, setTurnCount] = useState(isOnline ? (matchData?.turnCount || 0) : 0);
  const [message, setMessage] = useState(isOnline ? (onlineState?.message || '') : 'Roll the dice to begin!');
  const [moveLog, setMoveLog] = useState(isOnline ? (onlineState?.moveLog || []) : []);
  const moveLogRef = useRef(moveLog);
  useEffect(() => { moveLogRef.current = moveLog; }, [moveLog]);
  const aiTimer = useRef(null);

  // Sync from Firestore when online state changes
  useEffect(() => {
    if (!isOnline || !onlineState || !matchData) return;
    setPositions(onlineState.positions || [0, 0]);
    setDiceValue(onlineState.diceValue || null);
    setMessage(onlineState.message || '');
    setMoveLog(onlineState.moveLog || []);
    setCurrentPlayer(matchData.currentPlayer ?? 0);
    setGamePhase(matchData.gamePhase || 'rolling');
    setWinner(matchData.winner ?? null);
    setTurnCount(matchData.turnCount || 0);
  }, [isOnline, onlineState, matchData]);

  const isAI = mode === 'ai';

  const resetGame = useCallback(() => {
    setPositions([0, 0]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the dice to begin!');
    setMoveLog([]);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const applyMove = useCallback((player, roll, pNames) => {
    setPositions(prev => {
      const newPos = [...prev];
      const name = pNames[player];
      let dest = newPos[player] + roll;
      const currentLog = moveLogRef.current;

      if (dest > 100) {
        const msg = `${name} rolled ${roll} — overshoot!`;
        const next = player === 0 ? 1 : 0;
        const newLog = [...currentLog, msg];

        if (isOnline && onStateChange) {
          onStateChange(
            { positions: prev, diceValue: roll, message: msg, moveLog: newLog },
            { currentPlayer: next, gamePhase: 'rolling' }
          );
        } else {
          setMessage(msg);
          setMoveLog(newLog);
          setCurrentPlayer(next);
          setGamePhase('rolling');
          setTurnCount(t => t + 1);
        }
        return prev;
      }

      if (dest === 100) {
        newPos[player] = 100;
        const msg = `${name} rolled ${roll} → square 100. ${name} wins!`;
        const newLog = [...currentLog, msg];

        if (isOnline && onStateChange) {
          onStateChange(
            { positions: newPos, diceValue: roll, message: msg, moveLog: newLog },
            { currentPlayer: player, gamePhase: 'gameover', winner: player, status: 'completed', completedAt: new Date() }
          );
        } else {
          setWinner(player);
          setGamePhase('gameover');
          setMessage(msg);
          setMoveLog(newLog);
        }
        return newPos;
      }

      newPos[player] = dest;
      let msg;

      if (LADDERS[dest]) {
        const top = LADDERS[dest];
        msg = `${name} rolled ${roll} → square ${dest} — Ladder! Climbed to ${top}`;
        newPos[player] = top;
        if (top === 100) {
          const newLog = [...currentLog, msg];
          if (isOnline && onStateChange) {
            onStateChange(
              { positions: newPos, diceValue: roll, message: msg, moveLog: newLog },
              { currentPlayer: player, gamePhase: 'gameover', winner: player, status: 'completed', completedAt: new Date() }
            );
          } else {
            setWinner(player);
            setGamePhase('gameover');
            setMessage(msg);
            setMoveLog(newLog);
          }
          return newPos;
        }
      } else if (SNAKES[dest]) {
        const tail = SNAKES[dest];
        msg = `${name} rolled ${roll} → square ${dest} — Snake! Slid to ${tail}`;
        newPos[player] = tail;
      } else {
        msg = `${name} rolled ${roll} → square ${dest}`;
      }

      const next = player === 0 ? 1 : 0;
      const newLog = [...currentLog, msg];

      if (isOnline && onStateChange) {
        onStateChange(
          { positions: newPos, diceValue: roll, message: msg, moveLog: newLog },
          { currentPlayer: next, gamePhase: 'rolling' }
        );
      } else {
        setMessage(msg);
        setMoveLog(newLog);
        setCurrentPlayer(next);
        setGamePhase('rolling');
        setTurnCount(t => t + 1);
      }
      return newPos;
    });
  }, [isOnline, onStateChange]);

  const players = isOnline
    ? [{ name: onlinePlayerNames?.[0] || 'Player 1', color: PLAYERS[0].color }, { name: onlinePlayerNames?.[1] || 'Player 2', color: PLAYERS[1].color }]
    : isAI
      ? [{ name: 'You', color: PLAYERS[0].color }, { name: 'Atlas', color: PLAYERS[1].color }]
      : [{ name: 'Player 1', color: PLAYERS[0].color }, { name: 'Player 2', color: PLAYERS[1].color }];

  const playerNamesList = players.map(p => p.name);

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return;
    if (isOnline && !isMyTurn) return;
    const roll = rollD6();
    setDiceValue(roll);
    setGamePhase('animating');

    setTimeout(() => {
      applyMove(currentPlayer, roll, playerNamesList);
    }, 400);
  }, [gamePhase, winner, currentPlayer, applyMove, playerNamesList, isOnline, isMyTurn]);

  // AI auto-play
  useEffect(() => {
    if (isAI && currentPlayer === 1 && gamePhase === 'rolling' && winner === null) {
      aiTimer.current = setTimeout(() => {
        handleRoll();
      }, 700);
    }
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [isAI, currentPlayer, gamePhase, winner, handleRoll]);

  return (
    <GameShell
      gameName="Snakes & Ladders"
      players={players}
      currentPlayer={currentPlayer}
      diceResult={diceValue}
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
      diceDisplay={diceValue ? <D6Display value={diceValue} /> : null}
      extraInfo={isOnline && !isMyTurn && !winner ? "Waiting for opponent's move..." : message}
      moveLog={moveLog}
      rules={GAME_BOOK['snakes-and-ladders'].rules}
      secrets={GAME_BOOK['snakes-and-ladders'].secrets}
    >
      <svg
        className="game-board-svg"
        viewBox={`0 0 ${BOARD} ${BOARD}`}
      >
        <defs>
          <radialGradient id="snl-piece-gold" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#e8c878" />
            <stop offset="100%" stopColor="#a88832" />
          </radialGradient>
          <radialGradient id="snl-piece-steel" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#a8b8d8" />
            <stop offset="100%" stopColor="#5a6f94" />
          </radialGradient>
          <filter id="snl-snake-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="snl-ladder-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {drawBoard()}
        {drawLadders()}
        {drawSnakes()}

        {/* Pieces */}
        {positions.map((pos, i) => {
          if (pos === 0) return null;
          const { x, y } = squareToSVG(pos);
          const offset = i === 0 ? -6 : 6;
          return (
            <circle
              key={i}
              cx={x + offset}
              cy={y + offset}
              r={7}
              fill={i === 0 ? 'url(#snl-piece-gold)' : 'url(#snl-piece-steel)'}
              stroke={i === 0 ? '#a88832' : '#5a6f94'}
              strokeWidth="1.5"
              className="board-piece"
            />
          );
        })}
      </svg>
    </GameShell>
  );
}
