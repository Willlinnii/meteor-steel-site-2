// Course test registry
// Maps course IDs to their test content.
// Each course's tests are keyed by section (e.g. stage ID) → array of questions.
// Question shape: { id, prompt, options: string[], correctIndices: number[] }
//
// To add tests for a new course:
//   1. Create a file in this directory (e.g. gamesTest.js)
//   2. Export an object keyed by section → question array
//   3. Import and register it here under the course ID

import { MONOMYTH_TEST } from './monomythTest';

const COURSE_TESTS = {
  'monomyth-explorer': {
    data: MONOMYTH_TEST,
    // Which element ID pattern to use when tracking completion
    elementPrefix: 'monomyth.test',
    // Maps section keys to human labels (optional, for display)
    sectionLabels: {
      'golden-age': 'Surface',
      'falling-star': 'Calling',
      'impact-crater': 'Crossing',
      'forge': 'Initiation',
      'quenching': 'Nadir',
      'integration': 'Return',
      'drawing': 'Arrival',
      'new-age': 'Renewal',
    },
  },
};

/** Get test data for a course by course ID */
export function getCourseTests(courseId) {
  return COURSE_TESTS[courseId] || null;
}

/** Get test questions for a specific section within a course */
export function getSectionQuestions(courseId, sectionId) {
  const course = COURSE_TESTS[courseId];
  if (!course) return [];
  return course.data[sectionId] || [];
}

/** Get the element ID used to track test completion for a section */
export function getTestElementId(courseId, sectionId) {
  const course = COURSE_TESTS[courseId];
  if (!course) return null;
  return `${course.elementPrefix}.${sectionId}`;
}

/** List all course IDs that have tests */
export function getCoursesWithTests() {
  return Object.keys(COURSE_TESTS);
}

export default COURSE_TESTS;
