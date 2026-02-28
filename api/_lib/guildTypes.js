// Shared guild type definitions for API endpoints.
// Mirrors GUILD_TYPES from src/profile/guildEngine.js (server-side CJS version).

const GUILD_TYPE_MAP = {
  scholar: { title: 'Mythologist', icon: '\uD83C\uDF93' },
  storyteller: { title: 'Storyteller', icon: '\uD83D\uDCDD' },
  healer: { title: 'Healer', icon: '\uD83E\uDE7A' },
  mediaVoice: { title: 'Media Voice', icon: '\uD83C\uDF99' },
  adventurer: { title: 'Adventurer', icon: '\uD83C\uDF0D' },
};

const DEFAULT_TYPE_INFO = { title: 'Guild Member', icon: '\uD83C\uDF93' };

function getGuildTypeInfo(type) {
  return GUILD_TYPE_MAP[type] || DEFAULT_TYPE_INFO;
}

module.exports = { GUILD_TYPE_MAP, getGuildTypeInfo };
