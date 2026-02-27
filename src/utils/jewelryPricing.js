/**
 * Jewelry pricing tables and computation.
 * Single source of truth — all values in USD.
 */

export const METAL_PRICE_PER_GRAM = {
  gold:         65.00,
  silver:        1.00,
  meteorSteel:   80.00,
  bronze:        0.50,
  copper:        0.30,
  tin:           0.25,
  lead:          0.10,
};

export const GEM_SET_COST = 850; // 7 classical planet stones, fixed across all forms

export const FORM_CONFIG = {
  ring:     { label: 'Ring',     metalGrams: 10,  craftsmanship: 200,  leatherBase: 0 },
  bracelet: { label: 'Bracelet', metalGrams: 30,  craftsmanship: 350,  leatherBase: 0 },
  armband:  { label: 'Arm Band', metalGrams: 60,  craftsmanship: 450,  leatherBase: 0 },
  belt:     { label: 'Belt',     metalGrams: 20,  craftsmanship: 500,  leatherBase: 150, fullMetalGrams: 120 },
  crown:    { label: 'Crown',    metalGrams: 80,  craftsmanship: 750,  leatherBase: 0 },
};

/**
 * Compute the price for a given form + metal combination.
 * @param {string} form   — key from FORM_CONFIG (e.g. 'ring')
 * @param {string} metal  — key from METAL_PRICE_PER_GRAM (e.g. 'gold')
 * @param {boolean} fullMetal — belt only: use full-metal weight instead of leather
 * @returns {number} price in USD
 */
export function computePrice(form, metal, fullMetal = false) {
  const fc = FORM_CONFIG[form];
  const rate = METAL_PRICE_PER_GRAM[metal];
  if (!fc || rate == null) return null;

  const grams = (form === 'belt' && fullMetal) ? fc.fullMetalGrams : fc.metalGrams;
  const leather = (form === 'belt' && !fullMetal) ? fc.leatherBase : 0;

  return grams * rate + GEM_SET_COST + fc.craftsmanship + leather;
}

/**
 * Build the full price matrix (all forms × all metals).
 * Same shape as the old /api/jewelry-pricing response.
 */
export function buildPriceMatrix() {
  const metals = Object.keys(METAL_PRICE_PER_GRAM);
  const forms = Object.keys(FORM_CONFIG);
  const prices = {};

  for (const f of forms) {
    prices[f] = {};
    for (const m of metals) {
      prices[f][m] = computePrice(f, m);
    }
  }

  return {
    metals: METAL_PRICE_PER_GRAM,
    forms: FORM_CONFIG,
    gemSetCost: GEM_SET_COST,
    prices,
  };
}
