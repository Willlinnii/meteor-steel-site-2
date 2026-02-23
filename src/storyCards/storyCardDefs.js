import { computeNumerology, NUMBER_MEANINGS, NUMBER_TYPES } from '../profile/numerologyEngine';

// Category config: icon, color, label
export const CATEGORY_CONFIG = {
  astrology:       { icon: '\u2728', color: '#7b68ee', label: 'Astrology' },
  numerology:      { icon: '\u{1F52E}', color: '#9b59b6', label: 'Numerology' },
  journey:         { icon: '\u{1F6E4}\uFE0F', color: '#c9a961', label: 'Journeys' },
  tarot:           { icon: '\u{1F0CF}', color: '#e74c3c', label: 'Tarot Readings' },
  forge:           { icon: '\u{1F525}', color: '#c4713a', label: 'Story Forge' },
  'personal-story': { icon: '\u{1F4D6}', color: '#3498db', label: 'Personal Stories' },
  game:            { icon: '\u{1F3B2}', color: '#2ecc71', label: 'Games' },
  course:          { icon: '\u{1F393}', color: '#f39c12', label: 'Courses' },
};

// Category display order
export const CATEGORY_ORDER = [
  'astrology', 'numerology', 'journey', 'tarot',
  'forge', 'personal-story', 'game', 'course',
];

// Game ID to display name
export const GAME_NAMES = {
  'snakes-and-ladders': 'Snakes & Ladders',
  'senet': 'Senet',
  'royal-game-of-ur': 'Royal Game of Ur',
  'mehen': 'Mehen',
  'jackals-and-hounds': 'Jackals & Hounds',
  'pachisi': 'Pachisi',
};

const GAME_IDS = Object.keys(GAME_NAMES);

/**
 * Pure function: compute desired story cards from all context data.
 * Returns a Map<sourceId, cardData> (without timestamps — caller handles those).
 */
export function computeCardsFromSources({ natalChart, numerologyName, luckyNumber, journeySyntheses, personalStories, forgeData, isElementCompleted, certificateData, allCourses }) {
  const cards = new Map();

  // --- Astrology ---
  if (natalChart && natalChart.planets) {
    const sun = natalChart.planets.Sun;
    const moon = natalChart.planets.Moon;
    const asc = natalChart.ascendant;
    const chinese = natalChart.chinese;

    const bigThree = [
      sun ? `Sun in ${sun.sign}` : null,
      moon ? `Moon in ${moon.sign}` : null,
      asc ? `Rising: ${asc.sign}` : null,
    ].filter(Boolean);

    const planetList = Object.entries(natalChart.planets).map(([name, data]) => `${name} in ${data.sign}`);

    cards.set('astrology-natal', {
      category: 'astrology',
      title: 'Natal Chart',
      subtitle: bigThree.join(' \u00B7 '),
      summary: planetList.join('\n') + (chinese ? `\nChinese: ${chinese.pillar}` : ''),
      fullContent: null,
      metadata: {
        sunSign: sun?.sign || null,
        moonSign: moon?.sign || null,
        rising: asc?.sign || null,
        planets: planetList,
        chinese: chinese?.pillar || null,
      },
    });
  }

  // --- Numerology ---
  if (numerologyName) {
    const nums = computeNumerology(numerologyName);
    if (nums) {
      const lines = Object.entries(nums).map(([key, val]) => {
        const label = NUMBER_TYPES[key]?.label || key;
        const meaning = NUMBER_MEANINGS[val] || '';
        return `${label}: ${val} \u2014 ${meaning}`;
      });

      cards.set('numerology-name', {
        category: 'numerology',
        title: 'Numerology Profile',
        subtitle: `Expression ${nums.expression} \u00B7 Soul Urge ${nums.soulUrge} \u00B7 Personality ${nums.personality}`,
        summary: lines.join('\n') + (luckyNumber != null ? `\nLucky Number: ${luckyNumber}` : ''),
        fullContent: null,
        metadata: {
          expression: nums.expression,
          soulUrge: nums.soulUrge,
          personality: nums.personality,
          luckyNumber: luckyNumber ?? null,
        },
      });
    }
  }

  // --- Journey Syntheses ---
  if (journeySyntheses) {
    for (const [key, syn] of Object.entries(journeySyntheses)) {
      if (!syn.text) continue;
      cards.set(key, {
        category: 'journey',
        title: `${formatJourneyId(syn.journeyId)} Journey`,
        subtitle: `${syn.mode} mode`,
        summary: syn.text.substring(0, 300) + (syn.text.length > 300 ? '...' : ''),
        fullContent: syn.text,
        metadata: { journeyId: syn.journeyId, mode: syn.mode },
      });
    }
  }

  // --- Personal Stories (split tarot vs other) ---
  if (personalStories?.stories) {
    for (const [id, story] of Object.entries(personalStories.stories)) {
      const stageCount = Object.values(story.stages || {}).filter(st => st.entries?.length > 0).length;
      if (stageCount === 0) continue;

      if (story.source === 'tarot-reading') {
        cards.set(`tarot-${id}`, {
          category: 'tarot',
          title: story.name || 'Tarot Reading',
          subtitle: `${stageCount}/8 stages`,
          summary: getFirstEntryText(story),
          fullContent: null,
          metadata: {
            intention: story.name || null,
            cards: [], // tarot card detail not stored in personalStories
          },
        });
      } else {
        cards.set(`story-${id}`, {
          category: 'personal-story',
          title: story.name || 'Untitled Story',
          subtitle: `${stageCount}/8 stages \u00B7 ${story.source === 'atlas-interview' ? 'Atlas Interview' : 'Manual'}`,
          summary: getFirstEntryText(story),
          fullContent: null,
          metadata: {
            source: story.source || 'manual',
            stageCount,
          },
        });
      }
    }
  }

  // --- Story Forge ---
  if (forgeData) {
    const hasStories = forgeData.stories && Object.values(forgeData.stories).some(v => v);
    const hasEntries = forgeData.entries && Object.keys(forgeData.entries).length > 0;
    if (hasStories || hasEntries) {
      const stageCount = forgeData.stories ? Object.values(forgeData.stories).filter(Boolean).length : 0;
      cards.set('forge-active', {
        category: 'forge',
        title: 'Story Forge',
        subtitle: `${forgeData.template || 'Custom'} template \u00B7 ${stageCount} stages written`,
        summary: getFirstForgeText(forgeData),
        fullContent: null,
        metadata: {
          template: forgeData.template || null,
          stageCount,
        },
      });
    }
  }

  // --- Games ---
  if (isElementCompleted) {
    for (const gameId of GAME_IDS) {
      if (isElementCompleted(`games.${gameId}.completed`)) {
        cards.set(`game-${gameId}`, {
          category: 'game',
          title: GAME_NAMES[gameId],
          subtitle: 'Completed',
          summary: `You have completed ${GAME_NAMES[gameId]}.`,
          fullContent: null,
          metadata: { gameId },
        });
      }
    }
  }

  // --- Courses ---
  if (certificateData && allCourses) {
    for (const [courseId, certInfo] of Object.entries(certificateData)) {
      const course = allCourses.find(c => c.id === courseId);
      if (!course) continue;
      cards.set(`course-${courseId}`, {
        category: 'course',
        title: course.name,
        subtitle: certInfo.completedAt
          ? `Completed ${new Date(certInfo.completedAt).toLocaleDateString()}`
          : 'Certificate earned',
        summary: course.description || '',
        fullContent: null,
        metadata: { courseId },
      });
    }
  }

  return cards;
}

// --- Helpers ---

function formatJourneyId(id) {
  if (!id) return 'Unknown';
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getFirstEntryText(story) {
  const stages = story.stages || {};
  for (const stage of Object.values(stages)) {
    if (stage.edited) return stage.edited.substring(0, 200);
    if (stage.generated) return stage.generated.substring(0, 200);
    if (stage.entries?.length > 0) return stage.entries[0].text?.substring(0, 200) || '';
  }
  return '';
}

function getFirstForgeText(forgeData) {
  if (forgeData.stories) {
    for (const text of Object.values(forgeData.stories)) {
      if (text) return text.substring(0, 200);
    }
  }
  if (forgeData.entries) {
    for (const text of Object.values(forgeData.entries)) {
      if (text) return (typeof text === 'string' ? text : JSON.stringify(text)).substring(0, 200);
    }
  }
  return '';
}
