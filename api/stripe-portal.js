/**
 * POST /api/stripe-portal
 * Creates a Stripe Customer Portal session for managing billing.
 * Authenticated via Firebase ID token.
 *
 * Returns: { url: string }
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getStripe } = require('./_lib/stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Look up the Stripe Customer ID from Firestore
    const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
    const snap = await profileRef.get();
    const stripeCustomerId = snap.exists ? snap.data().stripeCustomerId : null;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Make a purchase first.' });
    }

    const stripe = getStripe();
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const returnUrl = `${proto}://${host}/profile`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
};
