import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
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
    const dx = 3;
    return (
      <g key={`l-${from}`}>
        <line x1={a.x - dx} y1={a.y} x2={b.x - dx} y2={b.y} className="snl-ladder" />
        <line x1={a.x + dx} y1={a.y} x2={b.x + dx} y2={b.y} className="snl-ladder" />
        {Array.from({ length: Math.floor(Math.abs(b.y - a.y) / 20) }, (_, i) => {
          const t = (i + 1) / (Math.floor(Math.abs(b.y - a.y) / 20) + 1);
          const rx = a.x - dx + (b.x - dx - a.x + dx) * t;
          const ry = a.y + (b.y - a.y) * t;
          const rx2 = a.x + dx + (b.x + dx - a.x - dx) * t;
          return (
            <line key={i} x1={rx} y1={ry} x2={rx2} y2={ry} className="snl-ladder-rung" />
          );
        })}
      </g>
    );
  });
}

function drawSnakes() {
  return Object.entries(SNAKES).map(([from, to]) => {
    const a = squareToSVG(Number(from));
    const b = squareToSVG(Number(to));
    const midX = (a.x + b.x) / 2 + (Math.random() > 0.5 ? 20 : -20);
    const midY = (a.y + b.y) / 2;
    return (
      <g key={`s-${from}`}>
        <path
          d={`M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`}
          className="snl-snake"
        />
        <circle cx={a.x} cy={a.y} r="3" className="snl-snake-head" />
      </g>
    );
  });
}

export default function SnakesAndLaddersGame({ mode, onExit }) {
  const [positions, setPositions] = useState([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling'); // rolling | animating | gameover
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the dice to begin!');
  const [moveLog, setMoveLog] = useState([]);
  const aiTimer = useRef(null);

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

      if (dest > 100) {
        const msg = `${name} rolled ${roll} — overshoot!`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
        const next = player === 0 ? 1 : 0;
        setCurrentPlayer(next);
        setGamePhase('rolling');
        setTurnCount(t => t + 1);
        return prev;
      }

      if (dest === 100) {
        newPos[player] = 100;
        setWinner(player);
        setGamePhase('gameover');
        const msg = `${name} rolled ${roll} → square 100. ${name} wins!`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
        return newPos;
      }

      newPos[player] = dest;

      if (LADDERS[dest]) {
        const top = LADDERS[dest];
        const msg = `${name} rolled ${roll} → square ${dest} — Ladder! Climbed to ${top}`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
        newPos[player] = top;
        if (top === 100) {
          setWinner(player);
          setGamePhase('gameover');
          return newPos;
        }
      } else if (SNAKES[dest]) {
        const tail = SNAKES[dest];
        const msg = `${name} rolled ${roll} → square ${dest} — Snake! Slid to ${tail}`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
        newPos[player] = tail;
      } else {
        const msg = `${name} rolled ${roll} → square ${dest}`;
        setMessage(msg);
        setMoveLog(log => [...log, msg]);
      }

      const next = player === 0 ? 1 : 0;
      setCurrentPlayer(next);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      return newPos;
    });
  }, []);

  const players = isAI
    ? [{ name: 'You', color: PLAYERS[0].color }, { name: 'Atlas', color: PLAYERS[1].color }]
    : [{ name: 'Player 1', color: PLAYERS[0].color }, { name: 'Player 2', color: PLAYERS[1].color }];

  const playerNamesList = players.map(p => p.name);

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return;
    const roll = rollD6();
    setDiceValue(roll);
    setGamePhase('animating');

    setTimeout(() => {
      applyMove(currentPlayer, roll, playerNamesList);
    }, 400);
  }, [gamePhase, winner, currentPlayer, applyMove, playerNamesList]);

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
      onRoll={handleRoll}
      onRestart={resetGame}
      onExit={onExit}
      diceDisplay={diceValue ? <D6Display value={diceValue} /> : null}
      extraInfo={message}
      moveLog={moveLog}
      rules={GAME_BOOK['snakes-and-ladders'].rules}
      secrets={GAME_BOOK['snakes-and-ladders'].secrets}
    >
      <svg
        className="game-board-svg"
        viewBox={`0 0 ${BOARD} ${BOARD}`}
        style={{ maxWidth: 520 }}
      >
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
              fill={PLAYERS[i].color}
              stroke="var(--bg-dark)"
              strokeWidth="1.5"
              className="board-piece"
            />
          );
        })}
      </svg>
    </GameShell>
  );
}
