// Guild engine: types, statuses, and computation functions
// Guild types map 1:1 to credential categories from profileEngine.
// Qualification requires Level 2+ in any credential category.

import { CREDENTIAL_CATEGORIES } from './profileEngine';

// --- GUILD TYPES ---
// Maps credential categories to guild roles

export const GUILD_TYPES = {
  scholar: {
    id: 'scholar',
    title: 'Mythologist',
    icon: '\uD83C\uDF93',
    minLevel: 2,
    credentialCategory: 'scholar',
  },
  storyteller: {
    id: 'storyteller',
    title: 'Storyteller',
    icon: '\uD83D\uDCDD',
    minLevel: 2,
    credentialCategory: 'storyteller',
  },
  healer: {
    id: 'healer',
    title: 'Healer',
    icon: '\uD83E\uDE7A',
    minLevel: 2,
    credentialCategory: 'healer',
  },
  mediaVoice: {
    id: 'mediaVoice',
    title: 'Media Voice',
    icon: '\uD83C\uDF99',
    minLevel: 2,
    credentialCategory: 'mediaVoice',
  },
  adventurer: {
    id: 'adventurer',
    title: 'Adventurer',
    icon: '\uD83C\uDF0D',
    minLevel: 2,
    credentialCategory: 'adventurer',
  },
};

// --- GUILD BIO / CAPACITY DEFAULTS ---
export const DEFAULT_GUILD_CAPACITY = 5;
export const MAX_GUILD_BIO_LENGTH = 500;
export const MAX_GUILD_CAPACITY = 20;

// --- GUILD STATUS ---

export const GUILD_STATUS = {
  NOT_QUALIFIED: 'not-qualified',
  ELIGIBLE: 'eligible',
  APPLIED: 'applied',
  PENDING_ADMIN: 'pending-admin',
  APPROVED: 'approved',
  ACTIVE: 'active',
  REJECTED: 'rejected',
};

// Required courses before a guild member can become active
const REQUIRED_GUILD_COURSES = [
  'monomyth-explorer',
  'celestial-clocks-explorer',
  'atlas-conversationalist',
];

// --- FUNCTIONS ---

/**
 * Returns array of guild roles user qualifies for based on credentials.
 * Qualification = credential level >= minLevel for that guild type.
 */
export function getQualifiedGuildTypes(credentials) {
  if (!credentials) return [];
  return Object.entries(GUILD_TYPES)
    .filter(([categoryId, guildType]) => {
      const cred = credentials[categoryId];
      return cred && cred.level >= guildType.minLevel;
    })
    .map(([, guildType]) => ({
      ...guildType,
      credentialLevel: credentials[guildType.credentialCategory]?.level,
      credentialName: CREDENTIAL_CATEGORIES[guildType.credentialCategory]
        ?.levels.find(l => l.level === credentials[guildType.credentialCategory]?.level)?.name,
    }));
}

/**
 * Returns true if user has any credential at Level 2+.
 */
export function isEligibleForGuild(credentials) {
  return getQualifiedGuildTypes(credentials).length > 0;
}

/**
 * Returns display info for a guild member (title, icon, status label).
 */
export function getGuildDisplay(guildData) {
  if (!guildData || !guildData.type) return null;
  const guildType = GUILD_TYPES[guildData.type];
  if (!guildType) return null;

  const statusLabels = {
    [GUILD_STATUS.APPLIED]: 'Application Submitted',
    [GUILD_STATUS.PENDING_ADMIN]: 'Awaiting Final Review',
    [GUILD_STATUS.APPROVED]: 'Approved',
    [GUILD_STATUS.ACTIVE]: 'Active Guild Member',
    [GUILD_STATUS.REJECTED]: 'Application Not Approved',
  };

  return {
    title: guildType.title,
    icon: guildType.icon,
    status: guildData.status,
    statusLabel: statusLabels[guildData.status] || guildData.status,
  };
}

/**
 * Returns true if all 3 required guild courses are complete.
 */
export function isGuildCourseComplete(completedCourses) {
  if (!completedCourses) return false;
  return REQUIRED_GUILD_COURSES.every(id => completedCourses.has(id));
}

/**
 * Returns effective guild status, accounting for course completion.
 * If approved + courses done -> active. Otherwise returns stored status.
 */
export function getEffectiveGuildStatus(guildData, completedCourses) {
  if (!guildData || !guildData.status) return GUILD_STATUS.NOT_QUALIFIED;
  if (guildData.status === GUILD_STATUS.APPROVED && guildData.guildContractAccepted && isGuildCourseComplete(completedCourses)) {
    return GUILD_STATUS.ACTIVE;
  }
  return guildData.status;
}

/**
 * Returns the list of required guild courses with completion status.
 */
export function getGuildCourseChecklist(completedCourses) {
  return REQUIRED_GUILD_COURSES.map(id => ({
    id,
    complete: completedCourses ? completedCourses.has(id) : false,
  }));
}
