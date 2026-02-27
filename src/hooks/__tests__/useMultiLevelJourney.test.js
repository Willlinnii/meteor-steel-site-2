import { renderHook, act } from '@testing-library/react';
import useMultiLevelJourney from '../useMultiLevelJourney';

const STAGES = [
  { id: 'stop-a', label: 'Stop A' },
  { id: 'stop-b', label: 'Stop B' },
  { id: 'stop-c', label: 'Stop C' },
];
const LEVELS = 3;

const setup = (stages = STAGES, levels = LEVELS) =>
  renderHook(() => useMultiLevelJourney('test-journey', stages, levels));

/* ── Initialization & Reset ── */

describe('useMultiLevelJourney – Initialization & Reset', () => {
  test('initial state: active=false, currentStopIndex=-1, journeyComplete=false, completedStops=0', () => {
    const { result } = setup();
    expect(result.current.active).toBe(false);
    expect(result.current.currentStopIndex).toBe(-1);
    expect(result.current.journeyComplete).toBe(false);
    expect(result.current.completedStops).toBe(0);
  });

  test('startGame sets active=true and resets state', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    expect(result.current.active).toBe(true);
    expect(result.current.currentStopIndex).toBe(-1);
    expect(result.current.journeyComplete).toBe(false);
  });

  test('exitGame resets all state back to initial', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    act(() => { result.current.exitGame(); });
    expect(result.current.active).toBe(false);
    expect(result.current.currentStopIndex).toBe(-1);
    expect(result.current.journeyComplete).toBe(false);
    expect(result.current.completedStops).toBe(0);
  });

  test('totalStops matches stages.length', () => {
    const { result } = setup();
    expect(result.current.totalStops).toBe(3);
  });

  test('journeyId is passed through', () => {
    const { result } = setup();
    expect(result.current.journeyId).toBe('test-journey');
  });
});

/* ── Navigation ── */

describe('useMultiLevelJourney – Navigation', () => {
  test('advanceFromIntro sets currentStopIndex to 0', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    expect(result.current.currentStopIndex).toBe(0);
  });

  test('advanceToNext increments currentStopIndex (0→1→2)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    expect(result.current.currentStopIndex).toBe(0);
    act(() => { result.current.advanceToNext(); });
    expect(result.current.currentStopIndex).toBe(1);
    act(() => { result.current.advanceToNext(); });
    expect(result.current.currentStopIndex).toBe(2);
  });

  test('advanceToNext at last stop sets journeyComplete=true', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    act(() => { result.current.advanceToNext(); }); // 1
    act(() => { result.current.advanceToNext(); }); // 2 (last)
    act(() => { result.current.advanceToNext(); }); // past last
    expect(result.current.journeyComplete).toBe(true);
  });

  test('advanceToNext at last stop sets currentStopIndex to totalStops', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    act(() => { result.current.advanceToNext(); });
    act(() => { result.current.advanceToNext(); });
    act(() => { result.current.advanceToNext(); });
    expect(result.current.currentStopIndex).toBe(3); // totalStops
  });

  test('advanceToNext with single-stop journey completes immediately from stop 0', () => {
    const { result } = setup([{ id: 'only', label: 'Only Stop' }]);
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    expect(result.current.currentStopIndex).toBe(0);
    act(() => { result.current.advanceToNext(); });
    expect(result.current.journeyComplete).toBe(true);
    expect(result.current.currentStopIndex).toBe(1);
  });
});

/* ── recordResult ── */

describe('useMultiLevelJourney – recordResult', () => {
  test('creates default progress for unknown stopId (level=0, empty conversations, all false)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, false, ['msg1']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog).toBeDefined();
    expect(prog.level).toBe(0); // failed, so level stays 0
    expect(prog.passed).toEqual([false, false, false]);
  });

  test('records pass at level 1 (updates passed[0], level=1)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['answer']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog.passed[0]).toBe(true);
    expect(prog.passed[1]).toBe(false);
    expect(prog.passed[2]).toBe(false);
    expect(prog.level).toBe(1);
  });

  test('records pass at level 2 after level 1 (updates passed[1], level=2)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['a1']); });
    act(() => { result.current.recordResult('stop-a', 2, true, ['a2']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog.passed[0]).toBe(true);
    expect(prog.passed[1]).toBe(true);
    expect(prog.passed[2]).toBe(false);
    expect(prog.level).toBe(2);
  });

  test('records failure (messages append, passed stays false, level unchanged)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, false, ['fail1']); });
    act(() => { result.current.recordResult('stop-a', 1, false, ['fail2']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog.passed[0]).toBe(false);
    expect(prog.level).toBe(0);
    expect(prog.conversations[0]).toEqual(['fail1', 'fail2']);
  });

  test('pass is idempotent (passing same level twice keeps state consistent)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['first']); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['second']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog.passed[0]).toBe(true);
    expect(prog.level).toBe(1);
    expect(prog.conversations[0]).toEqual(['first', 'second']);
  });

  test('messages accumulate across multiple calls to same stop/level', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 2, false, ['m1', 'm2']); });
    act(() => { result.current.recordResult('stop-a', 2, false, ['m3']); });
    const prog = result.current.stopProgress['stop-a'];
    expect(prog.conversations[1]).toEqual(['m1', 'm2', 'm3']);
  });

  test('level tracks max (passing level 3 then level 1 keeps level=3)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 3, true, ['lv3']); });
    expect(result.current.stopProgress['stop-a'].level).toBe(3);
    act(() => { result.current.recordResult('stop-a', 1, true, ['lv1']); });
    expect(result.current.stopProgress['stop-a'].level).toBe(3);
  });
});

/* ── Completion Checks ── */

describe('useMultiLevelJourney – Completion Checks', () => {
  test('isStopComplete returns false for unknown stopId', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    expect(result.current.isStopComplete('nonexistent')).toBe(false);
  });

  test('isStopComplete returns false when some levels not passed', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 2, true, ['ok']); });
    // level 3 not passed
    expect(result.current.isStopComplete('stop-a')).toBe(false);
  });

  test('isStopComplete returns true when ALL levels passed', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stop-a', 1, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 2, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 3, true, ['ok']); });
    expect(result.current.isStopComplete('stop-a')).toBe(true);
  });

  test('completedStops counts only fully-complete stops', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    // Complete stop-a (all 3 levels)
    act(() => { result.current.recordResult('stop-a', 1, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 2, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 3, true, ['ok']); });
    // Partially complete stop-b (only level 1)
    act(() => { result.current.recordResult('stop-b', 1, true, ['ok']); });
    expect(result.current.completedStops).toBe(1);
  });

  test('completedStops updates as stops are completed', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    expect(result.current.completedStops).toBe(0);

    // Complete stop-a
    act(() => { result.current.recordResult('stop-a', 1, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 2, true, ['ok']); });
    act(() => { result.current.recordResult('stop-a', 3, true, ['ok']); });
    expect(result.current.completedStops).toBe(1);

    // Complete stop-b
    act(() => { result.current.recordResult('stop-b', 1, true, ['ok']); });
    act(() => { result.current.recordResult('stop-b', 2, true, ['ok']); });
    act(() => { result.current.recordResult('stop-b', 3, true, ['ok']); });
    expect(result.current.completedStops).toBe(2);
  });
});
