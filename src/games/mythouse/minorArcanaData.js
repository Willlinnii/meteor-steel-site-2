// Minor Arcana Data — Cultural suit & court card mappings
// Each culture gets 4 suits × 14 ranks = 56 cards
// Suits correspond to the 4 classical elements: Air, Water, Fire, Earth
// Traditional tarot: Swords=Air, Cups=Water, Wands=Fire, Pentacles=Earth

// The 14 ranks in a tarot suit (playing cards have 13; Knight is the extra)
export const MINOR_RANKS = [
  { key: 'ace',    label: 'Ace',    value: 1,  court: false },
  { key: '2',      label: '2',      value: 2,  court: false },
  { key: '3',      label: '3',      value: 3,  court: false },
  { key: '4',      label: '4',      value: 4,  court: false },
  { key: '5',      label: '5',      value: 5,  court: false },
  { key: '6',      label: '6',      value: 6,  court: false },
  { key: '7',      label: '7',      value: 7,  court: false },
  { key: '8',      label: '8',      value: 8,  court: false },
  { key: '9',      label: '9',      value: 9,  court: false },
  { key: '10',     label: '10',     value: 10, court: false },
  { key: 'page',   label: 'Page',   value: 10, court: true },
  { key: 'knight', label: 'Knight', value: 14, court: true },
  { key: 'queen',  label: 'Queen',  value: 10, court: true },
  { key: 'king',   label: 'King',   value: 10, court: true },
];

// Element colors (used for suit badge styling)
const ELEMENT_COLORS = {
  Air:   '#7ec8e3',
  Water: '#5b9bd5',
  Fire:  '#e8835a',
  Earth: '#8fba74',
};

// =====================================================
// CULTURE-SPECIFIC SUIT & COURT DEFINITIONS
// =====================================================
// Each culture maps the 4 elements to culturally-themed suit names
// and provides culturally-themed court card titles.

export const CULTURE_SUITS = {
  tarot: {
    suits: [
      { key: 'swords',    name: 'Swords',    element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air },
      { key: 'cups',      name: 'Cups',      element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water },
      { key: 'wands',     name: 'Wands',     element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire },
      { key: 'pentacles', name: 'Pentacles', element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth },
    ],
    court: { page: 'Page', knight: 'Knight', queen: 'Queen', king: 'King' },
  },

  roman: {
    suits: [
      { key: 'gladii',  name: 'Gladii',  element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The Roman short sword — weapon of the legions, symbol of martial intellect and decisive action.' },
      { key: 'calices', name: 'Calices', element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The Roman chalice — vessel of libation, sacred to Neptune and the river gods.' },
      { key: 'fasces',  name: 'Fasces',  element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'Bound rods with an axe — the Roman symbol of authority, justice, and the fire of civic power.' },
      { key: 'aurei',   name: 'Aurei',   element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The gold coin of Rome — symbol of material wealth, trade, and the stability of empire.' },
    ],
    court: { page: 'Miles', knight: 'Eques', queen: 'Regina', king: 'Rex' },
  },

  greek: {
    suits: [
      { key: 'xiphe',    name: 'Xiphe',    element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The Greek leaf-blade sword — weapon of heroes, symbol of the cutting wind of reason.' },
      { key: 'kylikes',  name: 'Kylikes',  element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The Greek drinking cup — vessel of the symposium, sacred to Dionysus and Poseidon.' },
      { key: 'thyrsi',   name: 'Thyrsi',   element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The fennel staff tipped with a pine cone — Dionysus\'s wand, symbol of ecstatic fire and divine frenzy.' },
      { key: 'drachmae', name: 'Drachmae', element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The silver coin of Athens — stamped with Athena\'s owl, symbol of wisdom and earthly commerce.' },
    ],
    court: { page: 'Kouros', knight: 'Hippeus', queen: 'Basilissa', king: 'Basileus' },
  },

  norse: {
    suits: [
      { key: 'sverd',   name: 'Sver\u00F0',   element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The Norse sword — forged in wind and ice, wielded by warriors who read fate in the gale.' },
      { key: 'horn',    name: 'Horn',    element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The drinking horn — vessel of mead and memory, sacred to the Well of Ur\u00F0 and the wisdom of the depths.' },
      { key: 'stafir',  name: 'Stafir',  element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The rune stave — carved staff of seiðr magic, channeling the fire of Muspelheim.' },
      { key: 'hringar', name: 'Hringar', element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'Arm-rings of gold — sworn upon in oaths, symbol of loyalty, wealth, and the earth\'s hidden treasure.' },
    ],
    court: { page: 'Karl', knight: 'Riddari', queen: 'Drottning', king: 'Konungr' },
  },

  babylonian: {
    suits: [
      { key: 'patru',  name: 'Patru',  element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The ritual dagger — blade of Enlil\'s wind, used to inscribe the decrees of heaven.' },
      { key: 'agubbu', name: 'Agubbu', element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The holy water vessel — sacred to Ea/Enki, used in temple purification rites.' },
      { key: 'hattu',  name: 'Hattu',  element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The royal scepter — staff of Marduk\'s authority, channeling the fire of Gibil\'s forge.' },
      { key: 'sheqel', name: 'Sheqel', element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The weight-coin of Mesopotamia — standard of trade, symbol of Zibanitu\'s balance.' },
    ],
    court: { page: 'Maru', knight: 'Ridu', queen: 'Sharratu', king: 'Sharru' },
  },

  vedic: {
    suits: [
      { key: 'khadga',  name: 'Khadga',  element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The sacred sword — weapon of V\u0101yu\'s wind, cutting through illusion (m\u0101y\u0101).' },
      { key: 'kalasha', name: 'Kalasha', element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The sacred water pot — vessel of Varu\u1E47a\'s rains and the amrita of the gods.' },
      { key: 'danda',   name: 'Da\u1E47\u1E0Da', element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The staff of dharma — Agni\'s fire embodied in the ascetic\'s rod of discipline and truth.' },
      { key: 'ratna',   name: 'Ratna',   element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The jewel — navaratna of the nine planets, symbol of pr\u1E5Bthiv\u012B (earth) and material blessing.' },
    ],
    court: { page: 'Kum\u0101ra', knight: 'Ashv\u0101rohi', queen: 'R\u0101n\u012B', king: 'R\u0101j\u0101' },
  },

  islamic: {
    suits: [
      { key: 'sayf',  name: 'Sayf',     element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The curved sword — Dh\u016B al-Fiq\u0101r of \'Al\u012B, symbol of wind-swift justice and the breath of truth.' },
      { key: 'kas',   name: 'K\u0101s',  element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The goblet — vessel of Zamzam\'s holy water, symbol of knowledge flowing from the divine spring.' },
      { key: 'asa',   name: '\u02BFAs\u0101', element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The staff — M\u016Bs\u0101\'s rod that became a serpent, symbol of prophetic fire and divine authority.' },
      { key: 'dinar', name: 'D\u012Bn\u0101r', element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The gold coin — standard of the caliphate, symbol of earthly stewardship and zak\u0101t (charity).' },
    ],
    court: { page: 'Ghul\u0101m', knight: 'F\u0101ris', queen: 'Malika', king: 'Malik' },
  },

  christian: {
    suits: [
      { key: 'swords',  name: 'Swords',   element: 'Air',   symbol: '\u2694', color: ELEMENT_COLORS.Air,
        desc: 'The Sword of the Spirit — Ephesians 6:17, the Word of God that pierces like wind through falsehood.' },
      { key: 'chalices', name: 'Chalices', element: 'Water', symbol: '\u2615', color: ELEMENT_COLORS.Water,
        desc: 'The Holy Chalice — vessel of the Eucharist, the Grail of living water and salvation.' },
      { key: 'crosiers', name: 'Crosiers', element: 'Fire',  symbol: '\u2741', color: ELEMENT_COLORS.Fire,
        desc: 'The bishop\'s staff — the shepherd\'s crook of pastoral authority, burning with apostolic fire.' },
      { key: 'hosts',    name: 'Hosts',    element: 'Earth', symbol: '\u2726', color: ELEMENT_COLORS.Earth,
        desc: 'The sacred Host — the bread of communion, body of Christ, symbol of earthly sustenance transfigured.' },
    ],
    court: { page: 'Acolyte', knight: 'Crusader', queen: 'Madonna', king: 'Sovereign' },
  },
};

// =====================================================
// MINOR ARCANA GENERATOR
// =====================================================

/**
 * Build the 56 Minor Arcana cards for a given culture.
 * Returns an array sorted by suit then rank.
 */
export function buildMinorArcana(cultureKey) {
  const config = CULTURE_SUITS[cultureKey];
  if (!config) return [];

  const cards = [];
  for (const suit of config.suits) {
    for (const rank of MINOR_RANKS) {
      // For court cards, use the culture-specific title
      let displayRank = rank.label;
      if (rank.court && config.court[rank.key]) {
        displayRank = config.court[rank.key];
      }

      cards.push({
        id: `${cultureKey}-${suit.key}-${rank.key}`,
        culture: cultureKey,
        suit: suit.key,
        suitName: suit.name,
        suitSymbol: suit.symbol,
        suitColor: suit.color,
        element: suit.element,
        suitDesc: suit.desc || null,
        rank: rank.key,
        rankLabel: displayRank,
        value: rank.value,
        isCourt: rank.court,
        // Tarot-style label: "Knight of Swords" → "Eques of Gladii"
        label: `${displayRank} of ${suit.name}`,
      });
    }
  }
  return cards;
}

/**
 * Get all suit definitions for a culture.
 */
export function getSuitsForCulture(cultureKey) {
  const config = CULTURE_SUITS[cultureKey];
  return config ? config.suits : [];
}

/**
 * Get court card titles for a culture.
 */
export function getCourtForCulture(cultureKey) {
  const config = CULTURE_SUITS[cultureKey];
  return config ? config.court : null;
}
