// Course definitions and completion engine
// Courses are defined here and can be managed via admin.
// Each course has requirements that reference tracked element IDs.

// Requirement types:
//   'element'     — specific element must be visited/completed
//   'count'       — element pattern must reach a count threshold
//   'time'        — element pattern must reach a time threshold (seconds)
//   'group_all'   — all elements matching a pattern must be visited
//   'group_pct'   — X% of elements matching a pattern must be visited
//   'atlas'       — atlas message count for a page/voice must reach threshold

// Element ID convention:
//   section.subsection.stage.item  (dot-separated path)
//   Examples:
//     monomyth.overview.golden-age
//     monomyth.theorists.forge.campbell
//     games.senet.started
//     games.senet.completed
//     chronosphaera.sun.overview
//     atlas.messages.monomyth (page-based)
//     atlas.messages.voice.saturn (voice-based)

const ALL_STAGES = ['golden-age', 'falling-star', 'impact-crater', 'forge', 'quenching', 'integration', 'drawing', 'new-age'];
const MONOMYTH_TABS = ['overview', 'cycles', 'theorists', 'history', 'myths', 'films'];
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CARDINAL_POINTS = ['vernal-equinox', 'summer-solstice', 'autumnal-equinox', 'winter-solstice'];
const ANCIENT_GAMES = ['snakes-ladders', 'senet', 'ur', 'mehen', 'jackals-hounds', 'pachisi'];
const MYTHOLOGY_SHOWS = [
  'myths-tv', 'myth-salon', 'mythosophia', 'deep-sight', 'journey-of-the-goddess',
  'transformational-narrative', 'dennis-slattery', 'lionel-corbett', 'myth-is-all-around-us',
  'scholar-talks', 'mastery-circle', 'mythology-classroom', 'the-tao', 'pulling-focus', 'climate-journey',
];

export const COURSES = [
  // ── Monomyth ──
  {
    id: 'monomyth-explorer',
    name: 'Monomyth Explorer',
    description: 'Master the Monomyth — explore every tab, pass all stage quizzes, and walk the Yellow Brick Road.',
    active: true,
    page: '/monomyth',
    tests: {
      source: 'monomyth-explorer',   // key into COURSE_TESTS registry
      sections: ALL_STAGES,           // which sections have tests
      elementPrefix: 'monomyth.test', // element ID pattern for tracking
    },
    requirements: [
      {
        id: 'all-tabs-all-stages',
        type: 'group_all',
        elements: MONOMYTH_TABS.flatMap(t => ALL_STAGES.map(s => `monomyth.${t}.${s}`)),
        description: 'Visit every content tab for every stage (Overview, Cycles, Theorists, History, Myths, Films)',
      },
      {
        id: 'complete-all-quizzes',
        type: 'group_all',
        elements: ALL_STAGES.map(s => `monomyth.test.${s}`),
        description: 'Complete the quiz for every stage',
      },
      {
        id: 'complete-journey',
        type: 'group_pct',
        percent: 50,
        elements: ['journeys.monomyth.completed', 'journeys.fused.completed'],
        description: 'Complete a Monomyth or Fused Ouroboros Journey',
      },
    ],
  },

  // ── Games ──
  {
    id: 'mythic-gamer',
    name: 'Mythic Gamer',
    description: 'Play all the mythic board games from around the world and engage with the Game Room.',
    active: true,
    requirements: [
      {
        id: 'play-ancient-games',
        type: 'group_all',
        elements: ANCIENT_GAMES.map(g => `games.${g}.completed`),
        description: 'Complete all six ancient board games',
      },
      {
        id: 'games-atlas-chat',
        type: 'atlas',
        page: 'games',
        threshold: 10,
        description: 'Exchange at least 10 messages with Atlas in the Game Room area',
      },
    ],
  },

  // ── Fallen Starlight ──
  {
    id: 'starlight-reader',
    name: 'Starlight Reader',
    description: 'Read all chapters of The Revelation of Fallen Starlight with at least 15 seconds per chapter.',
    active: true,
    requirements: [
      {
        id: 'read-all-chapters',
        type: 'group_all',
        elements: ALL_STAGES.map(s => `fallen-starlight.chapter.${s}`),
        description: 'Visit all 8 chapters of Fallen Starlight',
      },
      {
        id: 'reading-time',
        type: 'group_all',
        elements: ALL_STAGES.map(s => `fallen-starlight.chapter.${s}.time`),
        description: 'Spend time reading each chapter (tracked automatically)',
      },
    ],
  },

  // ── Celestial Clocks / Seven Metals ──
  {
    id: 'celestial-clocks-explorer',
    name: 'Celestial Clocks Explorer',
    description: 'Explore the Seven Metals — all planets, zodiac signs, cardinal points, and the mythic calendar.',
    active: true,
    requirements: [
      {
        id: 'visit-all-planets',
        type: 'group_all',
        elements: PLANETS.map(p => `chronosphaera.planet.${p}`),
        description: 'Visit all 7 planetary metals',
      },
      {
        id: 'visit-zodiac',
        type: 'group_pct',
        percent: 50,
        elements: ZODIAC_SIGNS.map(z => `chronosphaera.zodiac.${z}`),
        description: 'Explore at least 6 of the 12 zodiac signs',
      },
      {
        id: 'visit-cardinals',
        type: 'group_all',
        elements: CARDINAL_POINTS.map(c => `chronosphaera.cardinal.${c}`),
        description: 'Visit all 4 cardinal points',
      },
      {
        id: 'open-calendar',
        type: 'element',
        element: 'chronosphaera.calendar.opened',
        description: 'Open the Mythic Calendar',
      },
      {
        id: 'open-medicine-wheel',
        type: 'element',
        element: 'chronosphaera.medicine-wheel.opened',
        description: 'Open the Medicine Wheel',
      },
    ],
  },

  // ── Mythology Channel ──
  {
    id: 'mythology-channel-viewer',
    name: 'Mythology Channel Viewer',
    description: 'Explore the Mythology Channel — watch shows and explore episode content.',
    active: true,
    requirements: [
      {
        id: 'watch-shows',
        type: 'group_pct',
        percent: 50,
        elements: MYTHOLOGY_SHOWS.map(s => `mythology-channel.show.${s}`),
        description: 'Watch at least half of the 15 available series',
      },
    ],
  },

  // ── Library ──
  {
    id: 'library-pilgrim',
    name: 'Library Pilgrim',
    description: 'Walk the trail of the Myth Salon Library and explore its shelves.',
    active: true,
    requirements: [
      {
        id: 'walk-trail',
        type: 'group_all',
        elements: Array.from({ length: 8 }, (_, i) => `library.trail.stop.${i}`),
        description: 'Visit all 8 stops on the Library Trail',
      },
      {
        id: 'explore-shelves',
        type: 'count',
        element: 'library.page.visited',
        threshold: 1,
        description: 'Visit the Library page',
      },
    ],
  },

  // ── Story Forge ──
  {
    id: 'story-forger',
    name: 'Story Forger',
    description: 'Select a writing template, write at all 8 stages, and forge your story.',
    active: true,
    requirements: [
      {
        id: 'select-template',
        type: 'group_pct',
        percent: 25,
        elements: ['story-forge.template.personal', 'story-forge.template.fiction', 'story-forge.template.screenplay', 'story-forge.template.reflection'],
        description: 'Select a writing template',
      },
      {
        id: 'visit-all-stages',
        type: 'group_all',
        elements: ALL_STAGES.map(s => `story-forge.stage.${s}`),
        description: 'Visit all 8 stages of the Story Forge',
      },
      {
        id: 'generate-story',
        type: 'group_pct',
        percent: 25,
        elements: ['story-forge.generate.personal', 'story-forge.generate.fiction', 'story-forge.generate.screenplay', 'story-forge.generate.reflection'],
        description: 'Generate at least one story',
      },
    ],
  },

  // ── Meteor Steel (Home) ──
  {
    id: 'meteor-steel-initiate',
    name: 'Meteor Steel Initiate',
    description: 'Explore the Meteor Steel journey — visit all 8 stages of the transformation.',
    active: true,
    requirements: [
      {
        id: 'visit-all-stages',
        type: 'group_all',
        elements: ALL_STAGES.map(s => `home.stage.${s}`),
        description: 'Visit all 8 stages of Meteor Steel',
      },
    ],
  },

  // ── Ouroboros Journeys ──
  {
    id: 'ouroboros-walker',
    name: 'Ouroboros Walker',
    description: 'Complete at least one Ouroboros Journey — monomyth, meteor steel, fused, cosmic, planetary, or zodiac.',
    active: true,
    requirements: [
      {
        id: 'complete-journey',
        type: 'group_pct',
        percent: 16,
        elements: [
          'journeys.monomyth.completed',
          'journeys.meteor-steel.completed',
          'journeys.fused.completed',
          'journeys.cosmic.completed',
          'journeys.planetary.completed',
          'journeys.zodiac.completed',
        ],
        description: 'Complete at least one Ouroboros Journey',
      },
    ],
  },

  // ── Atlas ──
  {
    id: 'atlas-conversationalist',
    name: 'Atlas Conversationalist',
    description: 'Engage deeply with Atlas — send messages and explore different voices.',
    active: true,
    requirements: [
      {
        id: 'total-messages',
        type: 'count',
        element: 'atlas.messages.total',
        threshold: 20,
        description: 'Send at least 20 total messages to Atlas (sidebar or full page)',
      },
      {
        id: 'explore-voices',
        type: 'group_pct',
        percent: 10,
        elements: [
          'atlas.voice.atlas.message',
          ...PLANETS.map(p => `atlas.voice.planet:${p}.message`),
          ...ZODIAC_SIGNS.map(z => `atlas.voice.zodiac:${z}.message`),
          ...CARDINAL_POINTS.map(c => `atlas.voice.cardinal:${c}.message`),
        ],
        description: 'Chat with at least 3 different Atlas voices',
      },
    ],
  },

  // ── Consulting ──
  {
    id: 'mythic-consulting',
    name: 'Mythic Consulting Engagement',
    description: 'Complete a full mythic narrative consulting engagement — intake, sessions, and synthesis.',
    active: true,
    page: '/consulting/dashboard',
    requirements: [
      {
        id: 'dashboard-visited',
        type: 'element',
        element: 'consulting.dashboard.visited',
        description: 'Visit the consulting dashboard',
      },
      {
        id: 'session-completed',
        type: 'count',
        element: 'consulting.session.completed',
        threshold: 1,
        description: 'Complete at least one consulting session',
      },
      {
        id: 'artifact-captured',
        type: 'count',
        element: 'consulting.artifact.captured',
        threshold: 1,
        description: 'Capture at least one artifact during a session',
      },
    ],
  },
];

// Check if a single requirement is satisfied given user progress
export function checkRequirement(req, progress) {
  switch (req.type) {
    case 'element': {
      const el = findElement(progress, req.element);
      return !!el;
    }
    case 'count': {
      const el = findElement(progress, req.element);
      return el && (el.count || 0) >= (req.threshold || 1);
    }
    case 'time': {
      const el = findElement(progress, req.element);
      return el && (el.timeSpent || 0) >= (req.threshold || 15);
    }
    case 'group_all': {
      return req.elements.every(eid => !!findElement(progress, eid));
    }
    case 'group_pct': {
      const found = req.elements.filter(eid => !!findElement(progress, eid)).length;
      const pct = req.elements.length > 0 ? (found / req.elements.length) * 100 : 0;
      return pct >= (req.percent || 100);
    }
    case 'atlas': {
      const key = req.voice
        ? `atlas.messages.voice.${req.voice}`
        : `atlas.messages.${req.page}`;
      const el = findElement(progress, key);
      return el && (el.count || 0) >= (req.threshold || 1);
    }
    default:
      return false;
  }
}

// Get progress fraction for a requirement (0 to 1)
export function requirementProgress(req, progress) {
  switch (req.type) {
    case 'element': {
      return findElement(progress, req.element) ? 1 : 0;
    }
    case 'count': {
      const el = findElement(progress, req.element);
      const count = el ? (el.count || 0) : 0;
      return Math.min(1, count / (req.threshold || 1));
    }
    case 'time': {
      const el = findElement(progress, req.element);
      const time = el ? (el.timeSpent || 0) : 0;
      return Math.min(1, time / (req.threshold || 15));
    }
    case 'group_all': {
      if (req.elements.length === 0) return 1;
      const found = req.elements.filter(eid => !!findElement(progress, eid)).length;
      return found / req.elements.length;
    }
    case 'group_pct': {
      if (req.elements.length === 0) return 1;
      const found = req.elements.filter(eid => !!findElement(progress, eid)).length;
      const pct = (found / req.elements.length) * 100;
      return Math.min(1, pct / (req.percent || 100));
    }
    case 'atlas': {
      const key = req.voice
        ? `atlas.messages.voice.${req.voice}`
        : `atlas.messages.${req.page}`;
      const el = findElement(progress, key);
      const count = el ? (el.count || 0) : 0;
      return Math.min(1, count / (req.threshold || 1));
    }
    default:
      return 0;
  }
}

// Check if a course is fully completed
export function checkCourseCompletion(course, progress) {
  return course.requirements.every(req => checkRequirement(req, progress));
}

// Get overall course progress (0 to 1)
export function courseProgress(course, progress) {
  if (course.requirements.length === 0) return 1;
  const total = course.requirements.reduce((sum, req) => sum + requirementProgress(req, progress), 0);
  return total / course.requirements.length;
}

// Get incomplete requirements for a course (for display)
export function getIncompleteRequirements(course, progress) {
  return course.requirements
    .filter(req => !checkRequirement(req, progress))
    .map(req => ({
      ...req,
      progress: requirementProgress(req, progress),
    }));
}

// Find an element in the progress map
// Progress is structured as { sectionId: { elements: { elementId: data } } }
function findElement(progress, elementId) {
  const section = elementId.split('.')[0];
  const sectionData = progress[section];
  if (!sectionData || !sectionData.elements) return null;
  return sectionData.elements[elementId] || null;
}

// Get all tracked element IDs from progress
export function getAllTrackedElements(progress) {
  const elements = new Set();
  for (const section of Object.values(progress)) {
    if (section && section.elements) {
      for (const key of Object.keys(section.elements)) {
        elements.add(key);
      }
    }
  }
  return elements;
}

// Get active courses only
export function getActiveCourses() {
  return COURSES.filter(c => c.active);
}
