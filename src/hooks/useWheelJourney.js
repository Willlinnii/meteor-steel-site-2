import { useState, useCallback, useMemo } from 'react';

export default function useWheelJourney(journeyId, stages) {
  const [active, setActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [stopProgress, setStopProgress] = useState({});
  const [journeyComplete, setJourneyComplete] = useState(false);

  const totalStops = stages.length;

  const startGame = useCallback(() => {
    setActive(true);
    setCurrentStopIndex(-1);
    setStopProgress({});
    setJourneyComplete(false);
  }, []);

  const advanceFromIntro = useCallback(() => {
    setCurrentStopIndex(0);
  }, []);

  const recordResult = useCallback((stageId, passed, messages) => {
    setStopProgress(prev => {
      const existing = prev[stageId] || { conversations: [], passed: false };
      return {
        ...prev,
        [stageId]: {
          conversations: [...existing.conversations, ...messages],
          passed: existing.passed || passed,
        },
      };
    });
  }, []);

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

  const isStopComplete = useCallback(stageId => {
    return !!stopProgress[stageId]?.passed;
  }, [stopProgress]);

  const completedStops = useMemo(() =>
    Object.values(stopProgress).filter(sp => sp.passed).length,
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
