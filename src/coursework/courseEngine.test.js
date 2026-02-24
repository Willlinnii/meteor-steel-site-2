import {
  COURSES,
  checkRequirement,
  requirementProgress,
  checkCourseCompletion,
  courseProgress,
  getIncompleteRequirements,
  getAllTrackedElements,
  getActiveCourses,
} from './courseEngine';

// ── Helper: build a progress map with elements marked as visited ──
function makeProgress(elementIds) {
  const progress = {};
  for (const eid of elementIds) {
    const section = eid.split('.')[0];
    if (!progress[section]) progress[section] = { elements: {} };
    progress[section].elements[eid] = { visited: true, count: 1, timeSpent: 30 };
  }
  return progress;
}

// ════════════════════════════════════════════════════════════════
// COURSES data integrity
// ════════════════════════════════════════════════════════════════
describe('COURSES data integrity', () => {
  test('every course has a unique id', () => {
    const ids = COURSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every course has a name, description, and at least one requirement', () => {
    for (const c of COURSES) {
      expect(c.name).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.requirements.length).toBeGreaterThan(0);
    }
  });

  test('every requirement has a valid type', () => {
    const validTypes = ['element', 'count', 'time', 'group_all', 'group_pct', 'atlas'];
    for (const c of COURSES) {
      for (const r of c.requirements) {
        expect(validTypes).toContain(r.type);
      }
    }
  });

  test('every requirement has an id and description', () => {
    for (const c of COURSES) {
      for (const r of c.requirements) {
        expect(r.id).toBeTruthy();
        expect(r.description).toBeTruthy();
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════
// checkRequirement
// ════════════════════════════════════════════════════════════════
describe('checkRequirement', () => {
  test('element — true when element exists', () => {
    const req = { type: 'element', element: 'chronosphaera.calendar.opened' };
    const progress = makeProgress(['chronosphaera.calendar.opened']);
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('element — false when element missing', () => {
    const req = { type: 'element', element: 'chronosphaera.calendar.opened' };
    expect(checkRequirement(req, {})).toBe(false);
  });

  test('count — true when count meets threshold', () => {
    const req = { type: 'count', element: 'atlas.messages.total', threshold: 20 };
    const progress = { atlas: { elements: { 'atlas.messages.total': { count: 25 } } } };
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('count — false when count below threshold', () => {
    const req = { type: 'count', element: 'atlas.messages.total', threshold: 20 };
    const progress = { atlas: { elements: { 'atlas.messages.total': { count: 5 } } } };
    expect(checkRequirement(req, progress)).toBe(false);
  });

  test('time — true when timeSpent meets threshold', () => {
    const req = { type: 'time', element: 'fallen-starlight.chapter.forge', threshold: 15 };
    const progress = { 'fallen-starlight': { elements: { 'fallen-starlight.chapter.forge': { timeSpent: 20 } } } };
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('time — false when timeSpent below threshold', () => {
    const req = { type: 'time', element: 'fallen-starlight.chapter.forge', threshold: 15 };
    const progress = { 'fallen-starlight': { elements: { 'fallen-starlight.chapter.forge': { timeSpent: 5 } } } };
    expect(checkRequirement(req, progress)).toBe(false);
  });

  test('group_all — true when all elements present', () => {
    const req = { type: 'group_all', elements: ['games.senet.completed', 'games.ur.completed'] };
    const progress = makeProgress(['games.senet.completed', 'games.ur.completed']);
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('group_all — false when one element missing', () => {
    const req = { type: 'group_all', elements: ['games.senet.completed', 'games.ur.completed'] };
    const progress = makeProgress(['games.senet.completed']);
    expect(checkRequirement(req, progress)).toBe(false);
  });

  test('group_pct — true when percent met', () => {
    const req = { type: 'group_pct', percent: 50, elements: ['a.b', 'a.c', 'a.d', 'a.e'] };
    const progress = makeProgress(['a.b', 'a.c']);
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('group_pct — false when percent not met', () => {
    const req = { type: 'group_pct', percent: 50, elements: ['a.b', 'a.c', 'a.d', 'a.e'] };
    const progress = makeProgress(['a.b']);
    expect(checkRequirement(req, progress)).toBe(false);
  });

  test('atlas — true when page messages meet threshold', () => {
    const req = { type: 'atlas', page: 'games', threshold: 10 };
    const progress = { atlas: { elements: { 'atlas.messages.games': { count: 12 } } } };
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('atlas — true when voice messages meet threshold', () => {
    const req = { type: 'atlas', voice: 'saturn', threshold: 5 };
    const progress = { atlas: { elements: { 'atlas.messages.voice.saturn': { count: 7 } } } };
    expect(checkRequirement(req, progress)).toBe(true);
  });

  test('unknown type returns false', () => {
    const req = { type: 'nonexistent' };
    expect(checkRequirement(req, {})).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// requirementProgress
// ════════════════════════════════════════════════════════════════
describe('requirementProgress', () => {
  test('element — returns 1 when present, 0 when absent', () => {
    const req = { type: 'element', element: 'chronosphaera.calendar.opened' };
    expect(requirementProgress(req, {})).toBe(0);
    expect(requirementProgress(req, makeProgress(['chronosphaera.calendar.opened']))).toBe(1);
  });

  test('count — returns fractional progress capped at 1', () => {
    const req = { type: 'count', element: 'atlas.messages.total', threshold: 20 };
    const half = { atlas: { elements: { 'atlas.messages.total': { count: 10 } } } };
    const over = { atlas: { elements: { 'atlas.messages.total': { count: 50 } } } };
    expect(requirementProgress(req, half)).toBeCloseTo(0.5);
    expect(requirementProgress(req, over)).toBe(1);
  });

  test('group_all — returns fraction of elements found', () => {
    const req = { type: 'group_all', elements: ['a.x', 'a.y', 'a.z'] };
    expect(requirementProgress(req, makeProgress(['a.x']))).toBeCloseTo(1 / 3);
    expect(requirementProgress(req, makeProgress(['a.x', 'a.y', 'a.z']))).toBe(1);
  });

  test('unknown type returns 0', () => {
    expect(requirementProgress({ type: 'bogus' }, {})).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// Course-level helpers
// ════════════════════════════════════════════════════════════════
describe('course-level helpers', () => {
  const simpleCourse = {
    id: 'test',
    requirements: [
      { type: 'element', element: 'test.a' },
      { type: 'element', element: 'test.b' },
    ],
  };

  test('checkCourseCompletion — true when all requirements met', () => {
    const progress = makeProgress(['test.a', 'test.b']);
    expect(checkCourseCompletion(simpleCourse, progress)).toBe(true);
  });

  test('checkCourseCompletion — false when any requirement unmet', () => {
    const progress = makeProgress(['test.a']);
    expect(checkCourseCompletion(simpleCourse, progress)).toBe(false);
  });

  test('courseProgress — returns average of requirement progress', () => {
    const progress = makeProgress(['test.a']);
    expect(courseProgress(simpleCourse, progress)).toBeCloseTo(0.5);
  });

  test('courseProgress — returns 1 for course with no requirements', () => {
    expect(courseProgress({ requirements: [] }, {})).toBe(1);
  });

  test('getIncompleteRequirements — returns only unmet requirements with progress', () => {
    const progress = makeProgress(['test.a']);
    const incomplete = getIncompleteRequirements(simpleCourse, progress);
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].element).toBe('test.b');
    expect(incomplete[0].progress).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// Utility functions
// ════════════════════════════════════════════════════════════════
describe('utility functions', () => {
  test('getAllTrackedElements — collects all element IDs', () => {
    const progress = makeProgress(['games.senet.completed', 'monomyth.overview.golden-age']);
    const elements = getAllTrackedElements(progress);
    expect(elements.size).toBe(2);
    expect(elements.has('games.senet.completed')).toBe(true);
    expect(elements.has('monomyth.overview.golden-age')).toBe(true);
  });

  test('getAllTrackedElements — returns empty set for empty progress', () => {
    expect(getAllTrackedElements({}).size).toBe(0);
  });

  test('getActiveCourses — returns only active courses', () => {
    const active = getActiveCourses();
    expect(active.length).toBeGreaterThan(0);
    expect(active.every(c => c.active)).toBe(true);
  });
});
