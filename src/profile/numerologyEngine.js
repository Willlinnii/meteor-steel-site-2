/**
 * Pythagorean Numerology Engine
 * Digit reduction and letter-to-number mapping: standard Pythagorean table.
 * Number symbolism: Theologumena Arithmeticae (attr. Iamblichus, c. 300 CE,
 * compiled from Nicomachus of Gerasa, c. 100 CE).
 * Master numbers (11, 22, 33): modern addition (L. Dow Balliett, c. 1900).
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

/**
 * Number symbolism from the Pythagorean Decad.
 * Greek names and associations from the Theologumena Arithmeticae.
 * The ancient system covers 1–10; numbers beyond 10 recombine these principles.
 */
export const NUMBER_MEANINGS = {
  1: 'Monas. The point. Seed, chaos, foundation, axis, Prometheus, Atropos. Neither odd nor even.',
  2: 'Dyas. The line. Audacity (tolma), anguish, opinion, movement, generation, matter.',
  3: 'Trias. The triangle. Beginning, middle, end. Friendship, peace, justice, prudence, piety, harmony.',
  4: 'Tetras. The square. Justice, Heracles, key-bearer of nature. 1+2+3+4=10.',
  5: 'Pentas. The pentagram. Marriage (gamos), Aphrodite. Union of 2 and 3.',
  6: 'Hexas. The hexagon. Perfection of parts. First perfect number: 1+2+3=6=1\u00D72\u00D73. Creation of the world, form of form.',
  7: 'Heptas. The virgin (parthenos), Athena. Motherless, fatherless. Veneration (sebasmos), fortune, occasion (kairos).',
  8: 'Ogdoas. The cube. Love, counsel, prudence, law. Universal harmony. Rhea, Cybele.',
  9: 'Enneas. Ocean (Okeanos), horizon. Concord, Prometheus, Hephaestus. Boundary of the Decad.',
  11: 'Monad + Decad. (Master number designation is modern, Balliett c. 1900.)',
  22: 'Dyas + two Decads. (Master number designation is modern, Balliett c. 1900.)',
  33: 'Trias + three Decads. (Master number designation is modern, Balliett c. 1900.)',
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
