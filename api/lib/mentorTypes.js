// Shared mentor type definitions for API endpoints.
// Mirrors MENTOR_TYPES from src/profile/mentorEngine.js (server-side CJS version).

const MENTOR_TYPE_MAP = {
  scholar: { title: 'Mentor Mythologist', icon: '\uD83C\uDF93' },
  storyteller: { title: 'Mentor Storyteller', icon: '\uD83D\uDCDD' },
  healer: { title: 'Mentor Healer', icon: '\uD83E\uDE7A' },
  mediaVoice: { title: 'Mentor Media Voice', icon: '\uD83C\uDF99' },
  adventurer: { title: 'Mentor Adventurer', icon: '\uD83C\uDF0D' },
};

const DEFAULT_TYPE_INFO = { title: 'Mentor', icon: '\uD83C\uDF93' };

function getMentorTypeInfo(type) {
  return MENTOR_TYPE_MAP[type] || DEFAULT_TYPE_INFO;
}

module.exports = { MENTOR_TYPE_MAP, getMentorTypeInfo };
