/**
 * planetCharacters.js — Compiled character profiles for the seven classical planets.
 *
 * Pure data + helpers. No React.
 * Synthesized from chronosphaera data, recursiveRules, and planetaryPhysics.
 * Used by the recursive chart's narrative layer to speak in character terms
 * rather than mechanical degree listings.
 */

// ── Essential Dignity Table ─────────────────────────────────────────────────

export const PLANET_DIGNITIES = {
  Sun:     { domicile: ['Leo'],                    exaltation: ['Aries'],     detriment: ['Aquarius'],              fall: ['Libra'] },
  Moon:    { domicile: ['Cancer'],                 exaltation: ['Taurus'],    detriment: ['Capricorn'],             fall: ['Scorpio'] },
  Mercury: { domicile: ['Gemini', 'Virgo'],        exaltation: ['Virgo'],     detriment: ['Sagittarius', 'Pisces'], fall: ['Pisces'] },
  Venus:   { domicile: ['Taurus', 'Libra'],        exaltation: ['Pisces'],    detriment: ['Aries', 'Scorpio'],      fall: ['Virgo'] },
  Mars:    { domicile: ['Aries', 'Scorpio'],        exaltation: ['Capricorn'], detriment: ['Taurus', 'Libra'],       fall: ['Cancer'] },
  Jupiter: { domicile: ['Sagittarius', 'Pisces'],   exaltation: ['Cancer'],    detriment: ['Gemini', 'Virgo'],       fall: ['Capricorn'] },
  Saturn:  { domicile: ['Capricorn', 'Aquarius'],   exaltation: ['Libra'],     detriment: ['Cancer', 'Leo'],         fall: ['Aries'] },
};

// ── Character Profiles ──────────────────────────────────────────────────────

export const PLANET_CHARACTERS = {
  Sun: {
    // ── Core Identity
    name: 'Sun',
    glyph: '☉',
    role: 'The Center',
    keyword: 'identity',
    metal: 'Gold',
    day: 'Sunday',

    // ── Archetypal Polarity
    sin: 'Pride',
    virtue: 'Humility',
    archetype: 'The Sovereign',
    shadow: 'Wields power with arrogance and hubris, consumed by need for recognition.',
    light: 'Leads with wisdom and grace, uses power to uplift and serve.',

    // ── Character Voice
    sees: 'identity, purpose, vitality',
    theme: "Everything radiates from purpose. The planets are satellites of meaning — each one a facet of the Self's expression.",
    question: 'Who am I?',
    drive: 'To express, to radiate, to be seen.',
    fear: 'Irrelevance. Being eclipsed.',

    // ── Dignities
    domicile: ['Leo'],
    exaltation: ['Aries'],
    detriment: ['Aquarius'],
    fall: ['Libra'],

    // ── Dignity Readings
    inDomicile: 'The Sovereign on the throne. Purpose is clear, identity unquestioned. Light radiates without obstruction.',
    inExaltation: 'The Sovereign elevated. Identity finds its boldest expression — courage and self merge.',
    inDetriment: 'The Sovereign in exile. Identity disperses into the collective. The center struggles to hold.',
    inFall: 'The Sovereign in the hall of mirrors. Purpose is questioned by every other perspective. Ego must negotiate.',
    peregrine: 'The Sovereign traveling. Identity adapts to foreign territory — neither empowered nor diminished, but learning.',

    // ── Cross-Cultural Deity Essence
    deityEssence: 'Ra, Helios, Shamash, Surya, Lugh, Sol, Amaterasu, Inti, Kinich Ahau — every culture sees the same thing: the chariot crossing the sky, light as justice, gold as divine radiance. The sun deity is never just brightness. It is moral clarity. Every solstice festival across the globe marks the same moment: the light at its extreme, measuring the year.',

    // ── Physical Character
    field: "The container for the entire system. Its dipole flips every ~11 years at solar maximum — the only body that truly resets. When the field reverses, the heliosphere reorganizes.",
    fieldType: 'dipole',

    // ── Body
    organ: 'Skin',
    chakra: 'Crown',

    // ── Modern Expressions
    positive: ['wisdom', 'inspiration', 'clarity', 'leadership', 'artistic expression'],
    blocked: ['hubris', 'self-centeredness', 'dogmatism', 'refusal to see others'],

    // ── Films
    films: ['American Psycho', 'The Devil Wears Prada', 'Whiplash', 'The Great Gatsby', 'Boogie Nights'],
  },

  Moon: {
    name: 'Moon',
    glyph: '☽',
    role: 'The Mirror',
    keyword: 'feeling',
    metal: 'Silver',
    day: 'Monday',

    sin: 'Envy',
    virtue: 'Gratitude',
    archetype: 'The Rival',
    shadow: 'Consumed by comparison and resentment, unable to find joy in what it has.',
    light: 'Becomes a champion for others, celebrating their light as if it were its own.',

    sees: 'feeling, security, memory',
    theme: "The Moon reflects what it receives. Every planet is a source of emotional light — something to feel toward, respond to, protect.",
    question: 'What do I need?',
    drive: 'To feel, to remember, to protect.',
    fear: 'Abandonment. Emotional emptiness.',

    domicile: ['Cancer'],
    exaltation: ['Taurus'],
    detriment: ['Capricorn'],
    fall: ['Scorpio'],

    inDomicile: 'The Mirror in its own waters. Feeling flows without resistance — instinct and security are one.',
    inExaltation: 'The Mirror held steady. Emotion finds ground — feeling becomes embodied, sensual, reliable.',
    inDetriment: 'The Mirror frozen. Emotion is disciplined into utility — feeling must serve structure or be suppressed.',
    inFall: 'The Mirror in the underworld. Feeling meets intensity it cannot reflect away — forced to feel what it would rather forget.',
    peregrine: 'The Mirror traveling. Emotion adapts to unfamiliar territory — receptive but not rooted.',

    deityEssence: 'Selene, Luna, Khonsu, Chandra, Mani, Mama Quilla, Nanna/Sin — every culture pairs the moon with the sun and gives it the night. The moon deity is always the timekeeper: months, tides, agricultural cycles. Silver is universal. The moon reflects; it does not generate. Every tradition saw this.',

    field: 'No current magnetic field. Had one roughly 3.5 billion years ago. The dynamo died as the core cooled. Ghost imprints remain frozen in ancient rock.',
    fieldType: 'none',

    organ: 'Nervous System',
    chakra: 'Third Eye',

    positive: ['compassion', 'intuition', 'emotional intelligence', 'nurturing'],
    blocked: ['irrationality', 'hypersensitivity', 'moodiness', 'emotional manipulation'],

    films: ['The Social Network', 'Black Swan', 'The Talented Mr. Ripley', 'Mean Girls', 'Jealousy'],
  },

  Mercury: {
    name: 'Mercury',
    glyph: '☿',
    role: 'The Messenger',
    keyword: 'connection',
    metal: 'Mercury (Quicksilver)',
    day: 'Wednesday',

    sin: 'Greed',
    virtue: 'Charity',
    archetype: 'The Collector',
    shadow: 'Hoards information and resources, driven by insatiable hunger for more.',
    light: 'Becomes a generous connector, sharing knowledge freely and bridging what was separate.',

    sees: 'communication, connection, pattern',
    theme: "Mercury sees the web of relationships. Close to the Sun, every other planet is a node in the communication network — something to name, connect, translate.",
    question: 'What connects to what?',
    drive: 'To name, to link, to understand the pattern.',
    fear: 'Incoherence. The web breaking.',

    domicile: ['Gemini', 'Virgo'],
    exaltation: ['Virgo'],
    detriment: ['Sagittarius', 'Pisces'],
    fall: ['Pisces'],

    inDomicile: 'The Messenger in native territory. Communication flows, connections form effortlessly. The web is fully alive.',
    inExaltation: 'The Messenger at peak precision. Analysis and service merge — pattern recognition at its sharpest.',
    inDetriment: 'The Messenger overwhelmed by scope. Detail is lost in grand narrative or dissolved in feeling — the signal gets diffuse.',
    inFall: 'The Messenger in deep water. Logic yields to intuition. The mind must learn to swim rather than map.',
    peregrine: 'The Messenger traveling. Communication adapts to local dialect — functional but not fluent.',

    deityEssence: 'Hermes, Thoth, Odin, Nabu, Budha, Hermes Trismegistus, Tezcatlipoca, Ningishzida — every Mercury figure is a bridge: between gods and mortals, conscious and unconscious, living and dead, written and spoken. The trickster thread runs through all of them: quick-witted, shape-shifting, boundary-crossing. Quicksilver itself — fluid, transformative, impossible to hold.',

    field: 'A faint but real magnetic field — a whisper of a dipole, offset northward. Should not exist given its slow rotation. Yet it persists.',
    fieldType: 'dipole',

    organ: 'Respiratory System',
    chakra: 'Heart',

    positive: ['communication skills', 'adaptability', 'problem-solving', 'intellectual curiosity'],
    blocked: ['deception', 'dishonesty', 'manipulation', 'scattered attention'],

    films: ['The Wolf of Wall Street', 'Wall Street', 'There Will Be Blood', 'Boiler Room', 'Inside Job'],
  },

  Venus: {
    name: 'Venus',
    glyph: '♀',
    role: 'The Harmonizer',
    keyword: 'harmony',
    metal: 'Copper',
    day: 'Friday',

    sin: 'Lust',
    virtue: 'Chastity',
    archetype: 'The Seductor',
    shadow: 'Manipulates and entices, using charm for selfish gain and superficial pleasure.',
    light: 'Channels passion into deep, meaningful connection and creative endeavor. Honors the sacredness of intimacy.',

    sees: 'harmony, beauty, connection',
    theme: "Venus perceives beauty and balance. Every planet is either a source of attraction or a disruption of harmony — something to draw close or aestheticize.",
    question: 'What is beautiful here?',
    drive: 'To harmonize, to attract, to make beautiful.',
    fear: 'Ugliness. Rejection. Discord.',

    domicile: ['Taurus', 'Libra'],
    exaltation: ['Pisces'],
    detriment: ['Aries', 'Scorpio'],
    fall: ['Virgo'],

    inDomicile: 'The Harmonizer at home. Beauty is effortless — either embodied and sensual (Taurus) or relational and balanced (Libra). Attraction operates without resistance.',
    inExaltation: 'The Harmonizer in transcendence. Love dissolves boundaries — beauty becomes compassion, art becomes devotion.',
    inDetriment: 'The Harmonizer in hostile terrain. Beauty must fight for itself (Aries) or descend into intensity it cannot aestheticize (Scorpio). Harmony requires struggle.',
    inFall: 'The Harmonizer under analysis. Beauty is dissected into components — the spell breaks under scrutiny. Must find grace in precision.',
    peregrine: 'The Harmonizer traveling. Attraction adapts to unfamiliar aesthetic — appreciating without possessing.',

    deityEssence: 'Aphrodite, Venus, Ishtar, Inanna, Freya, Astarte, Isis, Shukra, Ch\'aska, Barnumbirr, Quetzalcoatl — the Venus archetype appears universally as both morning and evening star, and nearly every tradition gives it dominion over both love and war. Copper is sacred across cultures. The duality is the point: beauty and violence share a root. The goddess who enchants also destroys.',

    field: 'No intrinsic magnetic field. The solar wind meets the atmosphere directly, inducing a transient magnetosphere. Venus borrows its protection — what looks like a shield is borrowed time.',
    fieldType: 'induced',

    organ: 'Reproductive System',
    chakra: 'Sacral',

    positive: ['love', 'compassion', 'beauty', 'creativity', 'aesthetic sensitivity'],
    blocked: ['superficiality', 'vanity', 'possessiveness', 'avoidance of depth'],

    films: ['Eyes Wide Shut', 'Basic Instinct', 'Wild Things', 'Unfaithful', 'Don Jon'],
  },

  Mars: {
    name: 'Mars',
    glyph: '♂',
    role: 'The Initiator',
    keyword: 'action',
    metal: 'Iron',
    day: 'Tuesday',

    sin: 'Wrath',
    virtue: 'Patience',
    archetype: 'The Warrior',
    shadow: 'Quick to anger and aggression, reacting impulsively to perceived threats. Wrath leads to unnecessary conflict.',
    light: 'Wields strength with patience and discernment. Stands firm in adversity with calm resolve and thoughtful action.',

    sees: 'action, conflict, assertion',
    theme: "Mars sees everything as a challenge or a territory. From the first planet beyond Earth's orbit, every body is either an ally in the campaign or an obstacle to overcome.",
    question: 'What must be fought for?',
    drive: 'To act, to conquer, to defend.',
    fear: 'Impotence. Being restrained. Irrelevance in the fight.',

    domicile: ['Aries', 'Scorpio'],
    exaltation: ['Capricorn'],
    detriment: ['Taurus', 'Libra'],
    fall: ['Cancer'],

    inDomicile: 'The Warrior on home ground. Action is direct and unquestioned (Aries) or strategic and penetrating (Scorpio). The drive knows its terrain.',
    inExaltation: 'The Warrior as commander. Action serves structure — ambition and discipline merge into unstoppable forward motion.',
    inDetriment: 'The Warrior in a garden (Taurus) or a courtroom (Libra). The drive to act is slowed by pleasure or tangled in negotiation. Force must learn diplomacy.',
    inFall: 'The Warrior in the nursery. The drive to fight meets the need to nurture — aggression has nowhere productive to go. Must learn to protect without destroying.',
    peregrine: 'The Warrior abroad. Action adapts to unfamiliar rules of engagement — effective but not dominant.',

    deityEssence: 'Ares, Mars, Tyr, Nergal, Mangala, Anhur, Ogoun, Guan Yu, Melqart — every Mars figure carries iron: weapons, forges, and the blood-red color of the planet itself. The war deity is never simply violence. It is the nerve required to act when something must be fought for. Iron endures.',

    field: 'No current global magnetic field. The dynamo died billions of years ago and the atmosphere was stripped. Residual crustal anomalies in the southern hemisphere hold the shape of what was lost.',
    fieldType: 'residual',

    organ: 'Muscular System',
    chakra: 'Throat',

    positive: ['courage', 'discipline', 'assertiveness', 'willingness to stand up'],
    blocked: ['aggression', 'recklessness', 'destructive anger', 'domination'],

    films: ['Falling Down', 'Taxi Driver', 'Kill Bill: Vol. 1', 'A Clockwork Orange', 'Gran Torino'],
  },

  Jupiter: {
    name: 'Jupiter',
    glyph: '♃',
    role: 'The Expander',
    keyword: 'meaning',
    metal: 'Tin',
    day: 'Thursday',

    sin: 'Gluttony',
    virtue: 'Temperance',
    archetype: 'The Glutton',
    shadow: 'Indulges excessively, seeking comfort in material consumption. Overexpansion masks deeper emptiness.',
    light: 'Practices moderation and generosity. Savors abundance without being enslaved by it. Shares freely.',

    sees: 'expansion, meaning, generosity',
    theme: "Jupiter perceives the larger pattern. From its great orbit, the inner planets are rapid, local concerns — while Saturn is the only peer that shares its long perspective.",
    question: 'What does this mean?',
    drive: 'To expand, to include, to find the larger pattern.',
    fear: 'Meaninglessness. Contraction. A universe too small.',

    domicile: ['Sagittarius', 'Pisces'],
    exaltation: ['Cancer'],
    detriment: ['Gemini', 'Virgo'],
    fall: ['Capricorn'],

    inDomicile: 'The Expander in its kingdom. Meaning flows freely — through philosophy and adventure (Sagittarius) or compassion and mysticism (Pisces). Growth is natural.',
    inExaltation: 'The Expander nourished. Meaning finds emotional ground — generosity and feeling merge. Faith becomes embodied.',
    inDetriment: 'The Expander in tight quarters. Meaning is fragmented by detail (Virgo) or scattered across too many channels (Gemini). The big picture keeps breaking into small ones.',
    inFall: 'The Expander under restriction. Meaning must prove itself in material terms — faith meets structure and is tested. Growth earns its right to continue.',
    peregrine: 'The Expander traveling. Meaning adapts to unfamiliar contexts — curious but not yet rooted in conviction.',

    deityEssence: 'Zeus, Jupiter, Thor, Marduk, Brihaspati — every Jupiter figure commands thunder and lightning. The king of gods is never simply powerful. It is the principle of order: the one who defeated chaos (Marduk over Tiamat, Zeus over the Titans, Thor against Jormungandr). Tin is expansion and abundance — the benevolent metal of the benevolent king.',

    field: "The strongest planetary field in the solar system — 20,000 times Earth's. Its magnetosphere extends millions of kilometers, engulfing the Galilean moons. Jupiter doesn't just orbit the Sun — it carries its own magnetic kingdom.",
    fieldType: 'dipole',

    organ: 'Digestive System',
    chakra: 'Solar Plexus',

    positive: ['wisdom', 'generosity', 'leadership', 'ability to inspire'],
    blocked: ['greed', 'extravagance', 'excess', 'arrogant misuse of abundance'],

    films: ['Super Size Me', 'Se7en', 'Julie & Julia', 'Matilda', 'Spirited Away'],
  },

  Saturn: {
    name: 'Saturn',
    glyph: '♄',
    role: 'The Keeper',
    keyword: 'structure',
    metal: 'Lead',
    day: 'Saturday',

    sin: 'Sloth',
    virtue: 'Diligence',
    archetype: 'The Dreamer',
    shadow: 'Paralyzed by apathy and inaction, retreating into fantasy to escape the demands of reality.',
    light: 'Harnesses visionary nature with purpose and perseverance. Pursues dreams through sustained effort and dedication.',

    sees: 'structure, time, limitation',
    theme: "Saturn sees from the boundary. At the edge of the visible solar system, every planet is measured against time. Nothing escapes Saturn's question: will this last?",
    question: 'Will this endure?',
    drive: 'To structure, to preserve, to test against time.',
    fear: 'Dissolution. The collapse of what was built. Time running out.',

    domicile: ['Capricorn', 'Aquarius'],
    exaltation: ['Libra'],
    detriment: ['Cancer', 'Leo'],
    fall: ['Aries'],

    inDomicile: 'The Keeper on the throne. Structure is sovereign — through ambition and mastery (Capricorn) or through systems and collective order (Aquarius). Time serves the builder.',
    inExaltation: 'The Keeper as judge. Structure finds balance — discipline and fairness merge. The law serves justice rather than control.',
    inDetriment: 'The Keeper in emotional territory (Cancer) or in the spotlight (Leo). Structure is softened by feeling or challenged by the need to shine. The walls must breathe.',
    inFall: 'The Keeper ambushed. Structure meets raw initiative — the impulse to act has no patience for walls or protocols. Must learn that some things are built by starting, not planning.',
    peregrine: 'The Keeper traveling. Structure adapts to foreign ground — maintaining discipline without rigidity.',

    deityEssence: 'Cronus, Saturn, Shani, Ninurta, Enki — Saturn is always time, always the father, always the one who devours and is overthrown. The Saturnalia inverts the order: the master serves the slave, reminding the structure that it exists to serve. Lead is the heaviest of the classical metals. Shani is karma itself — not punishment, but consequence. Every culture knew: time tests everything.',

    field: "Saturn's magnetic field is an anomaly — its dipole is aligned almost perfectly with the rotation axis, less than one degree of tilt. Every other magnetized body shows significant offset. The keeper's field is unnervingly orderly.",
    fieldType: 'dipole',

    organ: 'Skeletal System',
    chakra: 'Root',

    positive: ['discipline', 'patience', 'wisdom', 'ability to plan long-term'],
    blocked: ['fearfulness', 'inflexibility', 'rigidity', 'resistance to change'],

    films: ['Office Space', 'The Big Lebowski', "Ferris Bueller's Day Off", 'Clerks', 'Idiocracy'],
  },
};

// ── Dignity Weight Score ──────────────────────────────────────────────────────

export const DIGNITY_WEIGHTS = {
  domicile: 2,
  exaltation: 1,
  peregrine: 0,
  detriment: -1,
  fall: -2,
};

/**
 * Get numeric dignity weight for a planet in a given sign.
 * domicile +2, exaltation +1, peregrine 0, detriment -1, fall -2
 */
export function getDignityWeight(planet, sign) {
  const state = getDignity(planet, sign);
  return DIGNITY_WEIGHTS[state] ?? 0;
}

// ── Voice modifiers per dignity state ─────────────────────────────────────────

export const DIGNITY_VOICE = {
  Sun: {
    voiceInDomicile: 'commands with natural authority — the Sovereign on the throne',
    voiceInExaltation: 'blazes with bold confidence — elevated beyond doubt',
    voiceInDetriment: 'diffuses into the collective — the center struggles to hold',
    voiceInFall: 'negotiates where it would prefer to declare — authority questioned at every turn',
    voicePeregrine: 'adapts without losing core identity — learning a foreign dialect of power',
  },
  Moon: {
    voiceInDomicile: 'flows without resistance — feeling and instinct are one',
    voiceInExaltation: 'grounds emotion in the body — steady, sensual, reliable',
    voiceInDetriment: 'structures feeling into duty — emotion must serve or be suppressed',
    voiceInFall: 'meets intensity it cannot deflect — forced into depths it would rather avoid',
    voicePeregrine: 'reads the room without deep attachment — receptive but not rooted',
  },
  Mercury: {
    voiceInDomicile: 'weaves connections effortlessly — the network hums',
    voiceInExaltation: 'analyzes with surgical precision — pattern at its sharpest',
    voiceInDetriment: 'loses detail in grand narrative — the signal diffuses',
    voiceInFall: 'trades logic for intuition — the map dissolves into feeling',
    voicePeregrine: 'communicates in borrowed vocabulary — functional but not fluent',
  },
  Venus: {
    voiceInDomicile: 'attracts without effort — beauty in its natural element',
    voiceInExaltation: 'dissolves into compassion — love without boundaries',
    voiceInDetriment: 'fights for beauty — harmony requires struggle',
    voiceInFall: 'dissects beauty into components — the spell breaks under analysis',
    voicePeregrine: 'appreciates without possessing — a tourist in unfamiliar aesthetics',
  },
  Mars: {
    voiceInDomicile: 'strikes with precision and confidence — the warrior on home ground',
    voiceInExaltation: 'channels force into strategy — ambition and discipline fused',
    voiceInDetriment: 'is tangled in diplomacy — the blade is blunted by negotiation',
    voiceInFall: 'cannot find a target — aggression without direction, force without a fight',
    voicePeregrine: 'adapts its tactics — effective but operating under unfamiliar rules',
  },
  Jupiter: {
    voiceInDomicile: 'expands freely — meaning flows without obstruction',
    voiceInExaltation: 'roots meaning in emotion — generosity becomes embodied',
    voiceInDetriment: 'scatters across details — the big picture fragments',
    voiceInFall: 'must prove faith in material terms — expansion meets the gate of structure',
    voicePeregrine: 'explores without conviction — curious but not yet committed',
  },
  Saturn: {
    voiceInDomicile: 'builds with full authority — time serves the architect',
    voiceInExaltation: 'balances structure with justice — the judge in fair court',
    voiceInDetriment: 'is softened by feeling — the walls must breathe or break',
    voiceInFall: 'is overwhelmed by impulse — patience shattered by raw initiative',
    voicePeregrine: 'maintains discipline in foreign terrain — orderly but not dominant',
  },
};

/**
 * Get the voice modifier string for a planet's current dignity state.
 */
export function getDignityVoice(planet, sign) {
  const voices = DIGNITY_VOICE[planet];
  if (!voices) return '';
  const state = getDignity(planet, sign);
  switch (state) {
    case 'domicile': return voices.voiceInDomicile;
    case 'exaltation': return voices.voiceInExaltation;
    case 'detriment': return voices.voiceInDetriment;
    case 'fall': return voices.voiceInFall;
    default: return voices.voicePeregrine;
  }
}

// ── Vision character (for deep carried experience) ────────────────────────────

export const VISION_CHARACTERS = {
  Sun: {
    innerOuter: 'center',
    orbitalSpeed: 'N/A (reference)',
    sunProximity: 0,
    uniqueVantage: 'Sees everything arranged around itself — the only body for which the heliocentric view IS the native view.',
    blindSpot: 'Cannot see itself. Has no perspective on its own nature except through reflection.',
    carried: 'The Sun carries no displaced experience — it IS the reference frame. Its "carried" quality is the absence of displacement.',
  },
  Moon: {
    innerOuter: 'satellite',
    orbitalSpeed: '~13\u00B0/day (fastest)',
    sunProximity: '~1 AU (Earth-bound)',
    uniqueVantage: "Sees the entire system from Earth's orbit but changes perspective fastest of all \u2014 the emotional weather shifts hourly.",
    blindSpot: "Cannot escape Earth's gravity well. Everything is filtered through the Earth relationship.",
    carried: 'The Moon carries the fastest-shifting perspective. What it saw an hour ago may already be irrelevant. Its carried experience is volatility itself.',
  },
  Mercury: {
    innerOuter: 'inner',
    orbitalSpeed: '~1.6°/day',
    sunProximity: '0.39 AU (closest)',
    uniqueVantage: 'Sees everything clustered near the Sun — from Mercury, the other planets are distant points against a solar glare.',
    blindSpot: "Never sees more than 28\u00B0 from the Sun from Earth's perspective. The Messenger is always tethered to the Center.",
    carried: 'Mercury carries the experience of proximity to power. Its carried view is claustrophobic — everything is the Sun, and everything else is far away.',
  },
  Venus: {
    innerOuter: 'inner',
    orbitalSpeed: '~1.2°/day',
    sunProximity: '0.72 AU',
    uniqueVantage: 'Sees the inner solar system as a tight cluster and the outer planets as distant, slow-moving presences.',
    blindSpot: "Never sees more than 47\u00B0 from the Sun from Earth's perspective. Beauty is always close to identity.",
    carried: "Venus carries the experience of being nearly Earth's twin in size but utterly different in nature \u2014 proximity without kinship.",
  },
  Mars: {
    innerOuter: 'outer',
    orbitalSpeed: '~0.5°/day',
    sunProximity: '1.52 AU',
    uniqueVantage: 'First planet beyond Earth — sees the inner planets as a tight knot around the Sun, with Earth as just another inner world.',
    blindSpot: "From Mars, Earth looks small and close to the Sun. The ego's entire world is a bright dot.",
    carried: 'Mars carries the first truly "outside" perspective. Its carried experience includes seeing Earth — and therefore the geocentric chart — as just one view among many.',
  },
  Jupiter: {
    innerOuter: 'outer',
    orbitalSpeed: '~0.08°/day',
    sunProximity: '5.2 AU',
    uniqueVantage: "Sees the entire inner solar system as a compact cluster \u2014 Sun, Mercury, Venus, Earth, Mars all within a few degrees from Jupiter's vantage.",
    blindSpot: "The inner planets move too fast to track individually. Only Saturn shares Jupiter's temporal scale.",
    carried: 'Jupiter carries the grand perspective — everything inner is rapid and local. Its carried experience is one of overview, where individual planet dramas merge into a single inner-system phenomenon.',
  },
  Saturn: {
    innerOuter: 'outer',
    orbitalSpeed: '~0.03°/day',
    sunProximity: '9.5 AU',
    uniqueVantage: "Sees the whole system spread out below \u2014 every planet is inner from Saturn's vantage. The boundary keeper observes everything.",
    blindSpot: 'Everything moves faster than Saturn. What looks stable from Earth is flickering from this distance.',
    carried: 'Saturn carries the longest view. Its carried experience encompasses the entire visible system, but everything it sees is already in the past — light takes over an hour to arrive.',
  },
};

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get the dignity state of a planet in a given sign.
 * @param {string} planet — 'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'
 * @param {string} sign — one of the 12 zodiac signs
 * @returns {'domicile'|'exaltation'|'detriment'|'fall'|'peregrine'}
 */
export function getDignity(planet, sign) {
  const d = PLANET_DIGNITIES[planet];
  if (!d) return 'peregrine';
  if (d.domicile.includes(sign)) return 'domicile';
  if (d.exaltation.includes(sign)) return 'exaltation';
  if (d.detriment.includes(sign)) return 'detriment';
  if (d.fall.includes(sign)) return 'fall';
  return 'peregrine';
}

/**
 * Get the character reading for a planet's current dignity state.
 * @param {string} planet
 * @param {string} sign
 * @returns {string} — narrative sentence describing the planet in this dignity
 */
export function getDignityReading(planet, sign) {
  const char = PLANET_CHARACTERS[planet];
  if (!char) return '';
  const state = getDignity(planet, sign);
  switch (state) {
    case 'domicile': return char.inDomicile;
    case 'exaltation': return char.inExaltation;
    case 'detriment': return char.inDetriment;
    case 'fall': return char.inFall;
    default: return char.peregrine;
  }
}
