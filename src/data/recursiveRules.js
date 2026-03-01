/**
 * recursiveRules.js — Interpretive data for the recursive astrology page.
 *
 * Structured rules for generating deterministic readings from computed data.
 * No AI generation — all interpretation is template-based.
 */

// ── Planet colors (canonical — matches OrbitalDiagram.js) ────────────────────

export const PLANET_COLORS = {
  Sun: '#f0c040',
  Moon: '#c8d8e8',
  Mercury: '#b8b8c8',
  Venus: '#e8b060',
  Mars: '#d06040',
  Jupiter: '#a0b8c0',
  Saturn: '#908070',
  Earth: '#4a9bd9',
};

// ── Planet perspective themes ────────────────────────────────────────────────

export const PERSPECTIVE_THEMES = {
  Sun: {
    label: 'the Center',
    symbol: '☉',
    color: '#f0c040',
    keyword: 'identity',
    theme: 'Everything radiates from purpose. From the Sun\'s position, the planets are satellites of meaning — each one a facet of the Self\'s expression.',
    sees: 'identity, purpose, vitality',
  },
  Moon: {
    label: 'the Mirror',
    symbol: '☽',
    color: '#c8d8e8',
    keyword: 'feeling',
    theme: 'The Moon reflects what it receives. From its perspective, every planet is a source of emotional light — something to feel toward, respond to, protect.',
    sees: 'feeling, security, memory',
  },
  Mercury: {
    label: 'the Messenger',
    symbol: '☿',
    color: '#b8b8c8',
    keyword: 'connection',
    theme: 'Mercury sees the web of relationships. From its orbit close to the Sun, every other planet is a node in the communication network — something to name, connect, translate.',
    sees: 'communication, connection, pattern',
  },
  Venus: {
    label: 'the Harmonizer',
    symbol: '♀',
    color: '#e8b060',
    keyword: 'harmony',
    theme: 'Venus perceives beauty and balance. From its position, every planet is either a source of attraction or a disruption of harmony — something to draw close or aestheticize.',
    sees: 'harmony, beauty, connection',
  },
  Mars: {
    label: 'the Initiator',
    symbol: '♂',
    color: '#d06040',
    keyword: 'action',
    theme: 'Mars sees everything as a challenge or a territory. From the first planet beyond Earth\'s orbit, every body is either an ally in the campaign or an obstacle to overcome.',
    sees: 'action, conflict, assertion',
  },
  Jupiter: {
    label: 'the Expander',
    symbol: '♃',
    color: '#a0b8c0',
    keyword: 'meaning',
    theme: 'Jupiter perceives the larger pattern. From its great orbit, the inner planets are rapid, local concerns — while Saturn is the only peer that shares its long perspective.',
    sees: 'expansion, meaning, generosity',
  },
  Saturn: {
    label: 'the Keeper',
    symbol: '♄',
    color: '#908070',
    keyword: 'structure',
    theme: 'Saturn sees from the boundary. At the edge of the visible solar system, every planet is measured against time. Nothing escapes Saturn\'s question: will this last?',
    sees: 'structure, time, limitation',
  },
};

// ── Weather descriptions (date-only, no birth data) ────────────────────────

export const WEATHER_DESCRIPTIONS = {
  geocentric: {
    title: "Today's Celestial Weather",
    description: 'The current sky as seen from Earth — the same sky everyone shares. These positions describe the planetary configuration right now, independent of any birth chart.',
  },
  heliocentric: {
    title: "The Sun's Current Sky",
    description: 'The same moment seen from the center. The objective layout of the solar system right now.',
  },
};

// ── Zodiac frame descriptions (tropical vs sidereal) ────────────────────────

export const ZODIAC_FRAME_DESCRIPTIONS = {
  tropical: {
    title: 'Tropical (Western)',
    description: 'Anchored to the vernal equinox — 0° Aries is always the spring point. The zodiac tracks seasons, not stars. This is the frame of embodied experience: what the Earth\'s tilt makes you feel.',
  },
  sidereal: {
    title: 'Sidereal (Vedic)',
    description: 'Anchored to the fixed stars. Due to axial precession, the sidereal zodiac has drifted ~24° from the tropical. Where the tropical frame tracks the body\'s seasons, the sidereal frame tracks the cosmic backdrop — the actual constellations behind the planets.',
  },
  ayanamsa: 'The gap between tropical and sidereal is the ayanamsa — currently ~24° (Lahiri). It grows by ~1° every 72 years as Earth\'s axis slowly precesses. This means your tropical Sun sign and your sidereal Sun sign may differ. Neither is wrong. They are two coordinate systems measuring the same sky.',
};

// ── Special perspective descriptions ─────────────────────────────────────────

export const PERSPECTIVE_DESCRIPTIONS = {
  geocentric: {
    label: 'Your Sky',
    title: 'Geocentric — The Ordinary World',
    description: 'Your sky at birth — the ordinary world. These are the positions as seen from Earth, from your location, at your moment. This is the absolutely real perspective of the body, the ego\'s experience of the cosmos.',
  },
  heliocentric: {
    label: 'The Center',
    title: 'Heliocentric — The Nadir',
    description: 'The view from the center. From the Sun\'s position, the planets form different patterns. This is the deeper structure beneath your surface chart — the Self\'s perspective, the truth that the ego\'s view is organized around.',
  },
  reading: {
    label: 'Full Reading',
    title: 'The Recursive Reading',
    description: 'The complete journey through all perspectives — from surface to center and back.',
  },
};

// ── Perspective views (auto-derived for selectors) ───────────────────────────

export const PERSPECTIVE_VIEWS = [
  { key: 'geocentric', symbol: '⊕', label: PERSPECTIVE_DESCRIPTIONS.geocentric.label, group: 'frame' },
  { key: 'heliocentric', symbol: '☉', label: PERSPECTIVE_DESCRIPTIONS.heliocentric.label, group: 'frame' },
  ...Object.entries(PERSPECTIVE_THEMES).map(([key, t]) => ({
    key,
    symbol: t.symbol,
    label: `${key}'s Sky`,
    group: 'planet',
  })),
  { key: 'reading', symbol: '∞', label: PERSPECTIVE_DESCRIPTIONS.reading.label, group: 'reading' },
];

// ── Perspective shift description templates ──────────────────────────────────

export const PERSPECTIVE_SHIFTS = {
  signChange: '{planet} shifts from {fromSign} to {toSign} — what appeared as {fromSign} energy in your sky becomes {toSign} from this vantage.',
  stable: '{planet} remains in {fromSign} — this placement holds across perspectives.',
  largeShift: '{planet} moves {degreeDelta}° — a significant reframing of this energy.',
  smallShift: '{planet} adjusts by {degreeDelta}° within {fromSign} — a subtle refinement, not a transformation.',
};

// ── Aspect interpretation by perspective ─────────────────────────────────────

export const ASPECT_MEANINGS = {
  Conjunction: {
    general: 'fusion, intensification, merging of energies',
    fromObserver: '{observer} absorbs {target}\'s nature — they become indistinguishable in this arena.',
    observerNuance: {
      Sun: 'The Self merges with {target} — this energy is inseparable from identity.',
      Moon: 'Feeling and {target} fuse — this is where emotion and instinct are one.',
      Mars: 'Action and {target} become the same impulse — no separation between drive and expression.',
      Venus: 'Beauty and {target} merge — attraction operates through this channel without mediation.',
      Mercury: 'Mind and {target} unify — thought automatically takes this form.',
      Jupiter: 'Meaning and {target} expand together — faith lives in this combination.',
      Saturn: 'Structure absorbs {target} — this becomes load-bearing, non-negotiable.',
    },
  },
  Sextile: {
    general: 'opportunity, gentle flow, creative exchange',
    fromObserver: '{observer} finds easy access to {target}\'s gifts — a door that opens when approached.',
    observerNuance: {
      Sun: 'Purpose finds natural support from {target} — talent that serves identity.',
      Moon: 'Feeling flows easily toward {target} — comfort without effort.',
      Mars: 'Action finds helpful channels through {target} — momentum without resistance.',
      Venus: 'Harmony and {target} exchange easily — beauty appears when these meet.',
      Mercury: 'The mind connects easily with {target} — understanding comes without force.',
      Jupiter: 'Growth finds natural allies in {target} — expansion meets opportunity.',
      Saturn: 'Structure accommodates {target} gracefully — discipline and ease coexist.',
    },
  },
  Square: {
    general: 'tension, challenge, forced growth',
    fromObserver: '{observer} experiences {target} as friction — a force that demands action and won\'t be ignored.',
    observerNuance: {
      Sun: 'Identity is challenged by {target} — the Self must actively engage what resists it.',
      Moon: 'Feeling meets friction from {target} — emotional security is tested.',
      Mars: 'Action collides with {target} — the drive must push through or redirect.',
      Venus: 'Harmony is disrupted by {target} — beauty requires struggle to achieve.',
      Mercury: 'The mind encounters resistance from {target} — understanding requires effort.',
      Jupiter: 'Expansion meets limitation from {target} — growth must be earned.',
      Saturn: 'Structure is stressed by {target} — what endures is tested by what won\'t comply.',
    },
  },
  Trine: {
    general: 'flow, natural talent, effortless exchange',
    fromObserver: '{observer} and {target} share a natural resonance — their energies harmonize without effort.',
    observerNuance: {
      Sun: 'Purpose and {target} flow together — identity and this energy are in natural accord.',
      Moon: 'Feeling resonates with {target} — emotional life is enriched without struggle.',
      Mars: 'Action and {target} harmonize — drive finds its natural expression here.',
      Venus: 'Beauty and {target} are in natural accord — attraction operates effortlessly.',
      Mercury: 'Mind and {target} resonate — understanding is intuitive, not constructed.',
      Jupiter: 'Meaning and {target} flow together — expansion feels natural and generous.',
      Saturn: 'Structure and {target} align — what endures and what flows share the same current.',
    },
  },
  Opposition: {
    general: 'polarity, awareness through contrast, relationship axis',
    fromObserver: '{observer} sees {target} as the mirror — the quality most needed, projected outward.',
    observerNuance: {
      Sun: 'Identity faces {target} as its complement — what the Self most needs to integrate.',
      Moon: 'Feeling is mirrored by {target} — the emotional lesson lies in what\'s projected.',
      Mars: 'Action confronts {target} directly — the opponent reveals what the warrior must become.',
      Venus: 'Desire projects {target} outward — the beloved carries the unlived quality.',
      Mercury: 'Mind encounters its opposite in {target} — understanding requires seeing the other side.',
      Jupiter: 'Meaning is reflected by {target} — the truth requires both poles.',
      Saturn: 'Structure faces {target} as its shadow — what endures must acknowledge what it excludes.',
    },
  },
  Quincunx: {
    general: 'adjustment, incompatibility, creative tension without resolution',
    fromObserver: '{observer} and {target} share no common ground — they must adjust without the comfort of harmony or the clarity of opposition.',
    observerNuance: {
      Sun: 'Identity must accommodate {target} without understanding why — an adjustment that never resolves into comfort.',
      Moon: 'Feeling encounters {target} at an angle that won\'t harmonize — emotional logic fails here.',
      Mars: 'Action and {target} operate on incompatible frequencies — effort must constantly recalibrate.',
      Venus: 'Beauty and {target} don\'t speak the same language — attraction operates through bewilderment.',
      Mercury: 'Mind and {target} produce a signal that can\'t be decoded through normal channels.',
      Jupiter: 'Expansion meets {target} at an awkward angle — growth requires surrendering the map.',
      Saturn: 'Structure encounters {target} as an anomaly — what endures cannot categorize this energy.',
    },
  },
};

// ── Zodiac SVG path glyphs (from OrbitalDiagram.js — ~16×16 viewBox at 0,0) ─

export const ZODIAC_GLYPHS = {
  Aries: 'M-5,6 C-5,-2 -1,-7 0,-7 C1,-7 5,-2 5,6 M0,-7 L0,7',
  Taurus: 'M-6,-4 C-6,-8 6,-8 6,-4 M0,-4 C-4,-4 -6,0 -6,3 C-6,6 -3,7 0,7 C3,7 6,6 6,3 C6,0 4,-4 0,-4',
  Gemini: 'M-6,-7 C-2,-5 2,-5 6,-7 M-6,7 C-2,5 2,5 6,7 M-3,-6 L-3,6 M3,-6 L3,6',
  Cancer: 'M-6,-1 C-6,-5 0,-5 3,-3 M6,1 C6,5 0,5 -3,3 M-4,-1 A2,2 0 1,1 -4,-1.01 M4,1 A2,2 0 1,1 4,1.01',
  Leo: 'M-5,5 C-5,1 -2,-2 0,-2 C2,-2 4,0 4,3 C4,5 3,6 2,6 M0,-2 C-2,-2 -4,-5 -2,-7 C0,-8 3,-7 4,-5',
  Virgo: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,4 C3,6 5,4 6,2 M3,4 C4,6 6,7 7,5',
  Libra: 'M-7,3 L7,3 M-5,0 C-5,-4 5,-4 5,0 M-7,6 L7,6',
  Scorpio: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,6 L5,4 M3,6 L5,8',
  Sagittarius: 'M-5,7 L6,-6 M6,-6 L1,-6 M6,-6 L6,-1 M-3,2 L3,-4',
  Capricorn: 'M-7,2 C-7,-4 -3,-7 0,-4 L0,4 C0,7 3,8 5,6 C7,4 6,1 4,1 C2,1 1,3 2,5',
  Aquarius: 'M-7,-2 L-4,-5 L-1,-2 L2,-5 L5,-2 M-7,2 L-4,-1 L-1,2 L2,-1 L5,2',
  Pisces: 'M-6,0 L6,0 M-3,-7 C-6,-4 -6,4 -3,7 M3,-7 C6,-4 6,4 3,7',
};

// ── Monomyth stage mapping ───────────────────────────────────────────────────

export const MONOMYTH_STAGES = [
  {
    stage: 1,
    name: 'Golden Age',
    perspective: 'geocentric',
    description: 'The surface chart — your ordinary world. The sky as your body knows it.',
  },
  {
    stage: 2,
    name: 'The Calling',
    perspective: 'departure',
    description: 'The first shift: noticing that the geocentric view isn\'t the only one. Something deeper is calling.',
  },
  {
    stage: 3,
    name: 'Crater Crossing',
    perspective: 'heliocentric',
    description: 'Crossing into heliocentric view — leaving the ego\'s sky for the Self\'s perspective. The planets rearrange.',
  },
  {
    stage: 4,
    name: 'Trials of Forge',
    perspective: 'planet-perspectives',
    description: 'Each planet\'s carried experience. What Mars sees, what Venus holds, what Saturn knows. The recursive depth.',
  },
  {
    stage: 5,
    name: 'The Quench',
    perspective: 'integration-point',
    description: 'The nadir — the moment where all perspectives are held simultaneously. The recursive network reveals itself.',
  },
  {
    stage: 6,
    name: 'Integration',
    perspective: 'synthesis',
    description: 'How the carried experiences color your geocentric chart. The depth that lives inside the surface.',
  },
  {
    stage: 7,
    name: 'The Draw',
    perspective: 'return',
    description: 'Returning to the geocentric view — but now you know what each planet carries. The ordinary becomes extraordinary.',
  },
  {
    stage: 8,
    name: 'Age of Steel',
    perspective: 'solar-cycle',
    description: 'The meta-container. The Sun\'s magnetic field resets every ~11 years. You carry continuity through the flip.',
  },
];

// ── Solar cycle interpretive rules ───────────────────────────────────────────

export const SOLAR_CYCLE_RULES = {
  ascending: {
    phase: 'Ascending toward maximum',
    meaning: 'Solar activity building — expanding influence, intensifying magnetic field. The Sun gathers force.',
    quality: 'Building intensity, expanding influence, creative surge',
  },
  solarMax: {
    phase: 'Solar maximum',
    meaning: 'Polarity flip — the Sun\'s magnetic field reverses. A transformation point. The old field dissolves; the new one hasn\'t fully formed.',
    quality: 'Transformation, field reset, maximum expression',
  },
  descending: {
    phase: 'Descending toward minimum',
    meaning: 'Solar activity quieting — the new polarity consolidates. Integration of what the maximum revealed.',
    quality: 'Integration, consolidation, deepening',
  },
  solarMin: {
    phase: 'Solar minimum',
    meaning: 'The quiet between cycles. Seeds of the next cycle form in the deep. Potential energy gathering before the next rise.',
    quality: 'Quiet seeding, new cycle potential, latent power',
  },
};

/**
 * Get the interpretive solar cycle rule for a given phase value.
 * @param {number} phase — 0 to 1
 * @param {boolean} ascending
 */
export function getSolarCycleRule(phase, ascending) {
  if (phase < 0.05 || phase > 0.95) return SOLAR_CYCLE_RULES.solarMin;
  if (phase > 0.4 && phase < 0.6) return SOLAR_CYCLE_RULES.solarMax;
  if (ascending) return SOLAR_CYCLE_RULES.ascending;
  return SOLAR_CYCLE_RULES.descending;
}

// ── Reading section templates ────────────────────────────────────────────────

export const READING_SECTIONS = {
  geocentric: {
    title: 'I. The Ordinary World',
    intro: 'Your birth chart as seen from Earth — the starting point of every astrological journey. These positions describe what your body, your ego, your embodied self was born into.',
  },
  departure: {
    title: 'II. The Departure',
    intro: 'What changes when we leave Earth\'s perspective? The heliocentric chart rearranges the familiar — planets shift signs, aspects dissolve and reform. This is the call to look deeper.',
  },
  perspectives: {
    title: 'III. The Carried Experience',
    intro: 'Each planet has its own sky. What Mars sees from its orbit colors how Mars shows up in your chart. These are the inner lives of your planetary placements.',
  },
  integration: {
    title: 'IV. The Integration',
    intro: 'Every planet in your geocentric chart carries the weight of its own perspective. The recursive network doesn\'t have a bottom — each planet\'s chart contains every other planet, forming a continuous web of mutual awareness.',
  },
  solarCycle: {
    title: 'V. The Solar Container',
    intro: 'The Sun\'s magnetic field is the meta-rhythm. Its ~11-year cycle, with polarity flips at maximum, is the largest container your chart inhabits. Only the Sun truly resets — everything else maintains continuity through the flip.',
  },
};

// ── Planet symbols and Earth ─────────────────────────────────────────────────

export const PLANET_GLYPHS = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Earth: '⊕',
};

export const ASPECT_COLORS = {
  Conjunction: '#c9a961',
  Sextile: '#5fa87f',
  Square: '#c4553a',
  Trine: '#4a7fb5',
  Quincunx: '#9b7fd9',
  Opposition: '#c4553a',
};

export const ZODIAC_SYMBOLS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
];

// ── EM field reading section ─────────────────────────────────────────────────

// ── Weather reading section templates (date-only, no birth data) ─────────────

export const WEATHER_READING_SECTIONS = {
  synopsis: {
    title: 'Synopsis',
  },
  geocentric: {
    title: 'I. The Shared Sky',
    intro: 'The current sky as seen from Earth. This is the collective weather — the field everyone walks through today.',
  },
  departure: {
    title: 'II. The Deeper Structure',
    intro: 'The same moment from the Sun\'s perspective. When the center looks outward, the pattern shifts. What changes sign reveals what the surface view conceals.',
  },
  perspectives: {
    title: 'III. The Carried Experience',
    intro: 'Each planet sees the system from its own orbit. What Mars carries today colors every Mars-related theme. These are the inner textures beneath the weather.',
  },
  integration: {
    title: 'IV. The Web',
    intro: 'Every perspective contains every other. The recursive network has no single correct view — only the web of mutual awareness that all views form together.',
  },
  solarCycle: {
    title: 'V. The Container',
    intro: 'The Sun\'s magnetic field holds the entire system. Its ~11-year cycle is the largest rhythm the chart inhabits.',
  },
};

export const EM_READING_SECTION = {
  title: 'VI. The Magnetic Architecture',
  intro: 'Beneath the geometric sky, each body carries — or fails to carry — a magnetic identity. The dipole is the invisible spine: a field that holds space, deflects the solar wind, and defines a boundary between self and environment. Some bodies generate their own; others borrow from the Sun; others lost theirs long ago.',
};

// ── House meanings ───────────────────────────────────────────────────────────

export const HOUSE_MEANINGS = {
  1:  { name: 'Self',            keyword: 'identity',        theme: 'The body, the persona, the mask you wear and the face that launches the chart. Everything begins here.' },
  2:  { name: 'Resources',       keyword: 'value',           theme: 'What you own, what you value, what you build with. Material security and self-worth.' },
  3:  { name: 'Communication',   keyword: 'connection',      theme: 'The immediate environment — siblings, neighbors, daily travel, the mind at work in local territory.' },
  4:  { name: 'Home',            keyword: 'roots',           theme: 'The foundation — home, family of origin, the private self, the ground you stand on.' },
  5:  { name: 'Creativity',      keyword: 'expression',      theme: 'What you create, what you enjoy, what you play with. Children, romance, art, risk.' },
  6:  { name: 'Service',         keyword: 'craft',           theme: 'Daily work, health, duty, the body as instrument. What you maintain and what maintains you.' },
  7:  { name: 'Partnership',     keyword: 'relationship',    theme: 'The other — partners, adversaries, mirrors. Where you meet what you are not.' },
  8:  { name: 'Transformation',  keyword: 'depth',           theme: 'Shared resources, death, inheritance, intimacy, power. What you cannot control.' },
  9:  { name: 'Philosophy',      keyword: 'meaning',         theme: 'The larger pattern — travel, higher education, law, religion, the search for what it all means.' },
  10: { name: 'Vocation',        keyword: 'calling',         theme: 'Public role, career, reputation, legacy. What the world sees when it looks at you.' },
  11: { name: 'Community',       keyword: 'belonging',       theme: 'Groups, friends, hopes, the collective. Where individual purpose meets the social field.' },
  12: { name: 'Unconscious',     keyword: 'dissolution',     theme: 'Hidden enemies, isolation, the unconscious, dreams, surrender. What lies behind the visible.' },
};

export const ANGLE_MEANINGS = {
  Ascendant:  { keyword: 'persona',    theme: 'The rising sign — the lens through which you engage the world. Not who you are, but how you arrive.' },
  Midheaven:  { keyword: 'vocation',   theme: 'The highest point of the chart — public role, aspiration, what you build toward in the visible world.' },
  Descendant: { keyword: 'encounter',  theme: 'The setting point — what you seek in others, the qualities you project outward.' },
  IC:         { keyword: 'foundation', theme: 'The deepest point — private self, ancestral ground, the roots beneath the visible life.' },
};

export const LUNAR_NODE_MEANINGS = {
  northNode: {
    keyword: 'growth',
    theme: 'The direction of development — what the soul is reaching toward. Unfamiliar, uncomfortable, necessary.',
    inSign: 'The North Node in {sign} asks for growth through {keyword} — the qualities of {sign} are the curriculum, not the comfort zone.',
  },
  southNode: {
    keyword: 'experience',
    theme: 'The accumulated past — what comes naturally, what has been mastered, what can become a trap if clung to.',
    inSign: 'The South Node in {sign} carries mastery of {keyword} — the gifts of {sign} are the foundation, but not the destination.',
  },
};

export const PART_OF_FORTUNE_MEANING = {
  keyword: 'integration',
  theme: 'Where the Sun, Moon, and Ascendant converge — the point of natural harmony between identity, feeling, and worldly engagement.',
  inSign: 'The Part of Fortune in {sign} suggests that fulfillment flows most naturally through {keyword} qualities.',
};

export const MUTUAL_RECEPTION_MEANING = {
  keyword: 'exchange',
  theme: 'Two planets occupying each other\'s home signs create a mutual support channel — each planet can draw on the other\'s strength. What one lacks in its current position, the other provides.',
};

export const EM_FIELD_MEANINGS = {
  dipole: 'A coherent magnetic identity — a field that holds space, generated from within. The body sustains its own boundary against the solar wind.',
  none: 'No magnetic shield — the solar wind meets the surface directly. What once may have been protected is now exposed.',
  residual: 'Ghost of a former field — magnetism frozen in ancient rock. The dynamo has died, but the crust remembers.',
  induced: 'A field borrowed from the solar wind — not generated, but shaped by contact. Protection that exists only as long as the pressure continues.',
};

// ── Transit activation meanings ──────────────────────────────────────────────

export const TRANSIT_ACTIVATION_MEANINGS = {
  // Slow planets to luminaries — the most impactful transits
  'Saturn-Sun': 'Saturn tests the structure of identity. What was built on solid ground survives; what was performance collapses under the weight.',
  'Saturn-Moon': 'Saturn meets the emotional body. Feelings are tested against reality. Security structures are examined and rebuilt.',
  'Saturn-Ascendant': 'Saturn crosses the threshold of self-presentation. The mask is tested. What remains is what is real.',
  'Saturn-MC': 'Saturn reaches the peak of the chart. Career, public role, and legacy are measured against time.',
  'Jupiter-Sun': 'Jupiter expands identity. The Self is invited to grow — opportunity arrives, but so does the temptation of excess.',
  'Jupiter-Moon': 'Jupiter expands the emotional field. Feelings become generous, hopeful, possibly inflated. The heart opens.',
  'Jupiter-Ascendant': 'Jupiter crosses the rising sign. The persona expands — new opportunities, increased visibility, broader horizons.',
  'Jupiter-MC': 'Jupiter reaches the Midheaven. Professional expansion, public recognition, or a larger platform.',
  'Saturn-Mars': 'Discipline meets drive. Action is restrained, focused, or frustrated. The lesson is strategic patience.',
  'Saturn-Venus': 'Structure meets harmony. Relationships are tested. Beauty must prove its durability.',
  'Jupiter-Mars': 'Expansion meets action. The drive amplifies. Risk increases alongside opportunity.',
  'Jupiter-Venus': 'Expansion meets beauty. Love and creativity flourish — generosity in relationships.',
  'Saturn-Mercury': 'Structure meets the mind. Thinking becomes serious, precise, or burdened. Communication contracts.',
  'Saturn-Jupiter': 'The two social planets meet. Expansion encounters limitation. Growth meets reality.',
  'Jupiter-Saturn': 'The same axis from the other side. Limitation encounters expansion. Structure finds room to breathe.',
  'Jupiter-Mercury': 'Expansion meets the mind. Thinking broadens. The pattern-seeker finds larger patterns.',
  'Mars-Sun': 'Action activates identity. Energy, assertiveness, and sometimes conflict surge through the core self.',
  'Mars-Moon': 'Action meets feeling. Emotional reactions intensify. The drive to protect or defend awakens.',
  'Mars-Saturn': 'Action meets limitation. Force is restrained or redirected. Frustration teaches discipline.',
  'Mars-Jupiter': 'Action meets expansion. The drive amplifies. Confidence surges, sometimes recklessly.',
};

// ── Secondary Progressions ──────────────────────────────────────────────────

export const PROGRESSION_MEANINGS = {
  intro: 'Secondary progressions unfold the birth chart in slow motion — one day of planetary movement for each year of life. Where transits are weather, progressions are climate.',
  moonPhases: {
    'New Moon': 'A progressed New Moon begins a ~30-year cycle. Seeds planted now define the next chapter of life. Inner world resets.',
    'Waxing Crescent': 'The initial impulse takes form. Progressed intention meets first resistance and begins to grow through it.',
    'First Quarter': 'A progressed crisis of action. What was seeded must now be built — or abandoned. Decision points crystallize.',
    'Waxing Gibbous': 'Refinement. The progressed path narrows toward its fullest expression. Adjustments before culmination.',
    'Full Moon': 'A progressed Full Moon is a ~15-year culmination. What was seeded at the last progressed New Moon reaches maximum visibility. Relationships illuminate.',
    'Waning Gibbous': 'Dissemination. The progressed harvest is shared. Meaning radiates outward from what has been achieved.',
    'Last Quarter': 'A progressed crisis of consciousness. The old cycle breaks down to make room for the next. Beliefs shift.',
    'Waning Crescent': 'The balsamic phase. Progressed energy turns inward. Composting, releasing, preparing the ground for the next New Moon.',
  },
  sunIngress: 'When the progressed Sun changes signs, the entire life orientation shifts. This happens roughly every 30 years — a fundamental rewrite of identity expression.',
  moonIngress: 'The progressed Moon changes signs every ~2.5 years, marking emotional chapter transitions. Each sign brings a new flavor to the inner life.',
  ascendantShift: 'When the progressed Ascendant changes signs, the way others perceive you transforms. The social mask evolves.',
  aspects: {
    'Moon-Sun': 'The progressed Moon aspecting natal Sun: emotional life meets core identity. A chapter of self-recognition or self-confrontation.',
    'Moon-Moon': 'The progressed Moon aspecting natal Moon: the evolved emotional self meets the primal emotional pattern. Memory activates.',
    'Moon-Mercury': 'The progressed Moon aspecting natal Mercury: feelings meet the mind. A period of emotional processing, journaling, conversation.',
    'Moon-Venus': 'The progressed Moon aspecting natal Venus: emotional life meets values and relationships. Love, beauty, and comfort come into focus.',
    'Moon-Mars': 'The progressed Moon aspecting natal Mars: feelings meet drive. Emotional courage or emotional conflict — often both.',
    'Moon-Jupiter': 'The progressed Moon aspecting natal Jupiter: inner life expands. Optimism, generosity, or restlessness in the emotional sphere.',
    'Moon-Saturn': 'The progressed Moon aspecting natal Saturn: feelings meet structure. Emotional maturation, responsibility, or temporary heaviness.',
    'Sun-Moon': 'The progressed Sun aspecting natal Moon: identity evolution meets the emotional foundation. A slow realignment of purpose and feeling.',
    'Sun-Sun': 'The progressed Sun aspecting natal Sun: the evolved self meets the birth self. Major identity milestone.',
    'Sun-Saturn': 'The progressed Sun aspecting natal Saturn: identity meets limitation. A multi-year period of maturation, authority, or testing.',
    'Sun-Jupiter': 'The progressed Sun aspecting natal Jupiter: identity meets expansion. Confidence, vision, and opportunity color several years.',
  },
};

export const EM_ASPECT_MODIFIERS = {
  Jupiter: {
    fieldNote: 'Jupiter\'s field — 20,000× Earth\'s — amplifies any aspect it touches. The energy is not just geometric. It is physically intensified.',
    asAspector: 'Whatever Jupiter aspects, it magnetizes. The connection is not subtle — it is the strongest field in the system pressing on the aspect.',
    asAspected: 'Whatever touches Jupiter enters the strongest magnetosphere in the solar system. The aspect is enveloped, amplified, made unavoidable.',
  },
  Mars: {
    fieldNote: 'Mars carries no field. Its dynamo died billions of years ago. Aspects involving Mars have no magnetic buffer — they are exposed, raw, unshielded.',
    asAspector: 'Mars strikes without magnetic protection — the energy is direct, unmediated, as exposed as Mars\'s own surface to the solar wind.',
    asAspected: 'What touches Mars finds no field to push against. The encounter is immediate. There is no electromagnetic negotiation, only impact.',
  },
  Venus: {
    fieldNote: 'Venus borrows its field from the solar wind. Aspects involving Venus carry borrowed protection — shaped by external pressure, not internal generation.',
    asAspector: 'Venus\'s aspect energy is induced, not generated. The connection has grace but no inherent structural support — it lasts only as long as the pressure that shapes it.',
    asAspected: 'What reaches Venus meets a field that dissolves the moment the solar wind shifts. The beauty is real but the protection is borrowed.',
  },
  Moon: {
    fieldNote: 'The Moon\'s dynamo died 3.5 billion years ago. It carries ghost magnetism frozen in ancient rock — a memory of protection that no longer functions.',
    asAspector: 'The Moon\'s aspect energy arrives without shielding — pure reflection, fully exposed.',
    asAspected: 'What touches the Moon meets no resistance. The emotional mirror has no magnetic boundary.',
  },
  Sun: {
    fieldNote: 'The Sun\'s field contains the entire system. Its ~11-year polarity flip is the largest magnetic event the chart experiences.',
    flippedNote: 'The Sun\'s field has reversed polarity. The magnetic container has inverted — everything within the heliosphere feels the reorganization.',
  },
};
