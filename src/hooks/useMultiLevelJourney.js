import { useState, useCallback, useMemo } from 'react';

/**
 * Generic multi-level journey hook.
 * Generalises useYellowBrickRoad (hardcoded 26 stops, 3 levels) to accept
 * arbitrary `stages` array and `levelsPerStop`.
 *
 * Returns the same interface shape as useCosmicAdapter() so
 * OuroborosJourneyPage can swap hooks transparently.
 */
export default function useMultiLevelJourney(journeyId, stages, levelsPerStop = 3) {
  const [active, setActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [stopProgress, setStopProgress] = useState({});
  const [journeyComplete, setJourneyComplete] = useState(false);

  const totalStops = stages.length;

  const buildDefaultProgress = useCallback(() => ({
    level: 0,
    conversations: Array.from({ length: levelsPerStop }, () => []),
    passed: Array.from({ length: levelsPerStop }, () => false),
  }), [levelsPerStop]);

  const startGame = useCallback(() => {
    setActive(true);
    setCurrentStopIndex(-1);
    setStopProgress({});
    setJourneyComplete(false);
  }, []);

  const advanceFromIntro = useCallback(() => {
    setCurrentStopIndex(0);
  }, []);

  const recordResult = useCallback((stopId, level, passed, messages) => {
    setStopProgress(prev => {
      const existing = prev[stopId] || buildDefaultProgress();
      const idx = level - 1; // level is 1-based

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

  const advanceToNext = useCallback(() => {
    setCurrentStopIndex(prev => {
      if (prev >= totalStops - 1) {
        setJourneyComplete(true);
        return totalStops;
      }
      return prev + 1;
    });
  }, [totalStops]);

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

  const completedStops = useMemo(() =>
    Object.values(stopProgress).filter(sp => sp.passed.every(p => p)).length,
    [stopProgress]
  );

  return {
    active, currentStopIndex, stopProgress, journeyComplete,
    stages, journeyId,
    completedStops, totalStops,
    startGame, advanceFromIntro, recordResult,
    advanceToNext, isStopComplete, exitGame,
  };
}
