import {
  TRIGRAMS, HEXAGRAMS, trigramId, lookupHexagram,
  nuclearTrigrams, hexagramComplement, hexagramInverse,
  fuxiNumber, kingWenPair, trigramComplement,
} from './ichingData';

/* ── Data Integrity: TRIGRAMS ─────────────────────────────────── */

describe('TRIGRAMS data integrity', () => {
  test('exactly 8 trigrams', () => {
    expect(TRIGRAMS).toHaveLength(8);
  });

  test('each trigram has required fields', () => {
    const requiredKeys = ['id', 'name', 'ch', 'symbol', 'attr', 'lines', 'family', 'direction', 'season', 'bodyPart', 'animal', 'quality'];
    TRIGRAMS.forEach(t => {
      requiredKeys.forEach(k => {
        expect(t).toHaveProperty(k);
      });
      expect(t.lines).toHaveLength(3);
      t.lines.forEach(l => expect([0, 1]).toContain(l));
    });
  });

  test('ids 0-7 match trigramId(lines)', () => {
    TRIGRAMS.forEach(t => {
      expect(t.id).toBe(trigramId(t.lines));
    });
  });
});

/* ── Data Integrity: HEXAGRAMS ────────────────────────────────── */

describe('HEXAGRAMS data integrity', () => {
  test('exactly 64 hexagrams', () => {
    expect(HEXAGRAMS).toHaveLength(64);
  });

  test('King Wen numbers 1-64 are unique', () => {
    const nums = HEXAGRAMS.map(h => h.n);
    expect(new Set(nums).size).toBe(64);
    expect(Math.min(...nums)).toBe(1);
    expect(Math.max(...nums)).toBe(64);
  });

  test('each hexagram has valid lo/up trigram names', () => {
    const trigramNames = new Set(TRIGRAMS.map(t => t.name));
    HEXAGRAMS.forEach(h => {
      expect(trigramNames).toContain(h.lo);
      expect(trigramNames).toContain(h.up);
    });
  });

  test('each hexagram has valid 6-line array of 0s and 1s', () => {
    HEXAGRAMS.forEach(h => {
      expect(h.lines).toHaveLength(6);
      h.lines.forEach(l => expect([0, 1]).toContain(l));
    });
  });

  test('each hexagram has judgment and image texts', () => {
    HEXAGRAMS.forEach(h => {
      expect(typeof h.judgment).toBe('string');
      expect(h.judgment.length).toBeGreaterThan(0);
      expect(typeof h.image).toBe('string');
      expect(h.image.length).toBeGreaterThan(0);
    });
  });

  test('lookupHexagram returns correct hexagram for every entry', () => {
    HEXAGRAMS.forEach(h => {
      expect(lookupHexagram(h.lines)).toBe(h);
    });
  });

  test('all 64 line patterns are unique', () => {
    const patterns = HEXAGRAMS.map(h => h.lines.join(''));
    expect(new Set(patterns).size).toBe(64);
  });
});

/* ── trigramId ────────────────────────────────────────────────── */

describe('trigramId', () => {
  test('known inputs', () => {
    expect(trigramId([0, 0, 0])).toBe(0); // Earth
    expect(trigramId([1, 1, 1])).toBe(7); // Heaven
    expect(trigramId([0, 1, 0])).toBe(2); // Water
    expect(trigramId([1, 0, 1])).toBe(5); // Fire
    expect(trigramId([1, 0, 0])).toBe(4); // Thunder
    expect(trigramId([0, 1, 1])).toBe(3); // Wind
  });
});

/* ── nuclearTrigrams ──────────────────────────────────────────── */

describe('nuclearTrigrams', () => {
  test('Hex 1 Creative (all yang): nuclear trigrams are both Heaven, nuclear hex is Creative', () => {
    const result = nuclearTrigrams([1, 1, 1, 1, 1, 1]);
    expect(result.lower.name).toBe('Heaven');
    expect(result.upper.name).toBe('Heaven');
    expect(result.hexagram.n).toBe(1);
  });

  test('Hex 2 Receptive (all yin): nuclear trigrams are both Earth, nuclear hex is Receptive', () => {
    const result = nuclearTrigrams([0, 0, 0, 0, 0, 0]);
    expect(result.lower.name).toBe('Earth');
    expect(result.upper.name).toBe('Earth');
    expect(result.hexagram.n).toBe(2);
  });

  test('Hex 3 Difficulty (Thunder/Water [1,0,0,0,1,0]): nuclear lower=Earth, upper=Mountain', () => {
    // lines[1..3] = [0,0,0] = Earth; lines[2..4] = [0,0,1] = Mountain
    const result = nuclearTrigrams([1, 0, 0, 0, 1, 0]);
    expect(result.lower.name).toBe('Earth');
    expect(result.upper.name).toBe('Mountain');
    expect(result.hexagram).not.toBeNull();
  });

  test('no null nuclear hexagram for any of the 64', () => {
    HEXAGRAMS.forEach(h => {
      const result = nuclearTrigrams(h.lines);
      expect(result.lower).toBeDefined();
      expect(result.upper).toBeDefined();
      expect(result.hexagram).not.toBeNull();
    });
  });
});

/* ── hexagramComplement ───────────────────────────────────────── */

describe('hexagramComplement', () => {
  test('#1 Creative ↔ #2 Receptive', () => {
    const hex1 = HEXAGRAMS.find(h => h.n === 1);
    const hex2 = HEXAGRAMS.find(h => h.n === 2);
    expect(hexagramComplement(hex1.lines).n).toBe(2);
    expect(hexagramComplement(hex2.lines).n).toBe(1);
  });

  test('involutory for all 64: complement of complement = self', () => {
    HEXAGRAMS.forEach(h => {
      const comp = hexagramComplement(h.lines);
      const compComp = hexagramComplement(comp.lines);
      expect(compComp.n).toBe(h.n);
    });
  });
});

/* ── hexagramInverse ──────────────────────────────────────────── */

describe('hexagramInverse', () => {
  test('known pair: #3 ↔ #4', () => {
    const hex3 = HEXAGRAMS.find(h => h.n === 3);
    const hex4 = HEXAGRAMS.find(h => h.n === 4);
    expect(hexagramInverse(hex3.lines).n).toBe(4);
    expect(hexagramInverse(hex4.lines).n).toBe(3);
  });

  test('exactly 8 self-inverse hexagrams', () => {
    const selfInverse = HEXAGRAMS.filter(h =>
      hexagramInverse(h.lines).n === h.n
    );
    expect(selfInverse).toHaveLength(8);
  });

  test('involutory for all 64: inverse of inverse = self', () => {
    HEXAGRAMS.forEach(h => {
      const inv = hexagramInverse(h.lines);
      const invInv = hexagramInverse(inv.lines);
      expect(invInv.n).toBe(h.n);
    });
  });
});

/* ── fuxiNumber ───────────────────────────────────────────────── */

describe('fuxiNumber', () => {
  test('#1 Creative (all yang) = 63', () => {
    expect(fuxiNumber([1, 1, 1, 1, 1, 1]).decimal).toBe(63);
    expect(fuxiNumber([1, 1, 1, 1, 1, 1]).binary).toBe('111111');
  });

  test('#2 Receptive (all yin) = 0', () => {
    expect(fuxiNumber([0, 0, 0, 0, 0, 0]).decimal).toBe(0);
    expect(fuxiNumber([0, 0, 0, 0, 0, 0]).binary).toBe('000000');
  });

  test('all 64 produce unique decimals in range 0-63', () => {
    const decimals = HEXAGRAMS.map(h => fuxiNumber(h.lines).decimal);
    expect(new Set(decimals).size).toBe(64);
    decimals.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(63);
    });
  });
});

/* ── kingWenPair ──────────────────────────────────────────────── */

describe('kingWenPair', () => {
  test('32 pairs total (64 hexagrams / 2)', () => {
    const pairs = new Set();
    HEXAGRAMS.forEach(h => {
      const partner = kingWenPair(h);
      const key = [Math.min(h.n, partner.n), Math.max(h.n, partner.n)].join('-');
      pairs.add(key);
    });
    expect(pairs.size).toBe(32);
  });

  test('symmetric: partner\'s partner = self', () => {
    HEXAGRAMS.forEach(h => {
      const partner = kingWenPair(h);
      const partnerPartner = kingWenPair(partner);
      expect(partnerPartner.n).toBe(h.n);
    });
  });

  test('#1 pairs with #2', () => {
    const hex1 = HEXAGRAMS.find(h => h.n === 1);
    expect(kingWenPair(hex1).n).toBe(2);
  });
});

/* ── trigramComplement ────────────────────────────────────────── */

describe('trigramComplement', () => {
  test('Earth ↔ Heaven', () => {
    const earth = TRIGRAMS.find(t => t.name === 'Earth');
    const heaven = TRIGRAMS.find(t => t.name === 'Heaven');
    expect(trigramComplement(earth).name).toBe('Heaven');
    expect(trigramComplement(heaven).name).toBe('Earth');
  });

  test('Water ↔ Fire', () => {
    const water = TRIGRAMS.find(t => t.name === 'Water');
    const fire = TRIGRAMS.find(t => t.name === 'Fire');
    expect(trigramComplement(water).name).toBe('Fire');
    expect(trigramComplement(fire).name).toBe('Water');
  });

  test('involutory for all 8', () => {
    TRIGRAMS.forEach(t => {
      const comp = trigramComplement(t);
      const compComp = trigramComplement(comp);
      expect(compComp.name).toBe(t.name);
    });
  });
});

/* ── Line Texts (Phase 2) ────────────────────────────────────── */

describe('line texts', () => {
  test('every hexagram has lineTexts array of exactly 6 non-empty strings', () => {
    HEXAGRAMS.forEach(h => {
      expect(h.lineTexts).toBeDefined();
      expect(h.lineTexts).toHaveLength(6);
      h.lineTexts.forEach((text, i) => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      });
    });
  });

  test('hexagram 1 and 2 have allLines text', () => {
    const hex1 = HEXAGRAMS.find(h => h.n === 1);
    const hex2 = HEXAGRAMS.find(h => h.n === 2);
    expect(typeof hex1.allLines).toBe('string');
    expect(hex1.allLines.length).toBeGreaterThan(0);
    expect(typeof hex2.allLines).toBe('string');
    expect(hex2.allLines.length).toBeGreaterThan(0);
  });
});
