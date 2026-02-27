import { renderHook, act } from '@testing-library/react';
import useYellowBrickRoad from '../../components/chronosphaera/useYellowBrickRoad';

const setup = () => renderHook(() => useYellowBrickRoad());

/* ── Data Integrity ── */

describe('useYellowBrickRoad – Data Integrity', () => {
  test('totalStops is 26', () => {
    const { result } = setup();
    expect(result.current.totalStops).toBe(26);
  });

  test('journeySequence has 26 items', () => {
    const { result } = setup();
    expect(result.current.journeySequence).toHaveLength(26);
  });

  test('each stop in journeySequence has id, entity, type, phase', () => {
    const { result } = setup();
    result.current.journeySequence.forEach((stop, i) => {
      expect(stop).toHaveProperty('id');
      expect(stop).toHaveProperty('entity');
      expect(stop).toHaveProperty('type');
      expect(stop).toHaveProperty('phase');
    });
  });
});

/* ── Initialization & Reset ── */

describe('useYellowBrickRoad – Initialization & Reset', () => {
  test('initial state: active=false, currentStopIndex=-1', () => {
    const { result } = setup();
    expect(result.current.active).toBe(false);
    expect(result.current.currentStopIndex).toBe(-1);
    expect(result.current.journeyComplete).toBe(false);
    expect(result.current.completedStops).toBe(0);
  });

  test('startGame sets active=true', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    expect(result.current.active).toBe(true);
    expect(result.current.currentStopIndex).toBe(-1);
  });

  test('exitGame resets all state', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    act(() => { result.current.exitGame(); });
    expect(result.current.active).toBe(false);
    expect(result.current.currentStopIndex).toBe(-1);
    expect(result.current.journeyComplete).toBe(false);
    expect(result.current.completedStops).toBe(0);
  });
});

/* ── Navigation ── */

describe('useYellowBrickRoad – Navigation', () => {
  test('advanceFromEarth sets currentStopIndex to 0', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    expect(result.current.currentStopIndex).toBe(0);
  });

  test('advanceToNextStop increments index', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    act(() => { result.current.advanceToNextStop(); });
    expect(result.current.currentStopIndex).toBe(1);
    act(() => { result.current.advanceToNextStop(); });
    expect(result.current.currentStopIndex).toBe(2);
  });

  test('advanceToNextStop at stop 25 sets journeyComplete=true and index=26', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    // Advance to stop 25 (the last)
    for (let i = 0; i < 25; i++) {
      act(() => { result.current.advanceToNextStop(); });
    }
    expect(result.current.currentStopIndex).toBe(25);
    expect(result.current.journeyComplete).toBe(false);
    // Advance past last
    act(() => { result.current.advanceToNextStop(); });
    expect(result.current.journeyComplete).toBe(true);
    expect(result.current.currentStopIndex).toBe(26);
  });

  test('getCurrentStop returns correct stop object for valid index', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    const stop = result.current.getCurrentStop();
    expect(stop).toBeDefined();
    expect(stop.id).toBe('moon-ascending');
    expect(stop.entity).toBe('Moon');
  });
});

/* ── getCurrentStop ── */

describe('useYellowBrickRoad – getCurrentStop', () => {
  test('returns null when currentStopIndex=-1 (pre-start)', () => {
    const { result } = setup();
    expect(result.current.getCurrentStop()).toBeNull();
  });

  test('returns null when currentStopIndex >= 26 (past end)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    for (let i = 0; i < 26; i++) {
      act(() => { result.current.advanceToNextStop(); });
    }
    expect(result.current.currentStopIndex).toBe(26);
    expect(result.current.getCurrentStop()).toBeNull();
  });

  test('returns the correct journeySequence entry for valid index', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromEarth(); });
    act(() => { result.current.advanceToNextStop(); }); // index 1
    const stop = result.current.getCurrentStop();
    expect(stop.id).toBe('mercury-ascending');
    expect(stop.type).toBe('planet');
  });
});

/* ── recordChallengeResult & Completion ── */

describe('useYellowBrickRoad – recordChallengeResult & Completion', () => {
  test('records multi-level progress (3-level default structure)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordChallengeResult('moon-ascending', 1, true, ['answer']); });
    const prog = result.current.stopProgress['moon-ascending'];
    expect(prog.passed).toEqual([true, false, false]);
    expect(prog.level).toBe(1);
    expect(prog.conversations[0]).toEqual(['answer']);
  });

  test('isStopComplete requires all 3 levels passed', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordChallengeResult('moon-ascending', 1, true, ['a']); });
    act(() => { result.current.recordChallengeResult('moon-ascending', 2, true, ['b']); });
    expect(result.current.isStopComplete('moon-ascending')).toBe(false);
    act(() => { result.current.recordChallengeResult('moon-ascending', 3, true, ['c']); });
    expect(result.current.isStopComplete('moon-ascending')).toBe(true);
  });

  test('completedStops counts fully-complete stops', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    // Complete moon-ascending
    act(() => { result.current.recordChallengeResult('moon-ascending', 1, true, ['a']); });
    act(() => { result.current.recordChallengeResult('moon-ascending', 2, true, ['b']); });
    act(() => { result.current.recordChallengeResult('moon-ascending', 3, true, ['c']); });
    // Partially complete mercury-ascending
    act(() => { result.current.recordChallengeResult('mercury-ascending', 1, true, ['a']); });
    expect(result.current.completedStops).toBe(1);
  });
});
