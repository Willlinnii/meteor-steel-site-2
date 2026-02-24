/**
 * Shared Stripe SDK singleton.
 * Lazy-initializes with STRIPE_SECRET_KEY env var.
 */
let stripeInstance = null;

function getStripe() {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  const Stripe = require('stripe');
  stripeInstance = new Stripe(key);
  return stripeInstance;
}

module.exports = { getStripe };
