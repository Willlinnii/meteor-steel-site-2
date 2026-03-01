import React, { useState, useCallback, useRef, useEffect } from 'react';
import chronosphaeraZodiac from '../../data/chronosphaeraZodiac.json';
import mythicCalendar from '../../data/mythicCalendar.json';
import constellationContent from '../../data/constellationContent.json';
import { EMBODIED_READING, TIMELESS_READING, PAIR_DYNAMIC, SAME_SIGN_READING } from '../../data/twoWheelReadings';
import { apiFetch } from '../../lib/chatApi';

const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const PLANET_SYMBOLS = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640',
  Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644',
};

const PLANET_METALS = {
  Sun: 'Gold', Moon: 'Silver', Mercury: 'Quicksilver', Venus: 'Copper',
  Mars: 'Iron', Jupiter: 'Tin', Saturn: 'Lead',
};

const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function toSiderealSign(tropicalLon, birthYear) {
  const ayanamsa = 24.1 + (birthYear - 2024) * 0.0139;
  const siderealLon = ((tropicalLon - ayanamsa) % 360 + 360) % 360;
  const signIndex = Math.floor(siderealLon / 30);
  const degree = +(siderealLon % 30).toFixed(1);
  return { sign: SIGN_NAMES[signIndex], degree };
}

const CHINESE_ANIMAL_EMOJIS = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇', Dragon: '🐉', Snake: '🐍',
  Horse: '🐎', Goat: '🐐', Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐖',
};

const CHINESE_ELEMENT_COLORS = {
  Wood: '#4a9e5c', Fire: '#d4483b', Earth: '#c9a961', Metal: '#b0b8c4', Water: '#4a8fa8',
};

const CHINESE_COMPATIBLES = {
  Rat: ['Dragon', 'Monkey', 'Ox'], Ox: ['Snake', 'Rooster', 'Rat'],
  Tiger: ['Horse', 'Dog', 'Pig'], Rabbit: ['Goat', 'Pig', 'Dog'],
  Dragon: ['Rat', 'Monkey', 'Rooster'], Snake: ['Ox', 'Rooster', 'Monkey'],
  Horse: ['Tiger', 'Dog', 'Goat'], Goat: ['Rabbit', 'Horse', 'Pig'],
  Monkey: ['Rat', 'Dragon', 'Snake'], Rooster: ['Ox', 'Snake', 'Dragon'],
  Dog: ['Tiger', 'Rabbit', 'Horse'], Pig: ['Rabbit', 'Goat', 'Tiger'],
};

const CHINESE_INCOMPATIBLES = {
  Rat: 'Horse', Ox: 'Goat', Tiger: 'Monkey', Rabbit: 'Rooster',
  Dragon: 'Dog', Snake: 'Pig', Horse: 'Rat', Goat: 'Ox',
  Monkey: 'Tiger', Rooster: 'Rabbit', Dog: 'Dragon', Pig: 'Snake',
};

const CHINESE_TRAITS = {
  Rat: 'Quick-witted, resourceful, versatile, kind',
  Ox: 'Diligent, dependable, strong, determined',
  Tiger: 'Brave, competitive, unpredictable, confident',
  Rabbit: 'Quiet, elegant, kind, responsible',
  Dragon: 'Confident, intelligent, enthusiastic, ambitious',
  Snake: 'Enigmatic, intelligent, wise, graceful',
  Horse: 'Animated, active, energetic, free-spirited',
  Goat: 'Calm, gentle, creative, compassionate',
  Monkey: 'Sharp, smart, curious, mischievous',
  Rooster: 'Observant, hardworking, courageous, honest',
  Dog: 'Loyal, honest, amiable, prudent',
  Pig: 'Compassionate, generous, diligent, warm',
};

const CHINESE_ELEMENT_TRAITS = {
  Wood: 'Growth, creativity, flexibility, generosity',
  Fire: 'Passion, dynamism, warmth, leadership',
  Earth: 'Stability, patience, nurturing, practicality',
  Metal: 'Determination, strength, ambition, discipline',
  Water: 'Wisdom, intuition, adaptability, diplomacy',
};

const CHINESE_FIXED_ELEMENT = {
  Rat: 'Water', Ox: 'Earth', Tiger: 'Wood', Rabbit: 'Wood',
  Dragon: 'Earth', Snake: 'Fire', Horse: 'Fire', Goat: 'Earth',
  Monkey: 'Metal', Rooster: 'Metal', Dog: 'Earth', Pig: 'Water',
};

const CHINESE_LUCKY = {
  Rat:     { numbers: [2, 3], colors: ['Blue', 'Gold', 'Green'], flower: 'Lily' },
  Ox:      { numbers: [1, 4], colors: ['White', 'Yellow', 'Green'], flower: 'Tulip' },
  Tiger:   { numbers: [1, 3, 4], colors: ['Blue', 'Grey', 'Orange'], flower: 'Cineraria' },
  Rabbit:  { numbers: [3, 4, 6], colors: ['Red', 'Pink', 'Purple'], flower: 'Plantain Lily' },
  Dragon:  { numbers: [1, 6, 7], colors: ['Gold', 'Silver', 'Grey'], flower: 'Bleeding Heart' },
  Snake:   { numbers: [2, 8, 9], colors: ['Black', 'Red', 'Yellow'], flower: 'Orchid' },
  Horse:   { numbers: [2, 3, 7], colors: ['Yellow', 'Green', 'Purple'], flower: 'Jasmine' },
  Goat:    { numbers: [2, 7], colors: ['Brown', 'Red', 'Purple'], flower: 'Carnation' },
  Monkey:  { numbers: [4, 9], colors: ['White', 'Blue', 'Gold'], flower: 'Chrysanthemum' },
  Rooster: { numbers: [5, 7, 8], colors: ['Gold', 'Brown', 'Yellow'], flower: 'Gladiolus' },
  Dog:     { numbers: [3, 4, 9], colors: ['Red', 'Green', 'Purple'], flower: 'Rose' },
  Pig:     { numbers: [2, 5, 8], colors: ['Yellow', 'Grey', 'Brown'], flower: 'Hydrangea' },
};

const HEAVENLY_STEMS = [
  { name: 'Jiǎ', char: '甲', element: 'Wood', polarity: 'Yang' },
  { name: 'Yǐ',  char: '乙', element: 'Wood', polarity: 'Yin' },
  { name: 'Bǐng', char: '丙', element: 'Fire', polarity: 'Yang' },
  { name: 'Dīng', char: '丁', element: 'Fire', polarity: 'Yin' },
  { name: 'Wù',  char: '戊', element: 'Earth', polarity: 'Yang' },
  { name: 'Jǐ',  char: '己', element: 'Earth', polarity: 'Yin' },
  { name: 'Gēng', char: '庚', element: 'Metal', polarity: 'Yang' },
  { name: 'Xīn', char: '辛', element: 'Metal', polarity: 'Yin' },
  { name: 'Rén', char: '壬', element: 'Water', polarity: 'Yang' },
  { name: 'Guǐ', char: '癸', element: 'Water', polarity: 'Yin' },
];

const EARTHLY_BRANCHES = [
  { name: 'Zǐ',  char: '子', animal: 'Rat' },
  { name: 'Chǒu', char: '丑', animal: 'Ox' },
  { name: 'Yín', char: '寅', animal: 'Tiger' },
  { name: 'Mǎo', char: '卯', animal: 'Rabbit' },
  { name: 'Chén', char: '辰', animal: 'Dragon' },
  { name: 'Sì',  char: '巳', animal: 'Snake' },
  { name: 'Wǔ',  char: '午', animal: 'Horse' },
  { name: 'Wèi', char: '未', animal: 'Goat' },
  { name: 'Shēn', char: '申', animal: 'Monkey' },
  { name: 'Yǒu', char: '酉', animal: 'Rooster' },
  { name: 'Xū',  char: '戌', animal: 'Dog' },
  { name: 'Hài', char: '亥', animal: 'Pig' },
];

// Inner animal from birth month (approximate solar month mapping)
const MONTH_ANIMALS = ['Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig','Rat'];
// Secret animal from birth hour (2-hour periods starting at 23:00)
const HOUR_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];

function getChineseDetails(birthData) {
  const year = birthData?.year || 2000;
  const month = birthData?.month || 1;
  const hour = birthData?.hour;

  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[branchIdx];

  const innerAnimal = MONTH_ANIMALS[(month - 1) % 12];

  let secretAnimal = null;
  if (hour !== null && hour !== undefined && hour >= 0) {
    const hourIdx = Math.floor(((hour + 1) % 24) / 2);
    secretAnimal = HOUR_ANIMALS[hourIdx];
  }

  return { stem, branch, innerAnimal, secretAnimal };
}


const CHINESE_INFO = {
  'heavenly-stem': 'The ten Heavenly Stems (天干 Tiān Gān) are the oldest cycle in Chinese cosmology, predating the zodiac animals. Each stem carries an element (Wood, Fire, Earth, Metal, Water) in either Yang or Yin polarity. Together with the Earthly Branches they form the 60-year sexagenary cycle — the backbone of Chinese calendrical reckoning. Your stem colors how your year element expresses itself: Yang stems are active and outward, Yin stems are receptive and inward.',
  'earthly-branch': 'The twelve Earthly Branches (地支 Dì Zhī) are the older, more abstract layer behind the twelve animal signs. Each branch maps to a two-hour period of the day, a month of the year, and a compass direction. When paired with a Heavenly Stem, the branch anchors you in the 60-year cycle. The animal associated with your branch is your Year Animal — the public face of your Chinese zodiac identity.',
  'year-animal': 'Your Year Animal (生肖 Shēng Xiào) is the most recognized part of the Chinese zodiac. It represents your outward personality — how others perceive you and the social qualities you project. The twelve animals cycle in a fixed order, each carrying distinct temperamental patterns. Your animal also has a fixed element (separate from the year element) that represents its innate nature.',
  'year-element': 'The Year Element (五行 Wǔ Xíng) comes from the Five Phases system that permeates Chinese philosophy. Each element governs a two-year period and layers onto your animal sign, modifying its expression. A Water Rat and a Fire Rat share core traits but channel them very differently. The elements cycle through Wood, Fire, Earth, Metal, and Water, creating 60 unique animal-element combinations.',
  'inner-animal': 'Your Inner Animal (内动物 Nèi Dòngwù) is determined by your birth month. While the Year Animal is your public face, the Inner Animal governs your private world — how you behave in close relationships, what you value when no one is watching, and your emotional default state. If your inner and outer animals differ, you may feel a tension between your public persona and your inner life.',
  'secret-animal': 'The Secret Animal (秘密动物 Mìmì Dòngwù) is determined by your birth hour, assigned in two-hour windows called shichen (時辰). This is considered the truest layer of your character — the self that even you may not fully recognize. It shapes unconscious motivations and deep drives. Traditional Chinese astrology considers the birth hour essential for a complete reading.',
  'lucky': 'Auspicious attributes in Chinese astrology are associations refined over centuries of folk practice. Lucky numbers, colors, and flowers correspond to your animal sign through elemental resonance, cultural symbolism, and traditional medicine. These aren\'t predictions — they\'re affinities, subtle alignments between your sign and the patterns of the world.',
  'compatibility': 'Chinese zodiac compatibility follows the principle of the "four trines" — groups of three animals that share elemental temperament and naturally harmonize. The challenging match (冲 Chōng) pairs animals that sit opposite each other on the zodiac wheel, six positions apart. Opposite signs can create dynamic tension that\'s productive in some relationships but requires conscious effort.',
};

const SIGN_TO_CONSTELLATION = {
  Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Cnc',
  Leo: 'Leo', Virgo: 'Vir', Libra: 'Lib', Scorpio: 'Sco',
  Sagittarius: 'Sgr', Capricorn: 'Cap', Aquarius: 'Aqr', Pisces: 'Psc',
};

const SYNTHESIS_INFO = {
  'seasonal-wheel': 'The Seasonal (Tropical) Wheel represents the Embodied Self — the mortal body, the lived experience, the cutting edge of existence where the soul makes choices and advances. Anchored to the Earth\'s axial tilt and the rhythm of the seasons, your tropical sign describes the frontier work your embodied self is doing right now. The tropical wheel is always about 24\u00B0 ahead of the stellar wheel — the mortal self leads the way, pioneering new ground that the timeless self has not yet reached.',
  'stellar-wheel': 'The Stellar (Sidereal) Wheel represents the Timeless Self — the essential being beyond the mortal frame, not limited to time the way the body is. Anchored to the actual constellations, your sidereal sign describes the deep momentum and direction that gives your mortal choices their meaning. The stellar wheel follows about 24\u00B0 behind, integrating what the embodied self is doing — your timeless nature is catching up to the ground your body has already broken.',
  'precession-gap': 'Around 285 CE, the two wheels were perfectly aligned: the Embodied Self and the Timeless Self pointed in the same direction. Since then, the vernal equinox has moved backward through the constellations at about 1\u00B0 every 72 years — a phenomenon called the precession of the equinoxes. Today the gap is roughly 24\u00B0, which means the mortal self (tropical) is one sign ahead of the timeless self (sidereal). This is not drift or error — it is the body leading the way. Your embodied self is always pioneering new archetypal ground, while your timeless self follows, integrating the mortal experience into something that endures beyond any single life. The Two-Wheel approach holds both: the self that leads and the self that follows.',
  'trad-seasonal': 'The seasonal tradition assigns each sign an element (Fire, Earth, Air, Water), a modality (Cardinal, Fixed, Mutable), and a ruling planet. These describe the quality of time and energy at work during that segment of the year. Polarity (diurnal/nocturnal) adds another layer based on whether you were born during daylight or nighttime hours, reflecting different expressions of the same sign energy.',
  'trad-stellar': 'The stellar tradition looks at the actual constellation — its shape, its mythology, its brightest stars. Where the tropical system abstracts the ecliptic into equal 30\u00B0 segments, the constellations are irregular in size and rich in cultural mythology. The stellar archetype connects you to the specific star stories that civilizations have told about your region of the sky for millennia.',
  'trad-chinese': 'The Chinese zodiac operates on a completely different axis: a 60-year cycle combining twelve animals with five elements. Instead of mapping your position along the ecliptic, it maps your position in time — your birth year, month, and hour each carry an animal archetype. The system emphasizes cyclical rhythm, generational patterns, and the interplay of Yin and Yang. Adding the Chinese layer to the Western two-wheel framework gives you three distinct perspectives on the same life.',
};

function buildSynthesisNarrative(tropSign, sidSign, chinese, birthMonth) {
  const tropData = chronosphaeraZodiac.find(z => z.sign === tropSign);
  const sidData = chronosphaeraZodiac.find(z => z.sign === sidSign);
  const monthData = birthMonth ? mythicCalendar.find(m => m.order === birthMonth) : null;
  const constAbbr = SIGN_TO_CONSTELLATION[sidSign];
  const constData = constAbbr ? constellationContent[constAbbr] : null;
  const sameSigns = tropSign === sidSign;

  const paragraphs = [];

  // 1. The Embodied Self (Tropical)
  let embodied = `Your seasonal Sun falls in ${tropSign} \u2014 ${tropData?.archetype || tropSign}.`;
  if (EMBODIED_READING[tropSign]) {
    embodied += ' ' + EMBODIED_READING[tropSign];
  }
  if (monthData) {
    embodied += ' ' + monthData.mood.split('.')[0] + '.';
  }
  paragraphs.push(embodied);

  // 2. The Timeless Self (Sidereal)
  let timeless = 'Behind the seasonal rhythm, the constellations trace a deeper pattern.';
  timeless += ` Your sidereal Sun falls in ${sidSign} \u2014 ${sidData?.archetype || sidSign}.`;
  if (TIMELESS_READING[sidSign]) {
    timeless += ' ' + TIMELESS_READING[sidSign];
  }
  if (constData) {
    timeless += ` Its brightest star, ${constData.brightestStar}, anchors this region of the sky.`;
  }
  paragraphs.push(timeless);

  // 3. The Pair Dynamic (or Same-Sign)
  let pair;
  if (sameSigns) {
    pair = SAME_SIGN_READING.replace('{sign}', tropSign);
  } else if (PAIR_DYNAMIC[tropSign]) {
    pair = 'The two wheels are about 24\u00B0 apart \u2014 the mortal self always slightly ahead, leading the way. ' + PAIR_DYNAMIC[tropSign].reading;
  } else {
    pair = `Your embodied self as ${tropSign} and your timeless self as ${sidSign} create a dialogue between two archetypes \u2014 the mortal body pioneering new ground while the essential being provides the deep current of momentum and meaning beneath the surface.`;
  }
  paragraphs.push(pair);

  // 4. Chinese layer
  if (chinese) {
    const { animal, element } = chinese;
    let chn = `The Chinese tradition adds a temporal dimension that Western astrology lacks entirely. As a ${element} ${animal}, you carry the ${CHINESE_TRAITS[animal]?.toLowerCase() || animal + "'s"} qualities, expressed through ${element}'s nature of ${CHINESE_ELEMENT_TRAITS[element]?.toLowerCase() || element}.`;
    chn += ' Where the Western wheels track spatial position along the ecliptic, the Chinese system tracks your position in a sixty-year cycle \u2014 a rhythm of generations, not seasons.';
    paragraphs.push(chn);
  }

  // 5. Closing Synthesis
  let closing = 'Three traditions, three lenses on the same moment of birth.';
  closing += ` The embodied self says ${tropSign}: the mortal work of ${tropData?.stageOfExperience?.toLowerCase() || 'its phase in the cycle'}.`;
  if (!sameSigns && sidData) {
    closing += ` The timeless self says ${sidSign}: the essential momentum of ${sidData.stageOfExperience?.toLowerCase() || 'its deeper phase'}.`;
  }
  if (chinese) {
    closing += ` The Chinese wheel says ${chinese.element} ${chinese.animal}.`;
  }
  closing += ' No single system tells the whole story. The Two-Wheel Zodiac holds both the embodied work and the essential momentum \u2014 the self that leads and the self that follows \u2014 and lets the Chinese tradition add a third axis of meaning. The contradictions between them are not errors to be resolved but tensions to be lived.';
  paragraphs.push(closing);

  return paragraphs;
}

const TRANSIT_ASPECT_MEANING = {
  Conjunction: 'amplifies and merges with',
  Sextile: 'gently supports',
  Square: 'challenges and pressures',
  Trine: 'flows harmoniously with',
  Opposition: 'confronts and illuminates',
};

function findCrossAspects(natalPlanets, transitPlanets) {
  const ASPECTS = [
    { name: 'Conjunction', angle: 0, orb: 8 },
    { name: 'Sextile', angle: 60, orb: 6 },
    { name: 'Square', angle: 90, orb: 8 },
    { name: 'Trine', angle: 120, orb: 8 },
    { name: 'Opposition', angle: 180, orb: 8 },
  ];
  const found = [];
  for (const natal of natalPlanets) {
    for (const transit of transitPlanets) {
      let sep = Math.abs(natal.longitude - transit.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          found.push({
            natalPlanet: natal.name,
            transitPlanet: transit.name,
            aspect: aspect.name,
            orb: +orb.toFixed(1),
          });
          break;
        }
      }
    }
  }
  return found;
}

function buildSkyNowNarrative(tropSign, sidSign) {
  const tropData = chronosphaeraZodiac.find(z => z.sign === tropSign);
  const sidData = chronosphaeraZodiac.find(z => z.sign === sidSign);
  const sameSigns = tropSign === sidSign;
  const paragraphs = [];

  // P1: The Current Embodied Energy
  let p1 = `Right now the Sun is in ${tropSign}`;
  if (tropData?.archetype) p1 += ` \u2014 ${tropData.archetype}`;
  p1 += '.';
  if (EMBODIED_READING[tropSign]) {
    const match = EMBODIED_READING[tropSign].match(/doing the work of (.+?)(?:\.|—)/);
    if (match) {
      p1 += ` The seasonal wheel is in its ${match[1].trim()} phase.`;
    }
  }
  p1 += ' This is the embodied work the world is collectively engaged in at this moment \u2014 the cutting edge of the cycle, the mortal frontier where choices are being made.';
  paragraphs.push(p1);

  // P2: The Current Timeless Current
  let p2 = `Behind the seasonal rhythm, the sidereal Sun falls in ${sidSign}`;
  if (sidData?.archetype) p2 += ` \u2014 ${sidData.archetype}`;
  p2 += '.';
  if (TIMELESS_READING[sidSign]) {
    const match = TIMELESS_READING[sidSign].match(/the essential momentum of (.+?)(?:\s\u2014)/);
    if (match) {
      p2 += ` The stellar wheel carries the essential momentum of ${match[1].trim()}.`;
    }
  }
  p2 += ' This is the deeper current underneath the surface \u2014 not bound to the season but to the stars themselves.';
  paragraphs.push(p2);

  // P3: The Pair Dynamic
  if (sameSigns) {
    paragraphs.push(`The tropical and sidereal Sun are both in ${tropSign} \u2014 the seasonal rhythm and the stellar current are pointing in the same direction. This alignment was the default roughly two thousand years ago. Right now, the embodied work and the timeless momentum reinforce each other \u2014 a moment of unusual coherence between the two wheels.`);
  } else if (PAIR_DYNAMIC[tropSign]) {
    paragraphs.push(`The two wheels are about 24\u00B0 apart \u2014 the seasonal wheel always slightly ahead, pioneering new archetypal ground. The embodied current of ${tropSign} leads, while the stellar current of ${sidSign} follows, integrating the lived experience into something that endures. This is not just a personal dynamic \u2014 it is the shape of the collective moment: everyone alive is navigating this same tension between the mortal frontier and the timeless undertow.`);
  } else {
    paragraphs.push(`The embodied current as ${tropSign} and the timeless current as ${sidSign} create a dialogue \u2014 the seasonal wheel pioneering new ground while the stellar wheel provides the deep current of momentum beneath the surface.`);
  }

  return paragraphs;
}

const PLANET_TRANSIT_VOICE = {
  Sun: { metal: 'gold', noun: 'conscious identity', verb: 'illuminates' },
  Moon: { metal: 'silver', noun: 'emotional instinct', verb: 'stirs' },
  Mercury: { metal: 'quicksilver', noun: 'perception and speech', verb: 'quickens' },
  Venus: { metal: 'copper', noun: 'value and connection', verb: 'draws toward' },
  Mars: { metal: 'iron', noun: 'will and action', verb: 'ignites' },
  Jupiter: { metal: 'tin', noun: 'meaning and opportunity', verb: 'expands' },
  Saturn: { metal: 'lead', noun: 'discipline and structure', verb: 'tests' },
};

function buildTransitNarrative(crossAspects) {
  if (!crossAspects || crossAspects.length === 0) {
    return ['The transit sky is quiet against your chart right now \u2014 no major cross-chart aspects forming between the current planets and your natal placements. These pauses have their own value. The sky is not pressing, not asking, not testing. It is giving your pattern room to breathe before the next weather system arrives.'];
  }

  const paragraphs = [];

  // Sort by significance: conjunctions/oppositions first, then squares, then soft
  const ASPECT_WEIGHT = { Conjunction: 0, Opposition: 1, Square: 2, Trine: 3, Sextile: 4 };
  const sorted = [...crossAspects].sort((a, b) => (ASPECT_WEIGHT[a.aspect] ?? 5) - (ASPECT_WEIGHT[b.aspect] ?? 5) || a.orb - b.orb);

  const hard = sorted.filter(a => ['Conjunction', 'Square', 'Opposition'].includes(a.aspect));
  const soft = sorted.filter(a => ['Trine', 'Sextile'].includes(a.aspect));

  // Opening \u2014 set the weather
  let opening;
  if (hard.length === 0 && soft.length > 0) {
    opening = 'The sky is working with you right now, not against you. The current transits are flowing into your natal pattern through soft aspects \u2014 trines and sextiles that support without demanding. This is a window where the wind is at your back.';
  } else if (hard.length > 0 && soft.length === 0) {
    opening = 'The transit weather is pressing against your chart. Every active aspect right now carries friction \u2014 conjunctions that amplify, squares that challenge, oppositions that confront. This is not punishment. This is the sky asking you to respond, to grow, to make choices under pressure.';
  } else if (hard.length > soft.length) {
    opening = `The transit sky is active against your chart \u2014 more friction than flow right now. ${hard.length} hard aspect${hard.length > 1 ? 's' : ''} pressing, ${soft.length} soft one${soft.length > 1 ? 's' : ''} supporting. The weather is asking for engagement, not passivity.`;
  } else {
    opening = `The transit weather is mixed \u2014 ${soft.length} flowing aspect${soft.length > 1 ? 's' : ''} and ${hard.length} frictional one${hard.length > 1 ? 's' : ''}. Some support, some pressure. This is the usual dialogue between the moving sky and the pattern you were born with.`;
  }
  paragraphs.push(opening);

  // Body \u2014 the loudest aspects
  const top = sorted.slice(0, Math.min(3, sorted.length));
  const lines = top.map(a => {
    const tv = PLANET_TRANSIT_VOICE[a.transitPlanet] || {};
    const nv = PLANET_TRANSIT_VOICE[a.natalPlanet] || {};

    if (a.aspect === 'Conjunction') {
      return `Transit ${a.transitPlanet} conjunct your natal ${a.natalPlanet}: ${tv.metal || 'the moving planet'} meeting ${nv.metal || 'your placement'} at the same degree. The sky\u2019s ${tv.noun || 'energy'} is merging directly with your own ${nv.noun || 'pattern'} \u2014 amplifying it, making it louder, harder to ignore.`;
    } else if (a.aspect === 'Opposition') {
      return `Transit ${a.transitPlanet} opposing your natal ${a.natalPlanet}: ${tv.metal || 'the sky'} facing ${nv.metal || 'your placement'} across the wheel. Oppositions are mirrors, not attacks. The sky\u2019s ${tv.noun || 'energy'} is showing you the other side of your own ${nv.noun || 'placement'} \u2014 the part you don\u2019t usually lead with.`;
    } else if (a.aspect === 'Square') {
      return `Transit ${a.transitPlanet} squaring your natal ${a.natalPlanet}: friction between the current ${tv.noun || 'energy'} and your natal ${nv.noun || 'placement'}. Squares build capacity through tension \u2014 the pressure is not something to escape but something to metabolize.`;
    } else if (a.aspect === 'Trine') {
      return `Transit ${a.transitPlanet} trine your natal ${a.natalPlanet}: the sky\u2019s ${tv.noun || 'energy'} flowing naturally into your ${nv.noun || 'pattern'}. Trines are support that arrives without being earned \u2014 use the ease, don\u2019t sleep through it.`;
    } else {
      return `Transit ${a.transitPlanet} sextile your natal ${a.natalPlanet}: a quiet opening between the current ${tv.noun || 'energy'} and your natal ${nv.noun || 'placement'}. Sextiles are invitations, not deliveries \u2014 they activate when you reach for them.`;
    }
  });
  paragraphs.push(lines.join(' '));

  // Closing
  if (sorted.length > top.length) {
    paragraphs.push(`${sorted.length - top.length} more aspect${sorted.length - top.length > 1 ? 's are' : ' is'} forming beneath the ones above \u2014 the full picture is richer than any summary. But the loudest transits set the weather, and the weather right now is: ${hard.length > soft.length ? 'engaged' : soft.length > hard.length ? 'supported' : 'in dialogue'}.`);
  } else {
    paragraphs.push('These are all the active transits to your chart right now. The sky writes a new sentence every day \u2014 come back and the pattern will have shifted.');
  }

  return paragraphs;
}

function NatalChartDisplay({ chart }) {
  const hasBirthData = chart?.planets?.length > 0;
  const [natalMode, setNatalMode] = useState('tropical');
  const [expandedInfo, setExpandedInfo] = useState(null);
  const [aspectsOpen, setAspectsOpen] = useState({});
  const [activeCulture, setActiveCulture] = useState(null);
  const [cultureDropdownOpen, setCultureDropdownOpen] = useState(false);
  const [chartMode, setChartMode] = useState(hasBirthData ? 'transits' : 'live');
  const [liveSky, setLiveSky] = useState(null);
  // liveMode removed — chartMode now covers all three states directly
  const hadBirthDataOnMount = useRef(hasBirthData);
  const birthYear = chart?.birthData?.year || 2000;
  const isSidereal = natalMode === 'sidereal';

  const fetchLiveSky = useCallback(async () => {
    if (!liveSky) {
      try {
        const res = await fetch('/api/celestial');
        const data = await res.json();
        if (data.planets) setLiveSky(data);
      } catch (err) {
        console.error('Failed to fetch current sky:', err);
      }
    }
  }, [liveSky]);

  const handleLiveToggle = useCallback(async () => {
    setChartMode('live');
    fetchLiveSky();
  }, [fetchLiveSky]);

  // Auto-fetch sky data on mount
  useEffect(() => {
    fetchLiveSky();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When birth data first appears, switch to transits
  useEffect(() => {
    if (!hadBirthDataOnMount.current && chart?.planets?.length > 0) {
      setChartMode('transits');
      hadBirthDataOnMount.current = true;
    }
  }, [chart]);

  // Live sky derived data
  const currentYear = new Date().getFullYear();
  const liveSkyDual = liveSky ? liveSky.planets.map(p => {
    const s = toSiderealSign(p.longitude, currentYear);
    return { ...p, sidSign: s.sign, sidDegree: s.degree };
  }) : [];
  const currentTropSun = liveSky?.planets?.find(p => p.name === 'Sun')?.sign || 'Unknown';
  const currentSidSun = liveSkyDual.find(p => p.name === 'Sun')?.sidSign || 'Unknown';
  const skyNowNarrative = liveSky ? buildSkyNowNarrative(currentTropSun, currentSidSun) : [];
  const crossAspects = liveSky && chart?.planets ? findCrossAspects(chart.planets, liveSky.planets) : [];
  const transitNarrative = crossAspects.length >= 0 && liveSky ? buildTransitNarrative(crossAspects) : [];

  const planets = isSidereal
    ? chart?.planets?.map(p => {
        const s = toSiderealSign(p.longitude, birthYear);
        return { ...p, sign: s.sign, degree: s.degree };
      })
    : chart?.planets;

  const asc = isSidereal && chart?.ascendant
    ? { ...chart.ascendant, ...toSiderealSign(chart.ascendant.longitude, birthYear) }
    : chart?.ascendant;

  const sun = planets?.find(p => p.name === 'Sun');
  const moon = planets?.find(p => p.name === 'Moon');

  return (
    <div className="natal-chart-display">
      {/* Birth Chart / Sky Now / Transits toggle */}
      <div className="natal-chart-mode-toggle">
        {hasBirthData && <button className={`natal-chart-mode-btn${chartMode === 'birth' ? ' active' : ''}`} onClick={() => setChartMode('birth')}>Birth Chart</button>}
        <button className={`natal-chart-mode-btn${chartMode === 'live' ? ' active' : ''}`} onClick={handleLiveToggle}>Sky Right Now</button>
        {hasBirthData && <button className={`natal-chart-mode-btn${chartMode === 'transits' ? ' active' : ''}`} onClick={() => { setChartMode('transits'); fetchLiveSky(); }}>Transits</button>}
      </div>

      {/* Tropical / Sidereal / Chinese / Synthesis tabs — shared across all modes */}
      <div className="natal-mode-tabs">
        <button
          className={`natal-mode-tab${natalMode === 'tropical' ? ' active' : ''}`}
          onClick={() => {
            if (natalMode === 'tropical') { setCultureDropdownOpen(prev => !prev); }
            else { setNatalMode('tropical'); setCultureDropdownOpen(false); setActiveCulture(null); }
          }}
        >Tropical <span className="natal-tab-arrow">&#9662;</span></button>
        <button
          className={`natal-mode-tab${natalMode === 'sidereal' ? ' active' : ''}`}
          onClick={() => {
            if (natalMode === 'sidereal') { setCultureDropdownOpen(prev => !prev); }
            else { setNatalMode('sidereal'); setCultureDropdownOpen(false); setActiveCulture(null); }
          }}
        >Sidereal <span className="natal-tab-arrow">&#9662;</span></button>
        <button
          className={`natal-mode-tab${natalMode === 'chinese' ? ' active' : ''}`}
          onClick={() => { setNatalMode('chinese'); setCultureDropdownOpen(false); setActiveCulture(null); }}
        >Chinese</button>
        <button
          className={`natal-mode-tab${natalMode === 'synthesis' ? ' active' : ''}`}
          onClick={() => { setNatalMode('synthesis'); setCultureDropdownOpen(false); setActiveCulture(null); }}
        >Synthesis</button>
      </div>

      {/* Culture sub-options dropdown */}
      {cultureDropdownOpen && (natalMode === 'tropical' || natalMode === 'sidereal') && (
        <div className="natal-culture-dropdown">
          {(natalMode === 'tropical'
            ? [{ key: 'greek', label: 'Greek' }, { key: 'roman', label: 'Roman' }, { key: 'islamic', label: 'Islamic' }, { key: 'medieval', label: 'Medieval' }]
            : [{ key: 'vedic', label: 'Vedic' }, { key: 'babylonian', label: 'Babylonian' }, { key: 'norse', label: 'Norse' }]
          ).map(({ key, label }) => (
            <button key={key} className={`natal-culture-option${activeCulture === key ? ' active' : ''}`}
              onClick={() => { setActiveCulture(prev => prev === key ? null : key); setCultureDropdownOpen(false); }}
            >{label}</button>
          ))}
        </div>
      )}

      {/* Culture sign reading when a sub-culture is selected */}
      {activeCulture && (natalMode === 'tropical' || natalMode === 'sidereal') && (() => {
        const signForCulture = natalMode === 'sidereal'
          ? (chartMode === 'birth' ? (chart?.planets?.map(p => { const s = toSiderealSign(p.longitude, birthYear); return { ...p, sign: s.sign }; }).find(p => p.name === 'Sun')?.sign) : currentSidSun)
          : (chartMode === 'birth' ? chart?.planets?.find(p => p.name === 'Sun')?.sign : currentTropSun);
        const zData = signForCulture ? chronosphaeraZodiac.find(z => z.sign === signForCulture) : null;
        const culture = zData?.cultures?.[activeCulture];
        if (!culture) return null;
        return (
          <div className="natal-culture-reading">
            <div className="natal-culture-name">{culture.name}</div>
            {culture.myth && <div className="natal-culture-myth">{culture.myth}</div>}
            {culture.description && <div className="natal-culture-desc">{culture.description}</div>}
          </div>
        );
      })()}

      {chartMode === 'birth' ? (<>
      {natalMode === 'chinese' ? (
        chart.chinese ? (() => {
          const { animal, element } = chart.chinese;
          const details = getChineseDetails(chart.birthData);
          const { stem, branch, innerAnimal, secretAnimal } = details;
          const fixedEl = CHINESE_FIXED_ELEMENT[animal];
          const lucky = CHINESE_LUCKY[animal];
          const compatibles = CHINESE_COMPATIBLES[animal] || [];
          const incompatible = CHINESE_INCOMPATIBLES[animal];
          const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);
          return (
            <div className="natal-chinese-tab">
              <div className="natal-chinese-hero">
                <div className="natal-chinese-emoji">{CHINESE_ANIMAL_EMOJIS[animal] || ''}</div>
                <div className="natal-chinese-pillar">{element} {animal}</div>
                <div className="natal-chinese-polarity">{stem.polarity} &middot; {stem.char}{branch.char}</div>
              </div>

              {/* Year Pillar */}
              <div className="natal-chinese-pillar-row">
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'heavenly-stem' ? ' expanded' : ''}`} onClick={() => toggleInfo('heavenly-stem')}>
                  <div className="natal-chinese-card-label">Heavenly Stem <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{stem.char}</div>
                  <div className="natal-chinese-card-value">{stem.name}</div>
                  <div className="natal-chinese-card-detail">{stem.element} {stem.polarity}</div>
                  {expandedInfo === 'heavenly-stem' && <div className="natal-chinese-info-text">{CHINESE_INFO['heavenly-stem']}</div>}
                </div>
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'earthly-branch' ? ' expanded' : ''}`} onClick={() => toggleInfo('earthly-branch')}>
                  <div className="natal-chinese-card-label">Earthly Branch <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{branch.char}</div>
                  <div className="natal-chinese-card-value">{branch.name}</div>
                  <div className="natal-chinese-card-detail">{branch.animal}</div>
                  {expandedInfo === 'earthly-branch' && <div className="natal-chinese-info-text">{CHINESE_INFO['earthly-branch']}</div>}
                </div>
              </div>

              {/* Animal + Element cards */}
              <div className="natal-chinese-cards">
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-animal')}>
                  <div className="natal-chinese-card-label">Year Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value">{animal}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_TRAITS[animal]}</div>
                  <div className="natal-chinese-card-sub">Fixed element: <span style={{ color: CHINESE_ELEMENT_COLORS[fixedEl] }}>{fixedEl}</span></div>
                  {expandedInfo === 'year-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-element' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-element')}>
                  <div className="natal-chinese-card-label">Year Element <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value" style={{ color: CHINESE_ELEMENT_COLORS[element] }}>{element}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_ELEMENT_TRAITS[element]}</div>
                  {expandedInfo === 'year-element' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-element']}</div>}
                </div>
              </div>

              {/* Inner + Secret animals */}
              <div className="natal-chinese-cards">
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'inner-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('inner-animal')}>
                  <div className="natal-chinese-card-label">Inner Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[innerAnimal]}</div>
                  <div className="natal-chinese-card-value">{innerAnimal}</div>
                  <div className="natal-chinese-card-detail">From birth month — your private self</div>
                  {expandedInfo === 'inner-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['inner-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'secret-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('secret-animal')}>
                  <div className="natal-chinese-card-label">Secret Animal <span className="natal-chinese-info-hint">?</span></div>
                  {secretAnimal ? (
                    <>
                      <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[secretAnimal]}</div>
                      <div className="natal-chinese-card-value">{secretAnimal}</div>
                      <div className="natal-chinese-card-detail">From birth hour — your truest self</div>
                    </>
                  ) : (
                    <>
                      <div className="natal-chinese-card-emoji" style={{ opacity: 0.3 }}>?</div>
                      <div className="natal-chinese-card-value" style={{ opacity: 0.4 }}>Unknown</div>
                      <div className="natal-chinese-card-detail">Requires birth time</div>
                    </>
                  )}
                  {expandedInfo === 'secret-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['secret-animal']}</div>}
                </div>
              </div>

              {/* Lucky attributes */}
              {lucky && (
                <div className={`natal-chinese-lucky natal-chinese-clickable${expandedInfo === 'lucky' ? ' expanded' : ''}`} onClick={() => toggleInfo('lucky')}>
                  <div className="natal-chinese-lucky-label">Auspicious Attributes <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-lucky-grid">
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Numbers</span>
                      <span className="natal-chinese-lucky-val">{lucky.numbers.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Colors</span>
                      <span className="natal-chinese-lucky-val">{lucky.colors.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Flower</span>
                      <span className="natal-chinese-lucky-val">{lucky.flower}</span>
                    </div>
                  </div>
                  {expandedInfo === 'lucky' && <div className="natal-chinese-info-text">{CHINESE_INFO['lucky']}</div>}
                </div>
              )}

              {/* Compatibility */}
              <div className={`natal-chinese-compat natal-chinese-clickable${expandedInfo === 'compatibility' ? ' expanded' : ''}`} onClick={() => toggleInfo('compatibility')}>
                <div className="natal-chinese-compat-label">Most Compatible <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-chinese-compat-list">
                  {compatibles.map(a => (
                    <span key={a} className="natal-chinese-compat-tag">
                      {CHINESE_ANIMAL_EMOJIS[a]} {a}
                    </span>
                  ))}
                </div>
                {incompatible && (
                  <div className="natal-chinese-compat-clash">
                    Challenging match: {CHINESE_ANIMAL_EMOJIS[incompatible]} {incompatible}
                  </div>
                )}
                {expandedInfo === 'compatibility' && <div className="natal-chinese-info-text">{CHINESE_INFO['compatibility']}</div>}
              </div>
            </div>
          );
        })() : null
      ) : natalMode === 'synthesis' ? (() => {
        const tropPlanets = chart.planets || [];
        const sidPlanets = tropPlanets.map(p => {
          const s = toSiderealSign(p.longitude, birthYear);
          return { ...p, tropSign: p.sign, tropDegree: p.degree, sidSign: s.sign, sidDegree: s.degree };
        });
        const tropSun = tropPlanets.find(p => p.name === 'Sun');
        const sidSunInfo = tropSun ? toSiderealSign(tropSun.longitude, birthYear) : null;
        const tropSignName = tropSun?.sign || 'Unknown';
        const sidSignName = sidSunInfo?.sign || 'Unknown';

        const zodiacLookup = {};
        chronosphaeraZodiac.forEach(z => { zodiacLookup[z.sign] = z; });
        const tropZodiac = zodiacLookup[tropSignName];
        const sidZodiac = zodiacLookup[sidSignName];

        const constAbbr = SIGN_TO_CONSTELLATION[sidSignName];
        const constellation = constAbbr ? constellationContent[constAbbr] : null;

        const bMonth = chart.birthData?.month;
        const monthData = bMonth ? mythicCalendar.find(m => m.order === bMonth) : null;

        const ayanamsa = (24.1 + (birthYear - 2024) * 0.0139).toFixed(1);
        const sameSigns = tropSignName === sidSignName;

        const chinese = chart.chinese;
        const chineseDetails = chart.birthData ? getChineseDetails(chart.birthData) : null;

        const narrative = buildSynthesisNarrative(tropSignName, sidSignName, chinese, bMonth);

        const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);

        return (
          <div className="natal-synthesis-tab">
            {/* 1. Two-Wheel Hero */}
            <div className="natal-synthesis-wheels">
              <div className={`natal-synthesis-wheel-card natal-chinese-clickable${expandedInfo === 'seasonal-wheel' ? ' expanded' : ''}`} onClick={() => toggleInfo('seasonal-wheel')}>
                <div className="natal-synthesis-wheel-label">Seasonal Wheel <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-synthesis-wheel-subtitle">The Embodied Self</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[tropSignName] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{tropSignName}</div>
                {tropZodiac && (
                  <>
                    <div className="natal-synthesis-wheel-archetype">{tropZodiac.archetype}</div>
                    <div className="natal-synthesis-wheel-detail">{tropZodiac.modality} {tropZodiac.element}</div>
                    <div className="natal-synthesis-wheel-detail">{tropZodiac.stageOfExperience}</div>
                  </>
                )}
                {monthData && <div className="natal-synthesis-wheel-mood">{monthData.month} \u2014 {monthData.stone.name}</div>}
                {expandedInfo === 'seasonal-wheel' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['seasonal-wheel']}</div>}
              </div>

              <div className={`natal-synthesis-wheel-card natal-chinese-clickable${expandedInfo === 'stellar-wheel' ? ' expanded' : ''}`} onClick={() => toggleInfo('stellar-wheel')}>
                <div className="natal-synthesis-wheel-label">Stellar Wheel <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-synthesis-wheel-subtitle">The Timeless Self</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[sidSignName] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{sidSignName}</div>
                {constellation && (
                  <>
                    <div className="natal-synthesis-wheel-archetype">{constellation.name}</div>
                    <div className="natal-synthesis-wheel-detail">{constellation.brightestStar}</div>
                    <div className="natal-synthesis-wheel-detail">Best seen: {constellation.bestSeen}</div>
                  </>
                )}
                {sidZodiac?.cultures?.vedic && <div className="natal-synthesis-wheel-mood">Vedic: {sidZodiac.cultures.vedic.name}</div>}
                {expandedInfo === 'stellar-wheel' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['stellar-wheel']}</div>}
              </div>
            </div>

            {/* 2. The Precession Gap */}
            <div className={`natal-synthesis-gap natal-chinese-clickable${expandedInfo === 'precession-gap' ? ' expanded' : ''}`} onClick={() => toggleInfo('precession-gap')}>
              <div className="natal-synthesis-gap-label">The Precession Gap <span className="natal-chinese-info-hint">?</span></div>
              <div className="natal-synthesis-gap-degrees">~{ayanamsa}\u00B0 offset</div>
              <div className="natal-synthesis-gap-text">
                Your embodied self is <strong>{tropSignName}</strong>. Your timeless self is <strong>{sidSignName}</strong>.
              </div>
              {sameSigns ? (
                <div className="natal-synthesis-gap-note">Your signs align \u2014 the embodied self and the timeless self are pointing in the same direction. This was the norm ~2,000 years ago when the two wheels coincided.</div>
              ) : (
                <div className="natal-synthesis-gap-note">The mortal self leads by about 24\u00B0 \u2014 your body as {tropSignName} is pioneering new ground, while your timeless being as {sidSignName} follows, integrating the lived experience into something that endures.</div>
              )}
              <div className="natal-synthesis-gap-age">We are currently in the transition from the Age of Pisces to the Age of Aquarius \u2014 the vernal equinox point is slowly precessing out of Pisces and into Aquarius.</div>
              {expandedInfo === 'precession-gap' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['precession-gap']}</div>}
            </div>

            {/* 3. Planetary Dual-Column Table */}
            <div className="natal-synthesis-planet-table">
              <div className="natal-synthesis-table-header">
                <span className="natal-synthesis-table-planet">Planet</span>
                <span className="natal-synthesis-table-col">Tropical</span>
                <span className="natal-synthesis-table-col">Sidereal</span>
              </div>
              {sidPlanets.map(p => (
                <div key={p.name} className="natal-synthesis-table-row">
                  <span className="natal-synthesis-table-planet">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.tropSign] || ''} {p.tropSign} {p.tropDegree}\u00B0
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.sidSign] || ''} {p.sidSign} {p.sidDegree}\u00B0
                  </span>
                </div>
              ))}
            </div>

            {/* 4. Three Traditions Row */}
            <div className="natal-synthesis-traditions">
              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-seasonal' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-seasonal')}>
                <div className="natal-synthesis-tradition-label">Seasonal <span className="natal-chinese-info-hint">?</span></div>
                {tropZodiac && (
                  <>
                    <div className="natal-synthesis-tradition-value">{tropZodiac.element} \u00B7 {tropZodiac.modality}</div>
                    <div className="natal-synthesis-tradition-detail">Ruler: {tropZodiac.rulingPlanet}</div>
                    <div className="natal-synthesis-tradition-detail">
                      {chart.birthData?.hour != null ? (chart.birthData.hour >= 6 && chart.birthData.hour < 18 ? 'Diurnal (Day birth)' : 'Nocturnal (Night birth)') : 'Polarity requires birth time'}
                    </div>
                  </>
                )}
                {expandedInfo === 'trad-seasonal' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-seasonal']}</div>}
              </div>

              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-stellar' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-stellar')}>
                <div className="natal-synthesis-tradition-label">Stellar <span className="natal-chinese-info-hint">?</span></div>
                {sidZodiac && (
                  <>
                    <div className="natal-synthesis-tradition-value">{sidZodiac.archetype}</div>
                    <div className="natal-synthesis-tradition-detail">{constellation?.name || sidSignName}</div>
                    <div className="natal-synthesis-tradition-detail">{constellation?.brightestStar || ''}</div>
                  </>
                )}
                {expandedInfo === 'trad-stellar' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-stellar']}</div>}
              </div>

              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-chinese' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-chinese')}>
                <div className="natal-synthesis-tradition-label">Chinese <span className="natal-chinese-info-hint">?</span></div>
                {chinese ? (
                  <>
                    <div className="natal-synthesis-tradition-value">{chinese.element} {chinese.animal}</div>
                    <div className="natal-synthesis-tradition-detail">{chineseDetails?.stem?.polarity || ''}</div>
                    <div className="natal-synthesis-tradition-detail">Inner: {chineseDetails?.innerAnimal || '\u2014'}</div>
                  </>
                ) : (
                  <div className="natal-synthesis-tradition-detail" style={{ opacity: 0.5 }}>No Chinese data</div>
                )}
                {expandedInfo === 'trad-chinese' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-chinese']}</div>}
              </div>
            </div>

            {/* 5. Unified Narrative Reading */}
            <div className="natal-synthesis-narrative">
              <div className="natal-synthesis-narrative-title">Your Two-Wheel Reading</div>
              {narrative.map((para, i) => (
                <p key={i} className="natal-synthesis-narrative-para">{para}</p>
              ))}
            </div>
          </div>
        );
      })() : (
        <>
          {/* Big Three */}
          <div className="natal-big-three">
            {sun && (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[sun.sign] || ''}</div>
                <div className="natal-big-three-label">Sun</div>
                <div className="natal-big-three-sign">{sun.sign}</div>
                <div className="natal-big-three-degree">{sun.degree}\u00B0</div>
              </div>
            )}
            {moon && (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[moon.sign] || ''}</div>
                <div className="natal-big-three-label">Moon</div>
                <div className="natal-big-three-sign">{moon.sign}</div>
                <div className="natal-big-three-degree">{moon.degree}\u00B0</div>
              </div>
            )}
            {asc ? (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[asc.sign] || ''}</div>
                <div className="natal-big-three-label">Rising</div>
                <div className="natal-big-three-sign">{asc.sign}</div>
                <div className="natal-big-three-degree">{asc.degree}\u00B0</div>
              </div>
            ) : (
              <div className="natal-big-three-card natal-big-three-unknown">
                <div className="natal-big-three-symbol">?</div>
                <div className="natal-big-three-label">Rising</div>
                <div className="natal-big-three-sign">Unknown</div>
                <div className="natal-big-three-degree">&mdash;</div>
              </div>
            )}
          </div>

          {/* Planet positions */}
          <div className="natal-planets-grid">
            {planets?.map(p => (
              <div key={p.name} className="natal-planet-row">
                <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span>
                <span className="natal-planet-name">{p.name}</span>
                <span className="natal-planet-metal">{PLANET_METALS[p.name]}</span>
                <span className="natal-planet-sign">{ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}\u00B0</span>
                <span className="natal-planet-house">{p.house ? `House ${p.house}` : '\u2014'}</span>
              </div>
            ))}
          </div>

          {/* Time missing note */}
          {chart.timeMissing && (
            <div className="natal-time-note">
              Ascendant, Midheaven, and house placements require birth time.
            </div>
          )}
        </>
      )}
      </>) : chartMode === 'live' ? (
        !liveSky ? (
          <div className="natal-sky-now-loading">Loading current sky...</div>
        ) : natalMode === 'chinese' ? (() => {
          const now = new Date();
          const cYear = now.getFullYear();
          const cMonth = now.getMonth() + 1;
          const cHour = now.getHours();
          const details = getChineseDetails({ year: cYear, month: cMonth, hour: cHour });
          const { stem, branch, innerAnimal, secretAnimal } = details;
          const animal = branch.animal;
          const element = stem.element;
          const fixedEl = CHINESE_FIXED_ELEMENT[animal];
          const lucky = CHINESE_LUCKY[animal];
          const compatibles = CHINESE_COMPATIBLES[animal] || [];
          const incompatible = CHINESE_INCOMPATIBLES[animal];
          const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);
          return (
            <div className="natal-chinese-tab">
              <div className="natal-chinese-hero">
                <div className="natal-chinese-emoji">{CHINESE_ANIMAL_EMOJIS[animal] || ''}</div>
                <div className="natal-chinese-pillar">{element} {animal}</div>
                <div className="natal-chinese-polarity">{stem.polarity} &middot; {stem.char}{branch.char}</div>
                <div className="natal-chinese-card-detail" style={{ marginTop: 4, opacity: 0.6 }}>Year of the {animal} ({cYear})</div>
              </div>

              <div className="natal-chinese-pillar-row">
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'heavenly-stem' ? ' expanded' : ''}`} onClick={() => toggleInfo('heavenly-stem')}>
                  <div className="natal-chinese-card-label">Heavenly Stem <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{stem.char}</div>
                  <div className="natal-chinese-card-value">{stem.name}</div>
                  <div className="natal-chinese-card-detail">{stem.element} {stem.polarity}</div>
                  {expandedInfo === 'heavenly-stem' && <div className="natal-chinese-info-text">{CHINESE_INFO['heavenly-stem']}</div>}
                </div>
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'earthly-branch' ? ' expanded' : ''}`} onClick={() => toggleInfo('earthly-branch')}>
                  <div className="natal-chinese-card-label">Earthly Branch <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{branch.char}</div>
                  <div className="natal-chinese-card-value">{branch.name}</div>
                  <div className="natal-chinese-card-detail">{branch.animal}</div>
                  {expandedInfo === 'earthly-branch' && <div className="natal-chinese-info-text">{CHINESE_INFO['earthly-branch']}</div>}
                </div>
              </div>

              <div className="natal-chinese-cards">
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-animal')}>
                  <div className="natal-chinese-card-label">Year Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value">{animal}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_TRAITS[animal]}</div>
                  <div className="natal-chinese-card-sub">Fixed element: <span style={{ color: CHINESE_ELEMENT_COLORS[fixedEl] }}>{fixedEl}</span></div>
                  {expandedInfo === 'year-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-element' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-element')}>
                  <div className="natal-chinese-card-label">Year Element <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value" style={{ color: CHINESE_ELEMENT_COLORS[element] }}>{element}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_ELEMENT_TRAITS[element]}</div>
                  {expandedInfo === 'year-element' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-element']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'inner-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('inner-animal')}>
                  <div className="natal-chinese-card-label">Month Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value">{innerAnimal}</div>
                  <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[innerAnimal]}</div>
                  {expandedInfo === 'inner-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['inner-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'secret-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('secret-animal')}>
                  <div className="natal-chinese-card-label">Hour Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value">{secretAnimal}</div>
                  <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[secretAnimal]}</div>
                  {expandedInfo === 'secret-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['secret-animal']}</div>}
                </div>
              </div>

              {lucky && (
                <div className={`natal-chinese-lucky natal-chinese-clickable${expandedInfo === 'lucky' ? ' expanded' : ''}`} onClick={() => toggleInfo('lucky')}>
                  <div className="natal-chinese-lucky-title">Lucky Associations <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-lucky-grid">
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Numbers</span>
                      <span className="natal-chinese-lucky-val">{lucky.numbers.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Colors</span>
                      <span className="natal-chinese-lucky-val">{lucky.colors.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Flower</span>
                      <span className="natal-chinese-lucky-val">{lucky.flower}</span>
                    </div>
                  </div>
                  {expandedInfo === 'lucky' && <div className="natal-chinese-info-text">{CHINESE_INFO['lucky']}</div>}
                </div>
              )}

              <div className={`natal-chinese-compat natal-chinese-clickable${expandedInfo === 'compatibility' ? ' expanded' : ''}`} onClick={() => toggleInfo('compatibility')}>
                <div className="natal-chinese-compat-label">Most Compatible <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-chinese-compat-list">
                  {compatibles.map(a => (
                    <span key={a} className="natal-chinese-compat-tag">
                      {CHINESE_ANIMAL_EMOJIS[a]} {a}
                    </span>
                  ))}
                </div>
                {incompatible && (
                  <div className="natal-chinese-compat-clash">
                    Challenging match: {CHINESE_ANIMAL_EMOJIS[incompatible]} {incompatible}
                  </div>
                )}
                {expandedInfo === 'compatibility' && <div className="natal-chinese-info-text">{CHINESE_INFO['compatibility']}</div>}
              </div>
            </div>
          );
        })() : natalMode === 'synthesis' ? (
          <div className="natal-sky-now-tab">
            {/* Dual hero cards: tropical + sidereal Sun */}
            <div className="natal-synthesis-wheels">
              <div className="natal-synthesis-wheel-card">
                <div className="natal-synthesis-wheel-label">Current Sky</div>
                <div className="natal-synthesis-wheel-subtitle">The Embodied Energy</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[currentTropSun] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{currentTropSun}</div>
                {(() => {
                  const z = chronosphaeraZodiac.find(zz => zz.sign === currentTropSun);
                  return z ? (
                    <>
                      <div className="natal-synthesis-wheel-archetype">{z.archetype}</div>
                      <div className="natal-synthesis-wheel-detail">{z.modality} {z.element}</div>
                    </>
                  ) : null;
                })()}
              </div>
              <div className="natal-synthesis-wheel-card">
                <div className="natal-synthesis-wheel-label">Stellar Sky</div>
                <div className="natal-synthesis-wheel-subtitle">The Timeless Current</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[currentSidSun] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{currentSidSun}</div>
                {(() => {
                  const constAbbr = SIGN_TO_CONSTELLATION[currentSidSun];
                  const constellation = constAbbr ? constellationContent[constAbbr] : null;
                  return constellation ? (
                    <>
                      <div className="natal-synthesis-wheel-archetype">{constellation.name}</div>
                      <div className="natal-synthesis-wheel-detail">{constellation.brightestStar}</div>
                    </>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Dual-column planetary table */}
            <div className="natal-synthesis-planet-table">
              <div className="natal-synthesis-table-header">
                <span className="natal-synthesis-table-planet">Planet</span>
                <span className="natal-synthesis-table-col">Tropical</span>
                <span className="natal-synthesis-table-col">Sidereal</span>
              </div>
              {liveSkyDual.map(p => (
                <div key={p.name} className="natal-synthesis-table-row">
                  <span className="natal-synthesis-table-planet">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}&deg;
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.sidSign] || ''} {p.sidSign} {p.sidDegree}&deg;
                  </span>
                </div>
              ))}
            </div>

            {/* Current aspects (collapsible) */}
            {liveSky.aspects?.length > 0 && (
              <div className="natal-transit-aspects">
                <div className="natal-transit-aspects-title natal-aspects-toggle" onClick={() => setAspectsOpen(prev => ({ ...prev, current: !prev.current }))}>
                  Current Aspects <span className="natal-aspects-count">({liveSky.aspects.length})</span> <span className={`natal-aspects-arrow${aspectsOpen.current ? ' open' : ''}`}>&#9662;</span>
                </div>
                {aspectsOpen.current && liveSky.aspects.map((a, i) => (
                  <div key={i} className="natal-transit-aspect">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet1]}</span> {a.planet1} {a.aspect.toLowerCase()} <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet2]}</span> {a.planet2} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Narrative reading */}
            <div className="natal-synthesis-narrative">
              <div className="natal-synthesis-narrative-title">The Sky Right Now</div>
              {skyNowNarrative.map((para, i) => (
                <p key={i} className="natal-synthesis-narrative-para">{para}</p>
              ))}
            </div>

            <div className="natal-sky-now-timestamp">
              Computed {new Date(liveSky.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="natal-sky-now-tab">
            {/* Sun hero card */}
            <div className="natal-big-three">
              {(() => {
                const useSid = natalMode === 'sidereal';
                const sunSign = useSid ? currentSidSun : currentTropSun;
                const sunPlanet = useSid
                  ? liveSkyDual.find(p => p.name === 'Sun')
                  : liveSky.planets.find(p => p.name === 'Sun');
                const moonPlanet = useSid
                  ? liveSkyDual.find(p => p.name === 'Moon')
                  : liveSky.planets.find(p => p.name === 'Moon');
                const moonSign = useSid ? moonPlanet?.sidSign : moonPlanet?.sign;
                return (
                  <>
                    {sunPlanet && (
                      <div className="natal-big-three-card">
                        <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[sunSign] || ''}</div>
                        <div className="natal-big-three-label">Sun</div>
                        <div className="natal-big-three-sign">{sunSign}</div>
                        <div className="natal-big-three-degree">{useSid ? sunPlanet.sidDegree : sunPlanet.degree}&deg;</div>
                      </div>
                    )}
                    {moonPlanet && (
                      <div className="natal-big-three-card">
                        <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[moonSign] || ''}</div>
                        <div className="natal-big-three-label">Moon</div>
                        <div className="natal-big-three-sign">{moonSign}</div>
                        <div className="natal-big-three-degree">{useSid ? moonPlanet.sidDegree : moonPlanet.degree}&deg;</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Planet positions */}
            <div className="natal-planets-grid">
              {(natalMode === 'sidereal' ? liveSkyDual : liveSky.planets)?.map(p => {
                const sign = natalMode === 'sidereal' ? p.sidSign : p.sign;
                const deg = natalMode === 'sidereal' ? p.sidDegree : p.degree;
                return (
                  <div key={p.name} className="natal-planet-row">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span>
                    <span className="natal-planet-name">{p.name}</span>
                    <span className="natal-planet-metal">{PLANET_METALS[p.name]}</span>
                    <span className="natal-planet-sign">{ZODIAC_SYMBOLS[sign] || ''} {sign} {deg}&deg;</span>
                    <span className="natal-planet-house">&mdash;</span>
                  </div>
                );
              })}
            </div>

            {/* Current aspects (collapsible) */}
            {liveSky.aspects?.length > 0 && (
              <div className="natal-transit-aspects">
                <div className="natal-transit-aspects-title natal-aspects-toggle" onClick={() => setAspectsOpen(prev => ({ ...prev, current: !prev.current }))}>
                  Current Aspects <span className="natal-aspects-count">({liveSky.aspects.length})</span> <span className={`natal-aspects-arrow${aspectsOpen.current ? ' open' : ''}`}>&#9662;</span>
                </div>
                {aspectsOpen.current && liveSky.aspects.map((a, i) => (
                  <div key={i} className="natal-transit-aspect">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet1]}</span> {a.planet1} {a.aspect.toLowerCase()} <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet2]}</span> {a.planet2} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                  </div>
                ))}
              </div>
            )}

            <div className="natal-sky-now-timestamp">
              Computed {new Date(liveSky.timestamp).toLocaleString()}
            </div>
          </div>
        )
      ) : chartMode === 'transits' ? (
        !liveSky ? (
          <div className="natal-sky-now-loading">Loading current sky...</div>
        ) : natalMode === 'chinese' ? (() => {
          const now = new Date();
          const cYear = now.getFullYear();
          const birthDetails = chart?.birthData ? getChineseDetails(chart.birthData) : null;
          const currentDetails = getChineseDetails({ year: cYear, month: now.getMonth() + 1, hour: now.getHours() });
          const birthAnimal = birthDetails?.branch?.animal;
          const birthElement = birthDetails?.stem?.element;
          const currentAnimal = currentDetails.branch.animal;
          const currentElement = currentDetails.stem.element;
          const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);
          return (
            <div className="natal-chinese-tab">
              <div className="natal-synthesis-wheels">
                <div className="natal-synthesis-wheel-card">
                  <div className="natal-synthesis-wheel-label">Your Birth Year</div>
                  <div className="natal-synthesis-wheel-symbol">{CHINESE_ANIMAL_EMOJIS[birthAnimal] || '?'}</div>
                  <div className="natal-synthesis-wheel-sign">{birthElement || '?'} {birthAnimal || '?'}</div>
                  {birthDetails && (
                    <div className="natal-synthesis-wheel-detail">{birthDetails.stem.polarity} &middot; {birthDetails.stem.char}{birthDetails.branch.char}</div>
                  )}
                </div>
                <div className="natal-synthesis-wheel-card">
                  <div className="natal-synthesis-wheel-label">Current Year ({cYear})</div>
                  <div className="natal-synthesis-wheel-symbol">{CHINESE_ANIMAL_EMOJIS[currentAnimal] || ''}</div>
                  <div className="natal-synthesis-wheel-sign">{currentElement} {currentAnimal}</div>
                  <div className="natal-synthesis-wheel-detail">{currentDetails.stem.polarity} &middot; {currentDetails.stem.char}{currentDetails.branch.char}</div>
                </div>
              </div>

              {birthAnimal && (
                <div className={`natal-chinese-compat natal-chinese-clickable${expandedInfo === 'transit-compat' ? ' expanded' : ''}`} onClick={() => toggleInfo('transit-compat')}>
                  <div className="natal-chinese-compat-label">Year Compatibility <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-detail" style={{ marginTop: 8 }}>
                    {(CHINESE_COMPATIBLES[birthAnimal] || []).includes(currentAnimal)
                      ? `The ${currentAnimal} year harmonizes well with your ${birthAnimal} nature.`
                      : CHINESE_INCOMPATIBLES[birthAnimal] === currentAnimal
                      ? `The ${currentAnimal} year challenges your ${birthAnimal} nature \u2014 a year of growth through friction.`
                      : `The ${currentAnimal} year is a neutral match for your ${birthAnimal} nature.`}
                  </div>
                  {expandedInfo === 'transit-compat' && <div className="natal-chinese-info-text">In Chinese astrology, certain animal signs naturally harmonize while others clash. Compatible animals share similar rhythms and values. Challenging matches create friction that can catalyze growth. Neutral years offer steady energy without strong push or pull.</div>}
                </div>
              )}
            </div>
          );
        })() : natalMode === 'synthesis' ? (
          <div className="natal-transits-tab">
            {/* Dual-column: Natal (both systems) vs Transit (both systems) */}
            <div className="natal-synthesis-planet-table">
              <div className="natal-synthesis-table-header">
                <span className="natal-synthesis-table-planet">Planet</span>
                <span className="natal-synthesis-table-col">Natal</span>
                <span className="natal-synthesis-table-col">Transit</span>
              </div>
              {chart?.planets?.map(p => {
                const transit = liveSky.planets.find(t => t.name === p.name);
                return (
                  <div key={p.name} className="natal-synthesis-table-row">
                    <span className="natal-synthesis-table-planet">
                      <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                    </span>
                    <span className="natal-synthesis-table-col">
                      {ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}&deg;
                    </span>
                    <span className="natal-synthesis-table-col">
                      {transit ? <>{ZODIAC_SYMBOLS[transit.sign] || ''} {transit.sign} {transit.degree}&deg;</> : '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cross-chart aspects (collapsible) */}
            {crossAspects.length > 0 && (
              <div className="natal-transit-aspects">
                <div className="natal-transit-aspects-title natal-aspects-toggle" onClick={() => setAspectsOpen(prev => ({ ...prev, transit: !prev.transit }))}>
                  Transit Aspects to Your Chart <span className="natal-aspects-count">({crossAspects.length})</span> <span className={`natal-aspects-arrow${aspectsOpen.transit ? ' open' : ''}`}>&#9662;</span>
                </div>
                {aspectsOpen.transit && crossAspects.map((a, i) => (
                  <div key={i} className="natal-transit-aspect">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.transitPlanet]}</span> Transit {a.transitPlanet} {a.aspect.toLowerCase()} your <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.natalPlanet]}</span> {a.natalPlanet} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                    {TRANSIT_ASPECT_MEANING[a.aspect] && (
                      <span className="natal-transit-meaning"> &mdash; {TRANSIT_ASPECT_MEANING[a.aspect]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Transit narrative */}
            {transitNarrative.length > 0 && (
              <div className="natal-synthesis-narrative">
                <div className="natal-synthesis-narrative-title">Your Transit Weather</div>
                {transitNarrative.map((para, i) => (
                  <p key={i} className="natal-synthesis-narrative-para">{para}</p>
                ))}
              </div>
            )}

            <div className="natal-sky-now-timestamp">
              Computed {new Date(liveSky.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="natal-transits-tab">
            {/* Natal vs Transit table — tropical or sidereal depending on tab */}
            {(() => {
              const useSid = natalMode === 'sidereal';
              const natalPlanets = useSid
                ? chart?.planets?.map(p => {
                    const s = toSiderealSign(p.longitude, birthYear);
                    return { ...p, sign: s.sign, degree: s.degree };
                  })
                : chart?.planets;
              const transitPlanets = useSid ? liveSkyDual : liveSky.planets;
              return (
                <>
                  <div className="natal-synthesis-planet-table">
                    <div className="natal-synthesis-table-header">
                      <span className="natal-synthesis-table-planet">Planet</span>
                      <span className="natal-synthesis-table-col">Natal</span>
                      <span className="natal-synthesis-table-col">Transit</span>
                    </div>
                    {natalPlanets?.map(p => {
                      const tr = transitPlanets.find(t => t.name === p.name);
                      const trSign = useSid ? tr?.sidSign : tr?.sign;
                      const trDeg = useSid ? tr?.sidDegree : tr?.degree;
                      return (
                        <div key={p.name} className="natal-synthesis-table-row">
                          <span className="natal-synthesis-table-planet">
                            <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                          </span>
                          <span className="natal-synthesis-table-col">
                            {ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}&deg;
                          </span>
                          <span className="natal-synthesis-table-col">
                            {tr ? <>{ZODIAC_SYMBOLS[trSign] || ''} {trSign} {trDeg}&deg;</> : '\u2014'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cross-chart aspects (collapsible) */}
                  {crossAspects.length > 0 && (
                    <div className="natal-transit-aspects">
                      <div className="natal-transit-aspects-title natal-aspects-toggle" onClick={() => setAspectsOpen(prev => ({ ...prev, transit: !prev.transit }))}>
                        Transit Aspects to Your Chart <span className="natal-aspects-count">({crossAspects.length})</span> <span className={`natal-aspects-arrow${aspectsOpen.transit ? ' open' : ''}`}>&#9662;</span>
                      </div>
                      {aspectsOpen.transit && crossAspects.map((a, i) => (
                        <div key={i} className="natal-transit-aspect">
                          <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.transitPlanet]}</span> Transit {a.transitPlanet} {a.aspect.toLowerCase()} your <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.natalPlanet]}</span> {a.natalPlanet} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                          {TRANSIT_ASPECT_MEANING[a.aspect] && (
                            <span className="natal-transit-meaning"> &mdash; {TRANSIT_ASPECT_MEANING[a.aspect]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="natal-sky-now-timestamp">
              Computed {new Date(liveSky.timestamp).toLocaleString()}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

/* ---- City lookup table for natal chart input, organized by country ---- */
const COUNTRY_CITIES = {
  US: {
    'new york': { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    'nyc': { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    'los angeles': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
    'la': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
    'chicago': { lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
    'houston': { lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
    'phoenix': { lat: 33.4484, lon: -112.074, tz: 'America/Phoenix' },
    'philadelphia': { lat: 39.9526, lon: -75.1652, tz: 'America/New_York' },
    'san antonio': { lat: 29.4241, lon: -98.4936, tz: 'America/Chicago' },
    'san diego': { lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' },
    'dallas': { lat: 32.7767, lon: -96.797, tz: 'America/Chicago' },
    'san jose': { lat: 37.3382, lon: -121.8863, tz: 'America/Los_Angeles' },
    'san francisco': { lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
    'seattle': { lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
    'denver': { lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
    'boston': { lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
    'atlanta': { lat: 33.749, lon: -84.388, tz: 'America/New_York' },
    'miami': { lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
    'minneapolis': { lat: 44.9778, lon: -93.265, tz: 'America/Chicago' },
    'portland': { lat: 45.5152, lon: -122.6784, tz: 'America/Los_Angeles' },
    'detroit': { lat: 42.3314, lon: -83.0458, tz: 'America/New_York' },
    'nashville': { lat: 36.1627, lon: -86.7816, tz: 'America/Chicago' },
    'austin': { lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
    'birmingham': { lat: 33.5186, lon: -86.8104, tz: 'America/Chicago' },
    'memphis': { lat: 35.1495, lon: -90.049, tz: 'America/Chicago' },
    'louisville': { lat: 38.2527, lon: -85.7585, tz: 'America/New_York' },
    'baltimore': { lat: 39.2904, lon: -76.6122, tz: 'America/New_York' },
    'milwaukee': { lat: 43.0389, lon: -87.9065, tz: 'America/Chicago' },
    'albuquerque': { lat: 35.0844, lon: -106.6504, tz: 'America/Denver' },
    'tucson': { lat: 32.2226, lon: -110.9747, tz: 'America/Phoenix' },
    'fresno': { lat: 36.7378, lon: -119.7871, tz: 'America/Los_Angeles' },
    'sacramento': { lat: 38.5816, lon: -121.4944, tz: 'America/Los_Angeles' },
    'mesa': { lat: 33.4152, lon: -111.8315, tz: 'America/Phoenix' },
    'kansas city': { lat: 39.0997, lon: -94.5786, tz: 'America/Chicago' },
    'omaha': { lat: 41.2565, lon: -95.9345, tz: 'America/Chicago' },
    'cleveland': { lat: 41.4993, lon: -81.6944, tz: 'America/New_York' },
    'columbus': { lat: 39.9612, lon: -82.9988, tz: 'America/New_York' },
    'cincinnati': { lat: 39.1031, lon: -84.512, tz: 'America/New_York' },
    'indianapolis': { lat: 39.7684, lon: -86.1581, tz: 'America/New_York' },
    'charlotte': { lat: 35.2271, lon: -80.8431, tz: 'America/New_York' },
    'raleigh': { lat: 35.7796, lon: -78.6382, tz: 'America/New_York' },
    'virginia beach': { lat: 36.8529, lon: -75.978, tz: 'America/New_York' },
    'richmond': { lat: 37.5407, lon: -77.436, tz: 'America/New_York' },
    'pittsburgh': { lat: 40.4406, lon: -79.9959, tz: 'America/New_York' },
    'tampa': { lat: 27.9506, lon: -82.4572, tz: 'America/New_York' },
    'orlando': { lat: 28.5383, lon: -81.3792, tz: 'America/New_York' },
    'jacksonville': { lat: 30.3322, lon: -81.6557, tz: 'America/New_York' },
    'st louis': { lat: 38.627, lon: -90.1994, tz: 'America/Chicago' },
    'saint louis': { lat: 38.627, lon: -90.1994, tz: 'America/Chicago' },
    'new orleans': { lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
    'las vegas': { lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
    'oklahoma city': { lat: 35.4676, lon: -97.5164, tz: 'America/Chicago' },
    'tulsa': { lat: 36.154, lon: -95.9928, tz: 'America/Chicago' },
    'salt lake city': { lat: 40.7608, lon: -111.891, tz: 'America/Denver' },
    'washington': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'washington dc': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'dc': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'fort worth': { lat: 32.7555, lon: -97.3308, tz: 'America/Chicago' },
    'el paso': { lat: 31.7619, lon: -106.485, tz: 'America/Denver' },
    'boise': { lat: 43.615, lon: -116.2023, tz: 'America/Boise' },
    'little rock': { lat: 34.7465, lon: -92.2896, tz: 'America/Chicago' },
    'jackson': { lat: 32.2988, lon: -90.1848, tz: 'America/Chicago' },
    'montgomery': { lat: 32.3668, lon: -86.3, tz: 'America/Chicago' },
    'mobile': { lat: 30.6954, lon: -88.0399, tz: 'America/Chicago' },
    'huntsville': { lat: 34.7304, lon: -86.5861, tz: 'America/Chicago' },
    'savannah': { lat: 32.0809, lon: -81.0912, tz: 'America/New_York' },
    'charleston': { lat: 32.7765, lon: -79.9311, tz: 'America/New_York' },
    'columbia': { lat: 34.0007, lon: -81.0348, tz: 'America/New_York' },
    'knoxville': { lat: 35.9606, lon: -83.9207, tz: 'America/New_York' },
    'chattanooga': { lat: 35.0456, lon: -85.3097, tz: 'America/New_York' },
    'lexington': { lat: 38.0406, lon: -84.5037, tz: 'America/New_York' },
    'des moines': { lat: 41.5868, lon: -93.625, tz: 'America/Chicago' },
    'madison': { lat: 43.0731, lon: -89.4012, tz: 'America/Chicago' },
    'green bay': { lat: 44.5133, lon: -88.0133, tz: 'America/Chicago' },
    'grand rapids': { lat: 42.9634, lon: -85.6681, tz: 'America/New_York' },
    'buffalo': { lat: 42.8864, lon: -78.8784, tz: 'America/New_York' },
    'rochester': { lat: 43.1566, lon: -77.6088, tz: 'America/New_York' },
    'hartford': { lat: 41.7658, lon: -72.6734, tz: 'America/New_York' },
    'providence': { lat: 41.824, lon: -71.4128, tz: 'America/New_York' },
    'wichita': { lat: 37.6872, lon: -97.3301, tz: 'America/Chicago' },
    'spokane': { lat: 47.6588, lon: -117.426, tz: 'America/Los_Angeles' },
    'tacoma': { lat: 47.2529, lon: -122.4443, tz: 'America/Los_Angeles' },
    'reno': { lat: 39.5296, lon: -119.8138, tz: 'America/Los_Angeles' },
    'colorado springs': { lat: 38.8339, lon: -104.8214, tz: 'America/Denver' },
    'bakersfield': { lat: 35.3733, lon: -119.0187, tz: 'America/Los_Angeles' },
    'oakland': { lat: 37.8044, lon: -122.2712, tz: 'America/Los_Angeles' },
    'long beach': { lat: 33.77, lon: -118.1937, tz: 'America/Los_Angeles' },
    'honolulu': { lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
    'anchorage': { lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  },
  CA: {
    'toronto': { lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
    'vancouver': { lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver' },
    'montreal': { lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
    'calgary': { lat: 51.0447, lon: -114.0719, tz: 'America/Edmonton' },
    'edmonton': { lat: 53.5461, lon: -113.4938, tz: 'America/Edmonton' },
    'ottawa': { lat: 45.4215, lon: -75.6972, tz: 'America/Toronto' },
    'winnipeg': { lat: 49.8951, lon: -97.1384, tz: 'America/Winnipeg' },
    'halifax': { lat: 44.6488, lon: -63.5752, tz: 'America/Halifax' },
  },
  MX: {
    'mexico city': { lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
    'guadalajara': { lat: 20.6597, lon: -103.3496, tz: 'America/Mexico_City' },
    'monterrey': { lat: 25.6866, lon: -100.3161, tz: 'America/Mexico_City' },
  },
  PR: {
    'san juan': { lat: 18.4655, lon: -66.1057, tz: 'America/Puerto_Rico' },
  },
  BR: {
    'sao paulo': { lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
    'rio de janeiro': { lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo' },
  },
  AR: {
    'buenos aires': { lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  },
  CO: {
    'bogota': { lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  },
  PE: {
    'lima': { lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  },
  CL: {
    'santiago': { lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  },
  VE: {
    'caracas': { lat: 10.4806, lon: -66.9036, tz: 'America/Caracas' },
  },
  GB: {
    'london': { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    'edinburgh': { lat: 55.9533, lon: -3.1883, tz: 'Europe/London' },
    'manchester': { lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
    'birmingham': { lat: 52.4862, lon: -1.8904, tz: 'Europe/London' },
  },
  FR: {
    'paris': { lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  },
  DE: {
    'berlin': { lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
    'munich': { lat: 48.1351, lon: 11.582, tz: 'Europe/Berlin' },
    'hamburg': { lat: 53.5511, lon: 9.9937, tz: 'Europe/Berlin' },
  },
  IT: {
    'rome': { lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
    'milan': { lat: 45.4642, lon: 9.19, tz: 'Europe/Rome' },
    'naples': { lat: 40.8518, lon: 14.2681, tz: 'Europe/Rome' },
  },
  ES: {
    'madrid': { lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
    'barcelona': { lat: 41.3874, lon: 2.1686, tz: 'Europe/Madrid' },
  },
  NL: {
    'amsterdam': { lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam' },
  },
  AT: {
    'vienna': { lat: 48.2082, lon: 16.3738, tz: 'Europe/Vienna' },
  },
  IE: {
    'dublin': { lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' },
  },
  PT: {
    'lisbon': { lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon' },
  },
  GR: {
    'athens': { lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens' },
  },
  RU: {
    'moscow': { lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  },
  TR: {
    'istanbul': { lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  },
  CZ: {
    'prague': { lat: 50.0755, lon: 14.4378, tz: 'Europe/Prague' },
  },
  PL: {
    'warsaw': { lat: 52.2297, lon: 21.0122, tz: 'Europe/Warsaw' },
  },
  HU: {
    'budapest': { lat: 47.4979, lon: 19.0402, tz: 'Europe/Budapest' },
  },
  RO: {
    'bucharest': { lat: 44.4268, lon: 26.1025, tz: 'Europe/Bucharest' },
  },
  SE: {
    'stockholm': { lat: 59.3293, lon: 18.0686, tz: 'Europe/Stockholm' },
  },
  NO: {
    'oslo': { lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  },
  DK: {
    'copenhagen': { lat: 55.6761, lon: 12.5683, tz: 'Europe/Copenhagen' },
  },
  FI: {
    'helsinki': { lat: 60.1699, lon: 24.9384, tz: 'Europe/Helsinki' },
  },
  BE: {
    'brussels': { lat: 50.8503, lon: 4.3517, tz: 'Europe/Brussels' },
  },
  CH: {
    'zurich': { lat: 47.3769, lon: 8.5417, tz: 'Europe/Zurich' },
    'geneva': { lat: 46.2044, lon: 6.1432, tz: 'Europe/Zurich' },
  },
  UA: {
    'kiev': { lat: 50.4501, lon: 30.5234, tz: 'Europe/Kiev' },
    'kyiv': { lat: 50.4501, lon: 30.5234, tz: 'Europe/Kiev' },
  },
  JP: {
    'tokyo': { lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
    'osaka': { lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo' },
  },
  CN: {
    'beijing': { lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
    'shanghai': { lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  },
  IN: {
    'mumbai': { lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
    'delhi': { lat: 28.7041, lon: 77.1025, tz: 'Asia/Kolkata' },
    'new delhi': { lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
    'bangalore': { lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    'kolkata': { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    'chennai': { lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  },
  SG: {
    'singapore': { lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  },
  TH: {
    'bangkok': { lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  },
  KR: {
    'seoul': { lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  },
  HK: {
    'hong kong': { lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  },
  AE: {
    'dubai': { lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  },
  IL: {
    'tel aviv': { lat: 32.0853, lon: 34.7818, tz: 'Asia/Jerusalem' },
    'jerusalem': { lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem' },
  },
  TW: {
    'taipei': { lat: 25.033, lon: 121.5654, tz: 'Asia/Taipei' },
  },
  PH: {
    'manila': { lat: 14.5995, lon: 120.9842, tz: 'Asia/Manila' },
  },
  ID: {
    'jakarta': { lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  },
  MY: {
    'kuala lumpur': { lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  },
  VN: {
    'hanoi': { lat: 21.0278, lon: 105.8342, tz: 'Asia/Ho_Chi_Minh' },
    'ho chi minh city': { lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  },
  PK: {
    'karachi': { lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  },
  IR: {
    'tehran': { lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran' },
  },
  SA: {
    'riyadh': { lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  },
  AU: {
    'sydney': { lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
    'melbourne': { lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
    'brisbane': { lat: -27.4698, lon: 153.0251, tz: 'Australia/Brisbane' },
    'perth': { lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth' },
  },
  NZ: {
    'auckland': { lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  },
  EG: {
    'cairo': { lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  },
  ZA: {
    'johannesburg': { lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
    'cape town': { lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  },
  NG: {
    'lagos': { lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  },
  KE: {
    'nairobi': { lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
  },
  GH: {
    'accra': { lat: 5.6037, lon: -0.187, tz: 'Africa/Accra' },
  },
  MA: {
    'casablanca': { lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca' },
  },
  ET: {
    'addis ababa': { lat: 9.025, lon: 38.7469, tz: 'Africa/Addis_Ababa' },
  },
};

const COUNTRY_LABELS = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', PR: 'Puerto Rico',
  BR: 'Brazil', AR: 'Argentina', CO: 'Colombia', PE: 'Peru', CL: 'Chile', VE: 'Venezuela',
  GB: 'United Kingdom', FR: 'France', DE: 'Germany', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', AT: 'Austria', IE: 'Ireland', PT: 'Portugal', GR: 'Greece',
  RU: 'Russia', TR: 'Turkey', CZ: 'Czech Republic', PL: 'Poland', HU: 'Hungary',
  RO: 'Romania', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  BE: 'Belgium', CH: 'Switzerland', UA: 'Ukraine',
  JP: 'Japan', CN: 'China', IN: 'India', SG: 'Singapore', TH: 'Thailand',
  KR: 'South Korea', HK: 'Hong Kong', AE: 'UAE', IL: 'Israel', TW: 'Taiwan',
  PH: 'Philippines', ID: 'Indonesia', MY: 'Malaysia', VN: 'Vietnam',
  PK: 'Pakistan', IR: 'Iran', SA: 'Saudi Arabia',
  AU: 'Australia', NZ: 'New Zealand',
  EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya',
  GH: 'Ghana', MA: 'Morocco', ET: 'Ethiopia',
};

const SORTED_COUNTRIES = Object.keys(COUNTRY_LABELS).sort((a, b) =>
  COUNTRY_LABELS[a].localeCompare(COUNTRY_LABELS[b])
);

const TZ_OFFSETS = {
  'America/New_York': { standard: -5, dst: -4 },
  'America/Chicago': { standard: -6, dst: -5 },
  'America/Denver': { standard: -7, dst: -6 },
  'America/Los_Angeles': { standard: -8, dst: -7 },
  'America/Phoenix': { standard: -7, dst: -7 },
  'America/Anchorage': { standard: -9, dst: -8 },
  'Pacific/Honolulu': { standard: -10, dst: -10 },
  'America/Toronto': { standard: -5, dst: -4 },
  'America/Vancouver': { standard: -8, dst: -7 },
  'America/Mexico_City': { standard: -6, dst: -5 },
  'America/Sao_Paulo': { standard: -3, dst: -3 },
  'America/Argentina/Buenos_Aires': { standard: -3, dst: -3 },
  'Europe/London': { standard: 0, dst: 1 },
  'Europe/Paris': { standard: 1, dst: 2 },
  'Europe/Berlin': { standard: 1, dst: 2 },
  'Europe/Rome': { standard: 1, dst: 2 },
  'Europe/Madrid': { standard: 1, dst: 2 },
  'Europe/Amsterdam': { standard: 1, dst: 2 },
  'Europe/Vienna': { standard: 1, dst: 2 },
  'Europe/Dublin': { standard: 0, dst: 1 },
  'Europe/Lisbon': { standard: 0, dst: 1 },
  'Europe/Athens': { standard: 2, dst: 3 },
  'Europe/Moscow': { standard: 3, dst: 3 },
  'Europe/Istanbul': { standard: 3, dst: 3 },
  'Asia/Tokyo': { standard: 9, dst: 9 },
  'Asia/Shanghai': { standard: 8, dst: 8 },
  'Asia/Kolkata': { standard: 5.5, dst: 5.5 },
  'Asia/Singapore': { standard: 8, dst: 8 },
  'Asia/Bangkok': { standard: 7, dst: 7 },
  'Asia/Seoul': { standard: 9, dst: 9 },
  'Asia/Hong_Kong': { standard: 8, dst: 8 },
  'Asia/Dubai': { standard: 4, dst: 4 },
  'Asia/Jerusalem': { standard: 2, dst: 3 },
  'Australia/Sydney': { standard: 11, dst: 10 },
  'Australia/Melbourne': { standard: 11, dst: 10 },
  'America/Boise': { standard: -7, dst: -6 },
  'America/Edmonton': { standard: -7, dst: -6 },
  'America/Winnipeg': { standard: -6, dst: -5 },
  'America/Halifax': { standard: -4, dst: -3 },
  'America/Puerto_Rico': { standard: -4, dst: -4 },
  'America/Bogota': { standard: -5, dst: -5 },
  'America/Lima': { standard: -5, dst: -5 },
  'America/Santiago': { standard: -4, dst: -3 },
  'America/Caracas': { standard: -4, dst: -4 },
  'Europe/Prague': { standard: 1, dst: 2 },
  'Europe/Warsaw': { standard: 1, dst: 2 },
  'Europe/Budapest': { standard: 1, dst: 2 },
  'Europe/Bucharest': { standard: 2, dst: 3 },
  'Europe/Stockholm': { standard: 1, dst: 2 },
  'Europe/Oslo': { standard: 1, dst: 2 },
  'Europe/Copenhagen': { standard: 1, dst: 2 },
  'Europe/Helsinki': { standard: 2, dst: 3 },
  'Europe/Brussels': { standard: 1, dst: 2 },
  'Europe/Zurich': { standard: 1, dst: 2 },
  'Europe/Kiev': { standard: 2, dst: 3 },
  'Asia/Taipei': { standard: 8, dst: 8 },
  'Asia/Manila': { standard: 8, dst: 8 },
  'Asia/Jakarta': { standard: 7, dst: 7 },
  'Asia/Kuala_Lumpur': { standard: 8, dst: 8 },
  'Asia/Ho_Chi_Minh': { standard: 7, dst: 7 },
  'Asia/Karachi': { standard: 5, dst: 5 },
  'Asia/Tehran': { standard: 3.5, dst: 4.5 },
  'Asia/Riyadh': { standard: 3, dst: 3 },
  'Australia/Brisbane': { standard: 10, dst: 10 },
  'Australia/Perth': { standard: 8, dst: 8 },
  'Pacific/Auckland': { standard: 13, dst: 12 },
  'Africa/Cairo': { standard: 2, dst: 2 },
  'Africa/Johannesburg': { standard: 2, dst: 2 },
  'Africa/Lagos': { standard: 1, dst: 1 },
  'Africa/Nairobi': { standard: 3, dst: 3 },
  'Africa/Accra': { standard: 0, dst: 0 },
  'Africa/Casablanca': { standard: 1, dst: 0 },
  'Africa/Addis_Ababa': { standard: 3, dst: 3 },
};

function lookupCity(countryCode, name) {
  const cities = COUNTRY_CITIES[countryCode];
  if (!cities) return null;
  const key = name.trim().toLowerCase();
  return cities[key] || null;
}

function isDST(year, month, day, tz) {
  if (tz.startsWith('America/') && tz !== 'America/Phoenix' && tz !== 'America/Argentina/Buenos_Aires' && tz !== 'America/Sao_Paulo') {
    const marchSecondSun = (() => { const d = new Date(year, 2, 1); const dow = d.getDay(); return dow === 0 ? 8 : 8 + (7 - dow); })();
    const novFirstSun = (() => { const d = new Date(year, 10, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    if (month > 3 && month < 11) return true;
    if (month === 3 && day >= marchSecondSun) return true;
    if (month === 11 && day < novFirstSun) return true;
    return false;
  }
  if (tz.startsWith('Europe/') && tz !== 'Europe/Moscow' && tz !== 'Europe/Istanbul') {
    const marchLastSun = (() => { const d = new Date(year, 2, 31); return 31 - d.getDay(); })();
    const octLastSun = (() => { const d = new Date(year, 9, 31); return 31 - d.getDay(); })();
    if (month > 3 && month < 10) return true;
    if (month === 3 && day >= marchLastSun) return true;
    if (month === 10 && day < octLastSun) return true;
    return false;
  }
  if (tz.startsWith('Australia/')) {
    const octFirstSun = (() => { const d = new Date(year, 9, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    const aprFirstSun = (() => { const d = new Date(year, 3, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    if (month > 10 || month < 4) return true;
    if (month === 10 && day >= octFirstSun) return true;
    if (month === 4 && day < aprFirstSun) return true;
    return false;
  }
  return false;
}

function getUTCOffset(tz, year, month, day) {
  const tzData = TZ_OFFSETS[tz];
  if (!tzData) return 0;
  const dst = isDST(year, month, day, tz);
  return dst ? tzData.dst : tzData.standard;
}

function NatalChartInput({ existingChart, onSave }) {
  const [expanded, setExpanded] = useState(!existingChart);
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cityMatch, setCityMatch] = useState(null);

  const handleCountryChange = useCallback((code) => {
    setCountry(code);
    setCityInput('');
    setCityMatch(null);
  }, []);

  const handleCityChange = useCallback((value) => {
    setCityInput(value);
    if (country) {
      setCityMatch(lookupCity(country, value));
    } else {
      setCityMatch(null);
    }
  }, [country]);

  const handleCompute = async () => {
    setError('');
    if (!country) { setError('Please select a country.'); return; }
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!cityInput.trim()) { setError('Please enter your birth city.'); return; }

    const city = lookupCity(country, cityInput);
    if (!city) { setError('City not found. Try a major city name in ' + COUNTRY_LABELS[country] + '.'); return; }

    const [yearStr, monthStr, dayStr] = birthDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    let hour = -1;
    let minute = 0;
    if (birthTime) {
      const [hStr, mStr] = birthTime.split(':');
      hour = parseInt(hStr, 10);
      minute = parseInt(mStr, 10);
    }

    const utcOffset = getUTCOffset(city.tz, year, month, day);

    setLoading(true);
    try {
      const res = await apiFetch('/api/celestial?type=natal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year, month, day, hour, minute,
          latitude: city.lat,
          longitude: city.lon,
          city: cityInput.trim(),
          utcOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to compute chart.'); setLoading(false); return; }
      await onSave(data.chart);
      setExpanded(false);
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="natal-input-section">
      <button className="natal-input-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Cancel' : existingChart ? 'Update Birth Data' : 'Enter Birth Data'}
      </button>
      {expanded && (
        <div className="natal-input-form">
          <div className="natal-input-row">
            <label className="natal-input-label">
              Country
              <select
                className="natal-input-field natal-input-select"
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
              >
                <option value="">Select country...</option>
                {SORTED_COUNTRIES.map(code => (
                  <option key={code} value={code}>{COUNTRY_LABELS[code]}</option>
                ))}
              </select>
            </label>
          </div>
          {country && (
            <div className="natal-input-row">
              <label className="natal-input-label">
                Birth City
                <input
                  type="text"
                  className="natal-input-field"
                  placeholder="e.g. Birmingham, Nashville..."
                  value={cityInput}
                  onChange={e => handleCityChange(e.target.value)}
                />
                {cityInput.trim() && cityMatch && (
                  <span className="natal-input-hint natal-city-found">
                    {cityMatch.lat.toFixed(2)}, {cityMatch.lon.toFixed(2)}
                  </span>
                )}
                {cityInput.trim() && !cityMatch && (
                  <span className="natal-input-hint natal-city-not-found">City not recognized</span>
                )}
              </label>
            </div>
          )}
          <div className="natal-input-row">
            <label className="natal-input-label">
              Birth Date
              <input
                type="date"
                className="natal-input-field"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </label>
          </div>
          <div className="natal-input-row">
            <label className="natal-input-label">
              Birth Time <span className="natal-input-optional">(optional)</span>
              <input
                type="time"
                className="natal-input-field"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
              />
              <span className="natal-input-hint">For Rising sign and house placements</span>
            </label>
          </div>
          {error && <div className="natal-input-error">{error}</div>}
          <button
            className="natal-input-compute"
            onClick={handleCompute}
            disabled={loading}
          >
            {loading ? 'Computing...' : 'Compute Chart'}
          </button>
        </div>
      )}
    </div>
  );
}

export { NatalChartDisplay, NatalChartInput, ZODIAC_SYMBOLS };
