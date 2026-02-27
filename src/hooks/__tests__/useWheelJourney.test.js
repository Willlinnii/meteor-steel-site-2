import { renderHook, act } from '@testing-library/react';
import useWheelJourney from '../useWheelJourney';

const STAGES = [
  { id: 'stage-a', label: 'Stage A' },
  { id: 'stage-b', label: 'Stage B' },
  { id: 'stage-c', label: 'Stage C' },
];

const setup = (stages = STAGES) =>
  renderHook(() => useWheelJourney('wheel-test', stages));

/* ── Initialization & Reset ── */

describe('useWheelJourney – Initialization & Reset', () => {
  test('initial state: active=false, currentStopIndex=-1, completedStops=0', () => {
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
    act(() => { result.current.advanceFromIntro(); });
    act(() => { result.current.recordResult('stage-a', true, ['msg']); });
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
    expect(result.current.journeyId).toBe('wheel-test');
  });
});

/* ── Navigation ── */

describe('useWheelJourney – Navigation', () => {
  test('advanceFromIntro sets currentStopIndex to 0', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    expect(result.current.currentStopIndex).toBe(0);
  });

  test('advanceToNext increments index', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
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
    expect(result.current.currentStopIndex).toBe(3);
  });

  test('single-stop journey completes from stop 0', () => {
    const { result } = setup([{ id: 'solo', label: 'Solo' }]);
    act(() => { result.current.startGame(); });
    act(() => { result.current.advanceFromIntro(); });
    act(() => { result.current.advanceToNext(); });
    expect(result.current.journeyComplete).toBe(true);
    expect(result.current.currentStopIndex).toBe(1);
  });
});

/* ── recordResult ── */

describe('useWheelJourney – recordResult', () => {
  test('creates default progress for new stageId ({conversations: [], passed: false})', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', false, ['attempt']); });
    const prog = result.current.stopProgress['stage-a'];
    expect(prog).toBeDefined();
    expect(prog.passed).toBe(false);
    expect(prog.conversations).toEqual(['attempt']);
  });

  test('records pass (passed=true, messages stored)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', true, ['answer']); });
    const prog = result.current.stopProgress['stage-a'];
    expect(prog.passed).toBe(true);
    expect(prog.conversations).toEqual(['answer']);
  });

  test('records failure (messages stored, passed stays false)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', false, ['wrong']); });
    const prog = result.current.stopProgress['stage-a'];
    expect(prog.passed).toBe(false);
    expect(prog.conversations).toEqual(['wrong']);
  });

  test('pass is idempotent (once true, stays true)', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', true, ['first']); });
    act(() => { result.current.recordResult('stage-a', false, ['second']); });
    const prog = result.current.stopProgress['stage-a'];
    expect(prog.passed).toBe(true); // OR preserves the first true
    expect(prog.conversations).toEqual(['first', 'second']);
  });

  test('messages accumulate across calls', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', false, ['m1', 'm2']); });
    act(() => { result.current.recordResult('stage-a', false, ['m3']); });
    expect(result.current.stopProgress['stage-a'].conversations).toEqual(['m1', 'm2', 'm3']);
  });
});

/* ── Completion Checks ── */

describe('useWheelJourney – Completion Checks', () => {
  test('isStopComplete returns false for unknown stageId', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    expect(result.current.isStopComplete('nonexistent')).toBe(false);
  });

  test('isStopComplete returns true when passed=true', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', true, ['ok']); });
    expect(result.current.isStopComplete('stage-a')).toBe(true);
  });

  test('completedStops counts passed stops', () => {
    const { result } = setup();
    act(() => { result.current.startGame(); });
    act(() => { result.current.recordResult('stage-a', true, ['ok']); });
    act(() => { result.current.recordResult('stage-b', false, ['no']); });
    act(() => { result.current.recordResult('stage-c', true, ['ok']); });
    expect(result.current.completedStops).toBe(2);
  });
});
