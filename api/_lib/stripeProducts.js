/**
 * Product catalog with inline pricing.
 * No Stripe Dashboard product creation needed — prices are passed as
 * price_data to Checkout Sessions, and Stripe auto-creates products.
 *
 * mode: 'subscription' = recurring, 'payment' = one-time
 * amount: price in cents (USD)
 * interval: billing interval for subscriptions ('month')
 * free: true = skip Stripe, activate directly
 * donation: true = user chooses amount (minimum 100 cents / $1)
 */
const STRIPE_PRODUCTS = {
  // Subscriptions
  'developer-api': {
    mode: 'subscription',
    name: 'Secret Weapon API',
    amount: 0,
    free: true,
  },
  'master-key': {
    mode: 'subscription',
    name: 'Mythouse Master Key',
    amount: 10000,
    interval: 'month',
  },
  'ybr': {
    mode: 'subscription',
    name: 'Yellow Brick Road',
    amount: 500,
    interval: 'month',
  },
  'forge': {
    mode: 'subscription',
    name: 'Story Forge',
    amount: 4500,
    interval: 'month',
  },
  'coursework': {
    mode: 'subscription',
    name: 'Coursework',
    amount: 4500,
    interval: 'month',
  },
  'monomyth': {
    mode: 'subscription',
    name: 'Monomyth & Meteor Steel',
    amount: 2500,
    interval: 'month',
  },
  // One-time purchases
  'fallen-starlight': {
    mode: 'payment',
    name: 'Fallen Starlight',
    amount: 2500,
  },
  'story-of-stories': {
    mode: 'payment',
    name: 'Story of Stories',
    amount: 2500,
  },
  'medicine-wheel': {
    mode: 'payment',
    name: 'Medicine Wheel',
    amount: 0,
    donation: true,
  },
  'starlight-bundle': {
    mode: 'payment',
    name: 'Starlight Bundle',
    amount: 4000,
  },
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
