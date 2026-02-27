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
  'teaching': {
    mode: 'subscription',
    name: 'Teaching',
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
  // Consulting
  'consulting-single': {
    mode: 'payment',
    name: 'Consulting: Single Session',
    amount: 15000,
  },
  'consulting-4pack': {
    mode: 'payment',
    name: 'Consulting: 4-Session Pack',
    amount: 50000,
  },
  'consulting-8pack': {
    mode: 'payment',
    name: 'Consulting: Full Journey (8 Sessions)',
    amount: 90000,
  },
  'consulting-certification': {
    mode: 'payment',
    name: 'Practitioner Certification',
    amount: 250000,
  },
  // Retreats
  'retreat-day': {
    mode: 'payment',
    name: 'Mentone Day Retreat',
    amount: 50000,
  },
  'retreat-weekend': {
    mode: 'payment',
    name: 'Mentone Weekend Retreat',
    amount: 150000,
  },
  'retreat-week': {
    mode: 'payment',
    name: 'Mentone Week-Long Residency',
    amount: 500000,
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
