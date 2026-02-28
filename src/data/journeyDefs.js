// Declarative journey definitions — single source of truth for all Ouroboros journeys.
// Each entry drives OuroborosJourneyPage rendering, hook selection, and API calls.

const MONOMYTH_STAGES = [
  { id: 'golden-age', label: 'Surface' },
  { id: 'falling-star', label: 'Calling' },
  { id: 'impact-crater', label: 'Crossing' },
  { id: 'forge', label: 'Initiating' },
  { id: 'quenching', label: 'Nadir' },
  { id: 'integration', label: 'Return' },
  { id: 'drawing', label: 'Arrival' },
  { id: 'new-age', label: 'Renewal' },
];

const METEOR_STEEL_STAGES = [
  { id: 'golden-age', label: 'Golden Age' },
  { id: 'falling-star', label: 'Calling Star' },
  { id: 'impact-crater', label: 'Crater Crossing' },
  { id: 'forge', label: 'Trials of Forge' },
  { id: 'quenching', label: 'Quench' },
  { id: 'integration', label: 'Integration' },
  { id: 'drawing', label: 'Draw' },
  { id: 'new-age', label: 'Age of Steel' },
];

const PLANETARY_STAGES = [
  { id: 'moon-ascending', label: 'Moon', entity: 'Moon', phase: 'ascending', type: 'planet' },
  { id: 'mercury-ascending', label: 'Mercury', entity: 'Mercury', phase: 'ascending', type: 'planet' },
  { id: 'venus-ascending', label: 'Venus', entity: 'Venus', phase: 'ascending', type: 'planet' },
  { id: 'sun-ascending', label: 'Sun', entity: 'Sun', phase: 'ascending', type: 'planet' },
  { id: 'mars-ascending', label: 'Mars', entity: 'Mars', phase: 'ascending', type: 'planet' },
  { id: 'jupiter-ascending', label: 'Jupiter', entity: 'Jupiter', phase: 'ascending', type: 'planet' },
  { id: 'saturn-ascending', label: 'Saturn', entity: 'Saturn', phase: 'ascending', type: 'planet' },
];

const ZODIAC_STAGES = [
  { id: 'aries', label: 'Aries', entity: 'Aries', phase: 'zodiac', type: 'zodiac' },
  { id: 'taurus', label: 'Taurus', entity: 'Taurus', phase: 'zodiac', type: 'zodiac' },
  { id: 'gemini', label: 'Gemini', entity: 'Gemini', phase: 'zodiac', type: 'zodiac' },
  { id: 'cancer', label: 'Cancer', entity: 'Cancer', phase: 'zodiac', type: 'zodiac' },
  { id: 'leo', label: 'Leo', entity: 'Leo', phase: 'zodiac', type: 'zodiac' },
  { id: 'virgo', label: 'Virgo', entity: 'Virgo', phase: 'zodiac', type: 'zodiac' },
  { id: 'libra', label: 'Libra', entity: 'Libra', phase: 'zodiac', type: 'zodiac' },
  { id: 'scorpio', label: 'Scorpio', entity: 'Scorpio', phase: 'zodiac', type: 'zodiac' },
  { id: 'sagittarius', label: 'Sagittarius', entity: 'Sagittarius', phase: 'zodiac', type: 'zodiac' },
  { id: 'capricorn', label: 'Capricorn', entity: 'Capricorn', phase: 'zodiac', type: 'zodiac' },
  { id: 'aquarius', label: 'Aquarius', entity: 'Aquarius', phase: 'zodiac', type: 'zodiac' },
  { id: 'pisces', label: 'Pisces', entity: 'Pisces', phase: 'zodiac', type: 'zodiac' },
];

// Consulting engagement stages mapped as journey stops
const FALLEN_STARLIGHT_STAGES = [
  { id: 'golden-surface', label: 'Golden Surface', entity: 'Golden Surface', phase: 'ascending', type: 'chapter' },
  { id: 'calling-star', label: 'Calling Star', entity: 'Calling Star', phase: 'ascending', type: 'chapter' },
  { id: 'crater-crossing', label: 'Crater Crossing', entity: 'Crater Crossing', phase: 'ascending', type: 'chapter' },
  { id: 'belly-of-the-furnace', label: 'Belly of the Furnace', entity: 'Belly of the Furnace', phase: 'ascending', type: 'chapter' },
  { id: 'elixir-at-the-nadir', label: 'Elixir at the Nadir', entity: 'Elixir at the Nadir', phase: 'ascending', type: 'chapter' },
  { id: 'return-reflection', label: 'Return Reflection', entity: 'Return Reflection', phase: 'ascending', type: 'chapter' },
  { id: 'arrive-assembled', label: 'Arrive Assembled', entity: 'Arrive Assembled', phase: 'ascending', type: 'chapter' },
  { id: 'life-in-the-dirt', label: 'Life in the Dirt', entity: 'Life in the Dirt', phase: 'ascending', type: 'chapter' },
];

// Consulting engagement stages mapped as journey stops
const CONSULTING_STORYTELLER_STAGES = [
  { id: 'seed', label: 'The Seed' },
  { id: 'call', label: 'The Call' },
  { id: 'descent', label: 'The Descent' },
  { id: 'forge', label: 'The Forge' },
  { id: 'quench', label: 'The Quench' },
  { id: 'polish', label: 'The Polish' },
  { id: 'offering', label: 'The Offering' },
  { id: 'release', label: 'The Release' },
];

const CONSULTING_SEEKER_STAGES = [
  { id: 'ordinary-world', label: 'Ordinary World' },
  { id: 'call', label: 'The Call' },
  { id: 'threshold', label: 'The Threshold' },
  { id: 'trials', label: 'The Trials' },
  { id: 'abyss', label: 'The Abyss' },
  { id: 'return', label: 'The Return' },
  { id: 'integration', label: 'Integration' },
  { id: 'renewal', label: 'Renewal' },
];

const CONSULTING_BRAND_STAGES = [
  { id: 'origin', label: 'Origin' },
  { id: 'identity', label: 'Identity' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'transformation', label: 'Transformation' },
  { id: 'voice', label: 'Voice' },
  { id: 'story', label: 'Story' },
  { id: 'culture', label: 'Culture' },
  { id: 'legacy', label: 'Legacy' },
];

const JOURNEY_DEFS = {
  monomyth: {
    id: 'monomyth',
    label: 'Monomyth Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: false,
    stages: MONOMYTH_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Monomyth Journey',
    intro: [
      "Atlas invites you to walk the Ouroboros path of the Monomyth.",
      "Eight stages around the dragon's coil. At each one, Atlas will test your knowledge of the hero's journey.",
      "The dragon's body is your road. Its head marks your place.",
    ],
    completion: "You have walked the full circle of the Monomyth \u2014 from Surface through Renewal. The hero's journey is complete. The ouroboros turns.",
    completionElement: 'journeys.monomyth.completed',
  },

  'meteor-steel': {
    id: 'meteor-steel',
    label: 'Meteor Steel Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: false,
    stages: METEOR_STEEL_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Meteor Steel Journey',
    intro: [
      "Atlas invites you to walk the Ouroboros path of Meteor Steel.",
      "Eight stages around the dragon's coil \u2014 from Golden Age to Age of Steel.",
      "At each stop, tell Atlas what happens at that stage of the transformation.",
    ],
    completion: "You have walked the full wheel of Meteor Steel \u2014 from Golden Age through Age of Steel. The meteorite fell. The forge burned. The blade was drawn. The ouroboros turns.",
    completionElement: 'journeys.meteor-steel.completed',
  },

  fused: {
    id: 'fused',
    label: 'Fused Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: true,
    stages: METEOR_STEEL_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Fused Journey',
    intro: [
      "Atlas invites you to walk the Fused Ouroboros \u2014 monomyth and meteor steel in one wheel.",
      "Eight stages around the dragon's coil. At each one, you face two phases: first the hero's journey, then the forge.",
      "The dragon's body is your road. Its head marks your place.",
    ],
    completion: "You have walked the full fused wheel \u2014 monomyth and meteor steel intertwined, from Golden Age through Age of Steel. The hero fell, was forged, and rose. The ouroboros turns.",
    completionElement: 'journeys.fused.completed',
  },

  cosmic: {
    id: 'cosmic',
    label: 'Cosmic Journey',
    challengeMode: 'cosmic',
    levelsPerStop: 3,
    autoStart: true,
    isFused: false,
    stages: null, // loaded at runtime from yellowBrickRoad.json via useCosmicAdapter
    stagesSource: 'yellowBrickRoad',
    dotRadius: 32,
    cssClass: 'cosmic',
    title: 'The Cosmic Journey',
    intro: [
      "Atlas invites you to walk the Cosmic Ouroboros.",
      "Twenty-six encounters \u2014 ascending through the planetary spheres, traversing the zodiac, and descending back to Earth.",
      "Each celestial entity will test you three times. The dragon coils through all of them.",
    ],
    completion: "You have walked the Yellow Brick Road \u2014 ascending through the planetary spheres, traversing the zodiac, and descending back to Earth. The road was never about reaching a destination.",
    completionElement: 'journeys.cosmic.completed',
  },

  planetary: {
    id: 'planetary',
    label: 'Planetary Journey',
    challengeMode: 'cosmic',
    levelsPerStop: 3,
    autoStart: true,
    isFused: false,
    stages: PLANETARY_STAGES,
    dotRadius: 31,
    cssClass: 'cosmic',
    title: 'The Planetary Journey',
    intro: [
      "Atlas invites you to ascend through the seven planetary spheres.",
      "Seven encounters \u2014 Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn. Each will test you three times.",
      "The dragon coils through them all. Rise.",
    ],
    completion: "You have ascended through all seven planetary spheres. From Moon to Saturn, each tested you and found you worthy. The ouroboros turns.",
    completionElement: 'journeys.planetary.completed',
  },

  zodiac: {
    id: 'zodiac',
    label: 'Zodiac Journey',
    challengeMode: 'cosmic',
    levelsPerStop: 3,
    autoStart: true,
    isFused: false,
    stages: ZODIAC_STAGES,
    dotRadius: 32,
    cssClass: 'cosmic',
    title: 'The Zodiac Journey',
    intro: [
      "Atlas invites you to traverse the twelve signs of the zodiac.",
      "Twelve encounters \u2014 Aries through Pisces. Each sign will test you three times.",
      "The dragon coils through the wheel of the year. Walk it.",
    ],
    completion: "You have traversed all twelve signs of the zodiac. From Aries through Pisces, the wheel has turned full circle. The ouroboros turns.",
    completionElement: 'journeys.zodiac.completed',
  },

  'fallen-starlight-journey': {
    id: 'fallen-starlight-journey',
    label: 'Fallen Starlight Journey',
    challengeMode: 'cosmic',
    levelsPerStop: 3,
    autoStart: true,
    isFused: false,
    stages: FALLEN_STARLIGHT_STAGES,
    dotRadius: 31,
    cssClass: 'cosmic',
    title: 'The Fallen Starlight Journey',
    intro: [
      "Atlas invites you to walk the arc of Fallen Starlight — eight chapters of the meteor's story.",
      "From Golden Surface to Life in the Dirt. Each chapter will test you three times — surface, pattern, and personal resonance.",
      "The dragon coils through the artbook. Walk it.",
    ],
    completion: "You have walked the full arc of Fallen Starlight — from the Golden Surface through Life in the Dirt. The meteor fell, the forge burned, and the blade lives in the world. The ouroboros turns.",
    completionElement: 'journeys.fallen-starlight-journey.completed',
  },

  // Consulting journeys — map engagement stages as Ouroboros stops
  'consulting-storyteller': {
    id: 'consulting-storyteller',
    label: 'Storyteller Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: false,
    stages: CONSULTING_STORYTELLER_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Storyteller\u2019s Journey',
    intro: [
      'Atlas invites you to walk the creative arc \u2014 from raw impulse to release.',
      'Eight stages of the maker\u2019s path. At each one, Atlas will guide you deeper into the mythic pattern inside your creative process.',
      'The forge is where the material meets the meaning.',
    ],
    completion: 'You have walked the full arc of the storyteller \u2014 from Seed through Release. The work has entered the world. The ouroboros turns.',
    completionElement: 'journeys.consulting-storyteller.completed',
  },

  'consulting-seeker': {
    id: 'consulting-seeker',
    label: 'Seeker Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: false,
    stages: CONSULTING_SEEKER_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Seeker\u2019s Journey',
    intro: [
      'Atlas invites you to walk the hero\u2019s path \u2014 from ordinary world to renewal.',
      'Eight thresholds around the dragon\u2019s coil. At each one, Atlas will map the territory of your transformation.',
      'Not as metaphor, but as lived pattern.',
    ],
    completion: 'You have walked the full circle of the seeker \u2014 from Ordinary World through Renewal. You carried something through the fire and something emerged. The ouroboros turns.',
    completionElement: 'journeys.consulting-seeker.completed',
  },

  'consulting-brand': {
    id: 'consulting-brand',
    label: 'Brand Journey',
    challengeMode: 'wheel',
    levelsPerStop: 1,
    autoStart: false,
    isFused: false,
    stages: CONSULTING_BRAND_STAGES,
    dotRadius: 31,
    cssClass: '',
    title: 'The Brand\u2019s Journey',
    intro: [
      'Atlas invites you to surface the myth your organization carries \u2014 spoken or not.',
      'Eight stages from origin to legacy. At each one, Atlas will help you see the archetypal pattern alive in your narrative.',
      'So your story becomes conscious and coherent.',
    ],
    completion: 'You have walked the full arc of the brand \u2014 from Origin through Legacy. The founding myth is now a living narrative. The ouroboros turns.',
    completionElement: 'journeys.consulting-brand.completed',
  },
};

export default JOURNEY_DEFS;
