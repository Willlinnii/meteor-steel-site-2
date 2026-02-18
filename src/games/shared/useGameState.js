import { useState, useCallback, useRef } from 'react';

// Shared hook for turn-based game flow
// gamePhase: 'rolling' | 'moving' | 'animating' | 'gameover'
export default function useGameState({ rollFn, onRoll, onMove, checkWin, isAI }) {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gamePhase, setGamePhase] = useState('rolling');
  const [diceResult, setDiceResult] = useState(null);
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [extraTurn, setExtraTurn] = useState(false);
  const aiTimerRef = useRef(null);

  const rollDice = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return null;
    const result = rollFn();
    setDiceResult(result);
    setGamePhase('moving');
    if (onRoll) onRoll(result, currentPlayer);
    return result;
  }, [gamePhase, winner, rollFn, onRoll, currentPlayer]);

  const endTurn = useCallback((hasExtraTurn = false) => {
    setTurnCount(t => t + 1);
    if (hasExtraTurn) {
      setExtraTurn(true);
      setGamePhase('rolling');
      return;
    }
    setExtraTurn(false);
    const nextPlayer = currentPlayer === 0 ? 1 : 0;
    setCurrentPlayer(nextPlayer);
    setGamePhase('rolling');
    setDiceResult(null);
  }, [currentPlayer]);

  const setGameOver = useCallback((winnerIdx) => {
    setWinner(winnerIdx);
    setGamePhase('gameover');
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    setCurrentPlayer(0);
    setGamePhase('rolling');
    setDiceResult(null);
    setWinner(null);
    setTurnCount(0);
    setExtraTurn(false);
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
  }, []);

  return {
    currentPlayer,
    setCurrentPlayer,
    gamePhase,
    setGamePhase,
    diceResult,
    setDiceResult,
    winner,
    setWinner: setGameOver,
    turnCount,
    extraTurn,
    rollDice,
    endTurn,
    resetGame,
    aiTimerRef,
  };
}
