/**
 * Maps internal item IDs to Stripe Price IDs and payment modes.
 *
 * Price IDs are placeholders — replace with real Stripe Price IDs
 * after creating products in the Stripe Dashboard.
 *
 * mode: 'subscription' = recurring, 'payment' = one-time
 */
const STRIPE_PRODUCTS = {
  // Subscriptions
  'developer-api':  { priceId: process.env.STRIPE_PRICE_DEVELOPER_API  || null, mode: 'subscription' },
  'master-key':     { priceId: process.env.STRIPE_PRICE_MASTER_KEY     || null, mode: 'subscription' },
  'ybr':            { priceId: process.env.STRIPE_PRICE_YBR            || null, mode: 'subscription' },
  'forge':          { priceId: process.env.STRIPE_PRICE_FORGE          || null, mode: 'subscription' },
  'coursework':     { priceId: process.env.STRIPE_PRICE_COURSEWORK     || null, mode: 'subscription' },
  'monomyth':       { priceId: process.env.STRIPE_PRICE_MONOMYTH       || null, mode: 'subscription' },
  // One-time purchases
  'fallen-starlight':  { priceId: process.env.STRIPE_PRICE_FALLEN_STARLIGHT  || null, mode: 'payment' },
  'story-of-stories':  { priceId: process.env.STRIPE_PRICE_STORY_OF_STORIES  || null, mode: 'payment' },
  'medicine-wheel':    { priceId: process.env.STRIPE_PRICE_MEDICINE_WHEEL    || null, mode: 'payment' },
  'starlight-bundle':  { priceId: process.env.STRIPE_PRICE_STARLIGHT_BUNDLE  || null, mode: 'payment' },
};

/**
 * Bundle expansion rules.
 * When a bundle is purchased/subscribed, these additional item flags get activated.
 */
const BUNDLE_EXPANSIONS = {
  'master-key': {
    subscriptions: ['ybr', 'forge', 'coursework', 'monomyth'],
    purchases: ['starlight-bundle', 'fallen-starlight', 'story-of-stories'],
  },
  'starlight-bundle': {
    purchases: ['fallen-starlight', 'story-of-stories'],
  },
};

function getProduct(itemId) {
  return STRIPE_PRODUCTS[itemId] || null;
}

function getBundleExpansion(itemId) {
  return BUNDLE_EXPANSIONS[itemId] || null;
}

module.exports = { STRIPE_PRODUCTS, BUNDLE_EXPANSIONS, getProduct, getBundleExpansion };
