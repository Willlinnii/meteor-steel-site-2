// Profile engine: ranks, credentials, and computation functions
// Ranks are computed client-side from completedCourses (never stored).
// Credentials are stored in Firestore at users/{uid}/meta/profile.

// --- RANKS ---
// Each rank requires a set of completed course IDs. Ranks auto-compute.

export const RANKS = [
  {
    id: 'hero-of-transformation',
    name: 'Hero of Transformation',
    icon: '\u2694',
    requiredCourses: ['monomyth-explorer'],
  },
  {
    id: 'star',
    name: 'Star',
    icon: '\u2B50',
    requiredCourses: ['meteor-steel-initiate'],
  },
  {
    id: 'mythic-gamer',
    name: 'Mythic Gamer',
    icon: '\uD83C\uDFB2',
    requiredCourses: ['mythic-gamer'],
  },
  {
    id: 'starlight-reader',
    name: 'Starlight Reader',
    icon: '\uD83C\uDF1F',
    requiredCourses: ['starlight-reader'],
  },
  {
    id: 'celestial-navigator',
    name: 'Celestial Navigator',
    icon: '\uD83D\uDD2D',
    requiredCourses: ['celestial-clocks-explorer'],
  },
  {
    id: 'atlas-voice',
    name: 'Atlas Voice',
    icon: '\uD83D\uDDE3',
    requiredCourses: ['atlas-conversationalist'],
  },
  {
    id: 'keeper-of-the-keys',
    name: 'Keeper of the Keys',
    icon: '\uD83D\uDDDD',
    requiredCourses: ['monomyth-explorer', 'celestial-clocks-explorer', 'atlas-conversationalist', 'mythic-gamer'],
  },
];

// --- CREDENTIAL CATEGORIES ---

export const CREDENTIAL_CATEGORIES = {
  scholar: {
    id: 'scholar',
    label: 'Scholar',
    icon: '\uD83C\uDF93',
    levels: [
      { level: 1, name: 'Scholar', description: 'Academic credentials in mythology, depth psychology, or related fields' },
      { level: 2, name: 'Collegiate Teacher', description: 'Teaching at the collegiate or university level' },
      { level: 3, name: 'Full Professor', description: 'Tenured or full professor with published research' },
    ],
  },
  mediaVoice: {
    id: 'mediaVoice',
    label: 'Media Voice',
    icon: '\uD83C\uDF99',
    levels: [
      { level: 1, name: 'Media Voice', description: 'Active in podcasts, web content, or digital media' },
      { level: 2, name: 'Broadcast Voice', description: 'Television, radio, or documentary work' },
    ],
  },
  storyteller: {
    id: 'storyteller',
    label: 'Storyteller',
    icon: '\uD83D\uDCDD',
    levels: [
      { level: 1, name: 'Storyteller', description: 'Active writer or oral storyteller' },
      { level: 2, name: 'Story Professional', description: 'Published work or professional sales' },
      { level: 3, name: 'Advanced Storyteller', description: 'Work with six-figure budgets or major distribution' },
      { level: 4, name: 'Supreme Storyteller', description: 'Has a recognized hit or landmark work' },
    ],
  },
  healer: {
    id: 'healer',
    label: 'Healer',
    icon: '\uD83E\uDE7A',
    levels: [
      { level: 1, name: 'Healer', description: 'Coach, therapist, or psychological practitioner' },
      { level: 2, name: 'Experienced Healer', description: 'Years of practice with established clientele' },
      { level: 3, name: 'Established Practice', description: 'Well-known practice or significant body of therapeutic work' },
    ],
  },
  adventurer: {
    id: 'adventurer',
    label: 'Adventurer',
    icon: '\uD83C\uDF0D',
    levels: [
      { level: 1, name: 'Adventurer', description: 'Has traveled to mythic sites or engaged with myth in the field' },
      { level: 2, name: 'Explorer', description: 'Research expeditions, archaeological digs, or led mythic coursework' },
      { level: 3, name: 'World Walker', description: 'Has visited the Seven Wonders or equivalent mythic pilgrimage' },
    ],
  },
  curator: {
    id: 'curator',
    label: 'Curator',
    icon: '\uD83D\uDDBC',
    levels: [
      { level: 1, name: 'Curator', description: 'Curates or sells things casually / hobby' },
      { level: 2, name: 'Professional Curator', description: 'Professional curator, gallery work, professional resale, space design' },
      { level: 3, name: 'Established Curator', description: 'Established practice with significant portfolio or reputation' },
    ],
  },
  guildMember: {
    id: 'guildMember',
    label: 'Guild Member',
    icon: '\uD83C\uDFDB\uFE0F',
    levels: [
      { level: 1, name: 'Guild Member', description: 'Active member of the Mythouse Guild' },
    ],
  },
  consultant: {
    id: 'consultant',
    label: 'Consultant',
    icon: '\uD83D\uDD25',
    levels: [
      { level: 1, name: 'Consultant', description: 'Completed core coursework and intake training' },
      { level: 2, name: 'Practitioner', description: 'Completed practitioner cohort with supervised engagements' },
      { level: 3, name: 'Senior Practitioner', description: 'Full certification — can train other practitioners' },
    ],
  },
};

// --- RANK FUNCTIONS ---

export function checkRank(rank, completedCourses) {
  return rank.requiredCourses.every(courseId => completedCourses.has(courseId));
}

export function getEarnedRanks(completedCourses) {
  return RANKS.filter(rank => checkRank(rank, completedCourses));
}

export function getHighestRank(completedCourses) {
  const earned = getEarnedRanks(completedCourses);
  if (earned.length === 0) return null;
  // Highest rank = the one with the most required courses
  return earned.reduce((best, rank) =>
    rank.requiredCourses.length > best.requiredCourses.length ? rank : best
  , earned[0]);
}

export function rankProgress(rank, completedCourses) {
  const completed = rank.requiredCourses.filter(id => completedCourses.has(id)).length;
  return {
    completed,
    total: rank.requiredCourses.length,
    fraction: rank.requiredCourses.length > 0 ? completed / rank.requiredCourses.length : 1,
  };
}

// --- CREDENTIAL FUNCTIONS ---

export function getCredentialDisplay(category, level) {
  const cat = CREDENTIAL_CATEGORIES[category];
  if (!cat) return null;
  const levelData = cat.levels.find(l => l.level === level);
  if (!levelData) return null;
  return { ...levelData, icon: cat.icon, categoryLabel: cat.label };
}

export function getActiveCredentials(credentials) {
  if (!credentials) return [];
  return Object.entries(credentials)
    .filter(([, data]) => data && data.level > 0)
    .map(([category, data]) => ({
      category,
      ...data,
      display: getCredentialDisplay(category, data.level),
    }))
    .filter(c => c.display);
}
