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
// WAITE DESCRIPTIONS — from "The Pictorial Key to the Tarot" (1910)
// Part III: "The Outer Method of the Oracles." Public domain.
// Source: A.E. Waite, full text at Project Gutenberg (gutenberg.org/ebooks/18753).
// =====================================================

// Element → tarot base suit key mapping (for cross-culture lookup)
const ELEMENT_TO_TAROT_SUIT = { Air: 'swords', Water: 'cups', Fire: 'wands', Earth: 'pentacles' };

const WAITE_MINOR = {
  // === WANDS ===
  'wands-ace': 'A hand issuing from a cloud grasps a stout wand or club.',
  'wands-2': 'A tall man looks from a battlemented roof over sea and shore; he holds a globe in his right hand, while a staff in his left rests on the battlement; another is fixed in a ring. The Rose and Cross and Lily should be noticed on the left side.',
  'wands-3': 'A calm, stately personage, with his back turned, looking from a cliff\u2019s edge at ships passing over the sea. Three staves are planted in the ground, and he leans slightly on one of them.',
  'wands-4': 'From the four great staves planted in the foreground there is a great garland suspended; two female figures uplift nosegays; at their side is a bridge over a moat, leading to an old manorial house.',
  'wands-5': 'A posse of youths, who are brandishing staves, as if in sport or strife. It is mimic warfare.',
  'wands-6': 'A laurelled horseman bears one staff adorned with a laurel crown; footmen with staves are at his side.',
  'wands-7': 'A young man on a craggy eminence brandishing a staff; six other staves are raised towards him from below.',
  'wands-8': 'The card represents motion through the immovable\u2014a flight of wands through an open country; but they draw to the term of their course. That which they signify is at hand; it may be even on the threshold.',
  'wands-9': 'The figure leans upon his staff and has an expectant look, as if awaiting an enemy. Behind are eight other staves\u2014erect, in orderly disposition, like a palisade.',
  'wands-10': 'A man oppressed by the weight of the ten staves which he is carrying.',
  'wands-page': 'In a scene similar to the former, a young man stands in the act of proclamation. He is unknown but faithful, and his tidings are strange.',
  'wands-knight': 'He is shewn as if upon a journey, armed with a short wand, and although mailed is not on a warlike errand. He is passing mounds or pyramids. The motion of the horse is a key to the character of its rider, and suggests the precipitate mood, or things connected therewith.',
  'wands-queen': 'The Wands throughout this suit are always in leaf, as it is a suit of life and animation. Emotionally and otherwise, the Queen\u2019s personality corresponds to that of the King, but is more magnetic.',
  'wands-king': 'The physical and emotional nature to which this card is attributed is dark, ardent, lithe, animated, impassioned, noble. The King uplifts a flowering wand, and wears, like his three correspondences in the remaining suits, what is called a cap of maintenance beneath his crown. He connects with the symbol of the lion, which is emblazoned on the back of his throne.',

  // === CUPS ===
  'cups-ace': 'The waters are beneath, and thereon are water-lilies; the hand issues from the cloud, holding in its palm the cup, from which four streams are pouring; a dove, bearing in its bill a cross-marked Host, descends to place the Wafer in the Cup; the dew of water is falling on all sides.',
  'cups-2': 'A youth and maiden are pledging one another, and above their cups rises the Caduceus of Hermes, between the great wings of which there appears a lion\u2019s head.',
  'cups-3': 'Maidens in a garden-ground with cups uplifted, as if pledging one another.',
  'cups-4': 'A young man is seated under a tree and contemplates three cups set on the grass before him; an arm issuing from a cloud offers him another cup.',
  'cups-5': 'A dark, cloaked figure, looking sideways at three prone cups; two others stand upright behind him; a bridge is in the background, leading to a small keep or holding.',
  'cups-6': 'Children in an old garden, their cups filled with flowers.',
  'cups-7': 'Strange chalices of vision, but the images are more especially those of the fantastic spirit.',
  'cups-8': 'A man of dejected aspect is deserting the cups of his felicity, enterprise, undertaking or previous concern.',
  'cups-9': 'A goodly personage has feasted to his heart\u2019s content, and abundant refreshment of wine is on the arched counter behind him, seeming to indicate that the future is also assured.',
  'cups-10': 'Appearance of Cups in a rainbow; it is contemplated in wonder and ecstasy by a man and woman below, evidently husband and wife. His right arm is about her; his left is raised upward; she raises her right arm. The two children dancing near them have not observed the prodigy but are happy after their own manner. There is a home-scene beyond.',
  'cups-page': 'A fair, pleasing, somewhat effeminate page, of studious and intent aspect, contemplates a fish rising from a cup to look at him. It is the pictures of the mind taking form.',
  'cups-knight': 'Graceful, but not warlike; riding quietly, wearing a winged helmet, referring to those higher graces of the imagination which sometimes characterize this card. He too is a dreamer, but the images of the side of sense haunt him in his vision.',
  'cups-queen': 'Beautiful, fair, dreamy\u2014as one who sees visions in a cup. This is, however, only one of her aspects; she sees, but she also acts, and her activity feeds her dream.',
  'cups-king': 'He holds a short sceptre in his left hand and a great cup in his right; his throne is set upon the sea; on one side a ship is riding and on the other a dolphin is leaping.',

  // === SWORDS ===
  'swords-ace': 'A hand issues from a cloud, grasping a sword, the point of which is encircled by a crown.',
  'swords-2': 'A hoodwinked female figure balances two swords upon her shoulders.',
  'swords-3': 'Three swords piercing a heart; cloud and rain behind.',
  'swords-4': 'The effigy of a knight in the attitude of prayer, at full length upon his tomb.',
  'swords-5': 'A disdainful man looks after two retreating and dejected figures. Their swords lie upon the ground. He carries two others on his left shoulder, and a third sword is in his right hand, point to earth. He is the master in possession of the field.',
  'swords-6': 'A ferryman carrying passengers in his punt to the further shore. The course is smooth, and seeing that the freight is light, it may be noted that the work is not beyond his strength.',
  'swords-7': 'A man in the act of carrying away five swords rapidly; the two others of the card remain stuck in the ground. A camp is close at hand.',
  'swords-8': 'A woman, bound and hoodwinked, with the swords of the card about her. Yet it is rather a card of temporary durance than of irretrievable bondage.',
  'swords-9': 'One seated on her couch in lamentation, with the swords over her. She is as one who knows no sorrow which is like unto hers. It is a card of utter desolation.',
  'swords-10': 'A prostrate figure, pierced by all the swords belonging to the card.',
  'swords-page': 'A lithe, active figure holds a sword upright in both hands, while in the act of swift walking. He is passing over rugged land, and about his way the clouds are collocated wildly. He is alert and lithe, looking this way and that, as if an expected enemy might appear at any moment.',
  'swords-knight': 'He is riding in full course, as if scattering his enemies. In the design he is really a prototypical hero of romantic chivalry. He might almost be Galahad, whose sword is swift and sure because he is clean of heart.',
  'swords-queen': 'Her right hand raises the weapon vertically and the hilt rests on an arm of her royal chair; the left hand is extended, the arm raised; her countenance is severe but chastened; it suggests familiarity with sorrow. It does not represent mercy, and, her sword notwithstanding, she is scarcely a symbol of power.',
  'swords-king': 'He sits in judgment, holding the unsheathed sign of his suit. He recalls the conventional symbol of justice in the Trumps Major, and he may represent this virtue, but he is rather the power of life and death, in virtue of his office.',

  // === PENTACLES ===
  'pentacles-ace': 'A hand\u2014issuing, as usual, from a cloud\u2014holds up a pentacle.',
  'pentacles-2': 'A young man, in the act of dancing, has a pentacle in either hand, and they are joined by that endless cord which is like the number 8 reversed.',
  'pentacles-3': 'A sculptor at his work in a monastery. Compare the design which illustrates the Eight of Pentacles. The apprentice or amateur therein has received his reward and is now at work in earnest.',
  'pentacles-4': 'A crowned figure, having a pentacle over his crown, clasps another with hands and arms; two pentacles are under his feet.',
  'pentacles-5': 'Two mendicants in a snow-storm pass a lighted casement.',
  'pentacles-6': 'A person in the guise of a merchant weighs money in a pair of scales and distributes it to the needy and distressed. It is a testimony to his own success in life, as well as to his goodness of heart.',
  'pentacles-7': 'A young man, leaning on his staff, looks intently at seven pentacles attached to a clump of greenery on his right; one would say that these were his treasures and that his heart was there.',
  'pentacles-8': 'An artist in stone at his work, which he exhibits in the form of trophies.',
  'pentacles-9': 'A woman, with a bird upon her wrist, stands amidst a great abundance of grapevines in the garden of a manorial house.',
  'pentacles-10': 'A man and woman beneath an archway which gives entrance to a house and domain. They are accompanied by a child, who looks curiously at two dogs accosting an ancient personage seated in the foreground.',
  'pentacles-page': 'A youthful figure, looking intently at the pentacle which hovers over his raised hands. He moves slowly, insensible of that which is about him.',
  'pentacles-knight': 'He rides a slow, enduring, heavy horse, to which his own aspect corresponds. He exhibits his symbol, but does not look therein.',
  'pentacles-queen': 'The face suggests that of a dark woman, whose qualities might be summed up in the idea of greatness of soul; she has also the serious cast of intelligence; she contemplates her symbol and may see worlds therein.',
  'pentacles-king': 'The figure calls for no special description; the face is rather dark, suggesting also courage, but somewhat lethargic in tendency. The bull\u2019s head should be noted as a recurrent symbol on the throne. The sign of this suit is represented throughout as engraved or blazoned with the pentagram, typifying the correspondence of the four elements in human nature and that by which they may be governed.',
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

      // Look up Waite description via element → tarot suit mapping
      const tarotSuit = ELEMENT_TO_TAROT_SUIT[suit.element];
      const waiteKey = tarotSuit ? `${tarotSuit}-${rank.key}` : null;

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
        waiteDesc: (waiteKey && WAITE_MINOR[waiteKey]) || null,
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
