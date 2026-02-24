/**
 * POST /api/stripe-checkout
 * Creates a Stripe Checkout Session for a given item.
 * Authenticated via Firebase ID token.
 *
 * Body: { itemId: string }
 * Returns: { url: string }
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getStripe } = require('./_lib/stripe');
const { getProduct, getBundleExpansion } = require('./_lib/stripeProducts');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { itemId } = req.body || {};
  if (!itemId) {
    return res.status(400).json({ error: 'Missing itemId' });
  }

  const product = getProduct(itemId);
  if (!product) {
    return res.status(400).json({ error: `Unknown item: ${itemId}` });
  }
  if (!product.priceId) {
    return res.status(400).json({ error: `Item "${itemId}" is not yet available for purchase` });
  }

  try {
    const stripe = getStripe();

    // Look up or create Stripe Customer linked to this Firebase UID
    const customerId = await getOrCreateCustomer(stripe, uid);

    const sessionParams = {
      customer: customerId,
      line_items: [{ price: product.priceId, quantity: 1 }],
      mode: product.mode,
      success_url: `${getBaseUrl(req)}/profile?checkout=success&item=${itemId}`,
      cancel_url: `${getBaseUrl(req)}/profile#${product.mode === 'subscription' ? 'subscriptions' : 'purchases'}`,
      metadata: { uid, itemId },
    };

    // For one-time purchases, save the payment method for future use
    if (product.mode === 'payment') {
      sessionParams.payment_intent_data = {
        setup_future_usage: 'off_session',
        metadata: { uid, itemId },
      };
    } else {
      // For subscriptions, attach metadata to the subscription
      sessionParams.subscription_data = {
        metadata: { uid, itemId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

/**
 * Look up the Stripe Customer ID stored in Firestore,
 * or create a new Stripe Customer and store the ID.
 */
async function getOrCreateCustomer(stripe, uid) {
  if (!ensureFirebaseAdmin()) throw new Error('Firebase Admin not available');

  const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
  const snap = await profileRef.get();
  const existing = snap.exists ? snap.data().stripeCustomerId : null;

  if (existing) return existing;

  // Get user email from Firebase Auth for the Stripe Customer record
  let email;
  try {
    const userRecord = await admin.auth().getUser(uid);
    email = userRecord.email;
  } catch {
    // email is optional for Stripe Customer
  }

  const customer = await stripe.customers.create({
    metadata: { firebaseUid: uid },
    ...(email ? { email } : {}),
  });

  // Store Stripe Customer ID in Firestore
  await profileRef.set(
    { stripeCustomerId: customer.id, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  return customer.id;
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
