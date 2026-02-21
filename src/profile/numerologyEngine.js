/**
 * Pythagorean Numerology Engine
 * Computes Expression, Soul Urge, and Personality numbers from a full name.
 */

// Pythagorean letter-to-number mapping (A=1 ... I=9, J=1 ... R=9, S=1 ... Z=8)
const LETTER_VALUES = {
  A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
  J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
  S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8,
};

const VOWELS = new Set(['A','E','I','O','U']);

// Master numbers preserved during reduction
const MASTER_NUMBERS = new Set([11, 22, 33]);

/**
 * Reduce a sum to a single digit, preserving master numbers (11, 22, 33).
 */
export function reduceToDigit(sum) {
  while (sum > 9 && !MASTER_NUMBERS.has(sum)) {
    let next = 0;
    while (sum > 0) {
      next += sum % 10;
      sum = Math.floor(sum / 10);
    }
    sum = next;
  }
  return sum;
}

/**
 * Compute Expression, Soul Urge, and Personality numbers from a full name.
 * Returns null if the name contains no usable letters.
 */
export function computeNumerology(fullName) {
  if (!fullName || typeof fullName !== 'string') return null;

  const letters = fullName.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length === 0) return null;

  let allSum = 0;
  let vowelSum = 0;
  let consonantSum = 0;

  for (const ch of letters) {
    const val = LETTER_VALUES[ch];
    allSum += val;
    if (VOWELS.has(ch)) {
      vowelSum += val;
    } else {
      consonantSum += val;
    }
  }

  return {
    expression: reduceToDigit(allSum),
    soulUrge: reduceToDigit(vowelSum),
    personality: reduceToDigit(consonantSum),
  };
}

/** One-line interpretation for each reduced number */
export const NUMBER_MEANINGS = {
  1: 'The Leader — independent, pioneering, self-reliant.',
  2: 'The Diplomat — cooperative, sensitive, harmonious.',
  3: 'The Creator — expressive, joyful, artistic.',
  4: 'The Builder — disciplined, practical, grounded.',
  5: 'The Adventurer — freedom-loving, adaptable, curious.',
  6: 'The Nurturer — responsible, caring, community-minded.',
  7: 'The Seeker — introspective, analytical, spiritual.',
  8: 'The Powerhouse — ambitious, authoritative, material mastery.',
  9: 'The Humanitarian — compassionate, wise, selfless.',
  11: 'The Visionary — intuitive, inspired, spiritually attuned.',
  22: 'The Master Builder — visionary architect, manifests large-scale dreams.',
  33: 'The Master Teacher — uplifting, healing, selfless service.',
};

/** Label, subtitle, and description for each of the three number types */
export const NUMBER_TYPES = {
  expression: {
    label: 'Expression',
    subtitle: 'Your outward path',
    description: 'The full sum of your name — your talents, abilities, and life purpose.',
  },
  soulUrge: {
    label: 'Soul Urge',
    subtitle: 'Your inner desire',
    description: 'The vowels of your name — what drives you at the deepest level.',
  },
  personality: {
    label: 'Personality',
    subtitle: 'Your outer mask',
    description: 'The consonants of your name — how others perceive you.',
  },
};
