import { CATEGORY_CONFIG, GAME_NAMES } from '../storyCards/storyCardDefs';

/**
 * Location score (0-100).
 * Same city+country = 100, same country only = 50, else 0.
 */
export function computeLocationScore(myProfile, theirProfile) {
  const my = myProfile.location;
  const their = theirProfile.location;
  if (!my || !their) return 0;
  if (my.city && their.city && my.city === their.city && my.country && their.country && my.country === their.country) return 100;
  if (my.country && their.country && my.country === their.country) return 50;
  return 0;
}

/**
 * Overlap score (0-100) using weighted Jaccard similarity.
 * Weights: games(20%), courses(25%), journeys(20%), categories(15%),
 *          sunSign(10%), moonSign(5%), chinese(5%)
 */
export function computeOverlapScore(myProfile, theirProfile) {
  const weights = [
    { key: 'games',      w: 20, type: 'set' },
    { key: 'courses',    w: 25, type: 'set' },
    { key: 'journeyTypes', w: 20, type: 'set' },
    { key: 'cardCategories', w: 15, type: 'set' },
    { key: 'sunSign',   w: 10, type: 'exact' },
    { key: 'moonSign',  w: 5,  type: 'exact' },
    { key: 'chinesePillar', w: 5, type: 'exact' },
  ];

  let totalScore = 0;
  let totalWeight = 0;

  for (const { key, w, type } of weights) {
    if (type === 'set') {
      const myArr = myProfile.completions?.[key] || [];
      const theirArr = theirProfile.completions?.[key] || [];
      if (myArr.length === 0 && theirArr.length === 0) continue;
      totalWeight += w;
      const mySet = new Set(myArr);
      const theirSet = new Set(theirArr);
      const intersection = [...mySet].filter(x => theirSet.has(x)).length;
      const union = new Set([...mySet, ...theirSet]).size;
      if (union > 0) totalScore += w * (intersection / union);
    } else {
      const myVal = myProfile.astro?.[key];
      const theirVal = theirProfile.astro?.[key];
      if (!myVal && !theirVal) continue;
      totalWeight += w;
      if (myVal && theirVal && myVal === theirVal) totalScore += w;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((totalScore / totalWeight) * 100);
}

/**
 * Compute quick match combining location + overlap.
 * Returns { score, locationScore, overlapScore, highlights, matchingCategories }
 */
export function computeQuickMatch(myProfile, theirProfile) {
  const locationScore = computeLocationScore(myProfile, theirProfile);
  const overlapScore = computeOverlapScore(myProfile, theirProfile);
  const highlights = [];
  const matchingCategories = new Set();

  // Location highlights
  if (locationScore === 100) {
    highlights.push({ category: 'location', label: `Same city: ${myProfile.location.city}` });
  } else if (locationScore === 50) {
    highlights.push({ category: 'location', label: `Same country: ${myProfile.location.country}` });
  }

  // Game overlaps
  const myGames = new Set(myProfile.completions?.games || []);
  const theirGames = new Set(theirProfile.completions?.games || []);
  for (const g of myGames) {
    if (theirGames.has(g)) {
      highlights.push({ category: 'game', label: `Both completed ${GAME_NAMES[g] || g}` });
      matchingCategories.add('game');
    }
  }

  // Course overlaps
  const myCourses = new Set(myProfile.completions?.courses || []);
  const theirCourses = new Set(theirProfile.completions?.courses || []);
  for (const c of myCourses) {
    if (theirCourses.has(c)) {
      highlights.push({ category: 'course', label: `Both earned: ${c}` });
      matchingCategories.add('course');
    }
  }

  // Journey overlaps
  const myJourneys = new Set(myProfile.completions?.journeyTypes || []);
  const theirJourneys = new Set(theirProfile.completions?.journeyTypes || []);
  for (const j of myJourneys) {
    if (theirJourneys.has(j)) {
      highlights.push({ category: 'journey', label: `Shared journey: ${j}` });
      matchingCategories.add('journey');
    }
  }

  // Card category overlaps
  const myCats = new Set(myProfile.completions?.cardCategories || []);
  const theirCats = new Set(theirProfile.completions?.cardCategories || []);
  for (const cat of myCats) {
    if (theirCats.has(cat)) {
      const cfg = CATEGORY_CONFIG[cat];
      if (cfg) matchingCategories.add(cat);
    }
  }

  // Astro matches
  if (myProfile.astro?.sunSign && theirProfile.astro?.sunSign && myProfile.astro.sunSign === theirProfile.astro.sunSign) {
    highlights.push({ category: 'astrology', label: `Same Sun Sign: ${myProfile.astro.sunSign}` });
    matchingCategories.add('astrology');
  }
  if (myProfile.astro?.moonSign && theirProfile.astro?.moonSign && myProfile.astro.moonSign === theirProfile.astro.moonSign) {
    highlights.push({ category: 'astrology', label: `Same Moon Sign: ${myProfile.astro.moonSign}` });
    matchingCategories.add('astrology');
  }
  if (myProfile.astro?.rising && theirProfile.astro?.rising && myProfile.astro.rising === theirProfile.astro.rising) {
    highlights.push({ category: 'astrology', label: `Same Rising: ${myProfile.astro.rising}` });
    matchingCategories.add('astrology');
  }
  if (myProfile.astro?.chinesePillar && theirProfile.astro?.chinesePillar && myProfile.astro.chinesePillar === theirProfile.astro.chinesePillar) {
    highlights.push({ category: 'astrology', label: `Same Chinese Pillar: ${myProfile.astro.chinesePillar}` });
    matchingCategories.add('astrology');
  }

  // Numerology matches
  if (myProfile.numerology?.expression && theirProfile.numerology?.expression && myProfile.numerology.expression === theirProfile.numerology.expression) {
    highlights.push({ category: 'numerology', label: `Same Expression Number: ${myProfile.numerology.expression}` });
    matchingCategories.add('numerology');
  }
  if (myProfile.numerology?.soulUrge && theirProfile.numerology?.soulUrge && myProfile.numerology.soulUrge === theirProfile.numerology.soulUrge) {
    highlights.push({ category: 'numerology', label: `Same Soul Urge: ${myProfile.numerology.soulUrge}` });
    matchingCategories.add('numerology');
  }

  // Combined score: 30% location + 70% overlap (skip location weight if no location data)
  const hasLocation = (myProfile.location?.city || myProfile.location?.country) && (theirProfile.location?.city || theirProfile.location?.country);
  const score = hasLocation
    ? Math.round(locationScore * 0.3 + overlapScore * 0.7)
    : overlapScore;

  return { score, locationScore, overlapScore, highlights, matchingCategories: [...matchingCategories] };
}

/**
 * Build a match-profile document from user's current context data.
 */
export function buildMatchProfile({ uid, handle, photoURL, natalChart, storyCards, certificateData, journeySyntheses, isElementCompleted, mode, excludeFriends, pairedWith }) {
  // Location from natal chart (birth data)
  const location = {
    city: natalChart?.birthCity || null,
    country: natalChart?.birthCountry || null,
  };

  // Completed games
  const GAME_IDS = Object.keys(GAME_NAMES);
  const games = isElementCompleted
    ? GAME_IDS.filter(g => isElementCompleted(`games.${g}.completed`))
    : [];

  // Completed courses
  const courses = certificateData ? Object.keys(certificateData) : [];

  // Journey types from syntheses
  const journeyTypes = journeySyntheses
    ? [...new Set(Object.values(journeySyntheses).filter(s => s.text).map(s => s.journeyId))]
    : [];

  // Card categories with cards
  const cardCategories = storyCards
    ? [...new Set(storyCards.map(c => c.category))]
    : [];

  // Astro data
  const astro = {
    sunSign: natalChart?.planets?.Sun?.sign || null,
    moonSign: natalChart?.planets?.Moon?.sign || null,
    rising: natalChart?.ascendant?.sign || null,
    chinesePillar: natalChart?.chinese?.pillar || null,
  };

  // Numerology — stored in story card metadata
  const numCard = storyCards?.find(c => c.sourceId === 'numerology-name');
  const numerology = {
    expression: numCard?.metadata?.expression || null,
    soulUrge: numCard?.metadata?.soulUrge || null,
    personality: numCard?.metadata?.personality || null,
  };

  return {
    uid,
    handle: handle || null,
    photoURL: photoURL || null,
    mode: mode || 'friends',
    excludeFriends: excludeFriends || false,
    pairedWith: pairedWith || null,
    location,
    completions: {
      games,
      courses,
      journeyTypes,
      cardCategories,
      cardCount: storyCards?.length || 0,
    },
    astro,
    numerology,
  };
}
