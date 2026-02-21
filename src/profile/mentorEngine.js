// Mentor engine: types, statuses, and computation functions
// Mentor types map 1:1 to credential categories from profileEngine.
// Qualification requires Level 2+ in any credential category.

import { CREDENTIAL_CATEGORIES } from './profileEngine';

// --- MENTOR TYPES ---
// Maps credential categories to mentor roles

export const MENTOR_TYPES = {
  scholar: {
    id: 'scholar',
    title: 'Mentor Mythologist',
    icon: '\uD83C\uDF93',
    minLevel: 2,
    credentialCategory: 'scholar',
  },
  storyteller: {
    id: 'storyteller',
    title: 'Mentor Storyteller',
    icon: '\uD83D\uDCDD',
    minLevel: 2,
    credentialCategory: 'storyteller',
  },
  healer: {
    id: 'healer',
    title: 'Mentor Healer',
    icon: '\uD83E\uDE7A',
    minLevel: 2,
    credentialCategory: 'healer',
  },
  mediaVoice: {
    id: 'mediaVoice',
    title: 'Mentor Media Voice',
    icon: '\uD83C\uDF99',
    minLevel: 2,
    credentialCategory: 'mediaVoice',
  },
  adventurer: {
    id: 'adventurer',
    title: 'Mentor Adventurer',
    icon: '\uD83C\uDF0D',
    minLevel: 2,
    credentialCategory: 'adventurer',
  },
};

// --- MENTOR STATUS ---

export const MENTOR_STATUS = {
  NOT_QUALIFIED: 'not-qualified',
  ELIGIBLE: 'eligible',
  APPLIED: 'applied',
  PENDING_ADMIN: 'pending-admin',
  APPROVED: 'approved',
  ACTIVE: 'active',
  REJECTED: 'rejected',
};

// Required courses before a mentor can become active
const REQUIRED_MENTOR_COURSES = [
  'monomyth-explorer',
  'celestial-clocks-explorer',
  'atlas-conversationalist',
];

// --- FUNCTIONS ---

/**
 * Returns array of mentor roles user qualifies for based on credentials.
 * Qualification = credential level >= minLevel for that mentor type.
 */
export function getQualifiedMentorTypes(credentials) {
  if (!credentials) return [];
  return Object.entries(MENTOR_TYPES)
    .filter(([categoryId, mentorType]) => {
      const cred = credentials[categoryId];
      return cred && cred.level >= mentorType.minLevel;
    })
    .map(([, mentorType]) => ({
      ...mentorType,
      credentialLevel: credentials[mentorType.credentialCategory]?.level,
      credentialName: CREDENTIAL_CATEGORIES[mentorType.credentialCategory]
        ?.levels.find(l => l.level === credentials[mentorType.credentialCategory]?.level)?.name,
    }));
}

/**
 * Returns true if user has any credential at Level 2+.
 */
export function isEligibleForMentor(credentials) {
  return getQualifiedMentorTypes(credentials).length > 0;
}

/**
 * Returns display info for a mentor (title, icon, status label).
 */
export function getMentorDisplay(mentorData) {
  if (!mentorData || !mentorData.type) return null;
  const mentorType = MENTOR_TYPES[mentorData.type];
  if (!mentorType) return null;

  const statusLabels = {
    [MENTOR_STATUS.APPLIED]: 'Application Submitted',
    [MENTOR_STATUS.PENDING_ADMIN]: 'Awaiting Final Review',
    [MENTOR_STATUS.APPROVED]: 'Approved',
    [MENTOR_STATUS.ACTIVE]: 'Active Mentor',
    [MENTOR_STATUS.REJECTED]: 'Application Not Approved',
  };

  return {
    title: mentorType.title,
    icon: mentorType.icon,
    status: mentorData.status,
    statusLabel: statusLabels[mentorData.status] || mentorData.status,
  };
}

/**
 * Returns true if all 3 required mentor courses are complete.
 */
export function isMentorCourseComplete(completedCourses) {
  if (!completedCourses) return false;
  return REQUIRED_MENTOR_COURSES.every(id => completedCourses.has(id));
}

/**
 * Returns effective mentor status, accounting for course completion.
 * If approved + courses done → active. Otherwise returns stored status.
 */
export function getEffectiveMentorStatus(mentorData, completedCourses) {
  if (!mentorData || !mentorData.status) return MENTOR_STATUS.NOT_QUALIFIED;
  if (mentorData.status === MENTOR_STATUS.APPROVED && isMentorCourseComplete(completedCourses)) {
    return MENTOR_STATUS.ACTIVE;
  }
  return mentorData.status;
}

/**
 * Returns the list of required mentor courses with completion status.
 */
export function getMentorCourseChecklist(completedCourses) {
  return REQUIRED_MENTOR_COURSES.map(id => ({
    id,
    complete: completedCourses ? completedCourses.has(id) : false,
  }));
}
