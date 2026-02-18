import { useState, useCallback, useMemo } from 'react';
import data from '../../data/yellowBrickRoad.json';

const { journeySequence } = data;

export default function useYellowBrickRoad() {
  const [active, setActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [stopProgress, setStopProgress] = useState({});
  const [journeyComplete, setJourneyComplete] = useState(false);

  const totalStops = 26;

  const buildDefaultProgress = useCallback(() => ({
    level: 0,
    conversations: [[], [], []],
    passed: [false, false, false],
  }), []);

  const startGame = useCallback(() => {
    setActive(true);
    setCurrentStopIndex(-1);
    setStopProgress({});
    setJourneyComplete(false);
  }, []);

  const advanceFromEarth = useCallback(() => {
    setCurrentStopIndex(0);
  }, []);

  const recordChallengeResult = useCallback((stopId, level, passed, messages) => {
    setStopProgress(prev => {
      const existing = prev[stopId] || buildDefaultProgress();
      // level is 1-based from the panel, convert to 0-based index
      const idx = level - 1;

      const nextConversations = existing.conversations.map((conv, i) =>
        i === idx ? [...conv, ...messages] : conv
      );
      const nextPassed = existing.passed.map((p, i) =>
        i === idx ? p || passed : p
      );

      return {
        ...prev,
        [stopId]: {
          ...existing,
          level: passed ? Math.max(existing.level, level) : existing.level,
          conversations: nextConversations,
          passed: nextPassed,
        },
      };
    });
  }, [buildDefaultProgress]);

  const advanceToNextStop = useCallback(() => {
    setCurrentStopIndex(prev => {
      if (prev >= 25) {
        setJourneyComplete(true);
        return 26;
      }
      return prev + 1;
    });
  }, []);

  const exitGame = useCallback(() => {
    setActive(false);
    setCurrentStopIndex(-1);
    setStopProgress({});
    setJourneyComplete(false);
  }, []);

  const isStopComplete = useCallback(stopId => {
    const progress = stopProgress[stopId];
    if (!progress) return false;
    return progress.passed.every(p => p);
  }, [stopProgress]);

  const getCurrentStop = useCallback(() => {
    if (currentStopIndex < 0 || currentStopIndex >= journeySequence.length) return null;
    return journeySequence[currentStopIndex];
  }, [currentStopIndex]);

  const completedStops = useMemo(() =>
    Object.values(stopProgress).filter(sp => sp.passed.every(p => p)).length,
    [stopProgress]
  );

  return {
    active, currentStopIndex, stopProgress, journeyComplete,
    journeySequence,
    completedStops, totalStops,
    startGame, advanceFromEarth, recordChallengeResult,
    advanceToNextStop, isStopComplete, getCurrentStop, exitGame,
  };
}
