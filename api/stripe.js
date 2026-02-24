/**
 * /api/stripe — Consolidated Stripe session endpoints
 *
 * Routes by ?route= query parameter:
 *   checkout  — POST: create checkout session
 *   portal    — POST: create billing portal session
 *
 * (stripe-webhook.js remains a separate endpoint)
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getStripe } = require('./_lib/stripe');
const { getProduct, getBundleExpansion } = require('./_lib/stripeProducts');

// ─── Checkout ───

async function handleCheckout(req, res) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { itemId, donationAmount } = req.body || {};
  if (!itemId) {
    return res.status(400).json({ error: 'Missing itemId' });
  }

  const product = getProduct(itemId);
  if (!product) {
    return res.status(400).json({ error: `Unknown item: ${itemId}` });
  }

  // Free items: activate directly in Firestore, no Stripe needed
  if (product.free) {
    return handleFreeActivation(uid, itemId, product, res);
  }

  // Donation items: validate the user-provided amount
  let amount = product.amount;
  if (product.donation) {
    amount = Math.round(Number(donationAmount) || 0);
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum donation is $1.00' });
    }
  }

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(stripe, uid);

    // Build price_data inline — no pre-created Stripe products needed
    const priceData = {
      currency: 'usd',
      unit_amount: amount,
      product_data: { name: product.name },
    };
    if (product.mode === 'subscription') {
      priceData.recurring = { interval: product.interval || 'month' };
    }

    const sessionParams = {
      customer: customerId,
      line_items: [{ price_data: priceData, quantity: 1 }],
      mode: product.mode,
      success_url: `${getBaseUrl(req)}/profile?checkout=success&item=${itemId}`,
      cancel_url: `${getBaseUrl(req)}/profile#${product.mode === 'subscription' ? 'subscriptions' : 'purchases'}`,
      metadata: { uid, itemId },
    };

    if (product.mode === 'payment') {
      sessionParams.payment_intent_data = {
        setup_future_usage: 'off_session',
        metadata: { uid, itemId },
      };
    } else {
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
}

/**
 * Activate a free item directly in Firestore (no Stripe payment).
 */
async function handleFreeActivation(uid, itemId, product, res) {
  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    if (product.mode === 'subscription') {
      updates[`subscriptions.${itemId}`] = true;
    } else {
      updates[`purchases.${itemId}`] = true;
    }

    // Expand bundles if applicable
    const expansion = getBundleExpansion(itemId);
    if (expansion) {
      if (expansion.subscriptions) {
        expansion.subscriptions.forEach(id => { updates[`subscriptions.${id}`] = true; });
      }
      if (expansion.purchases) {
        expansion.purchases.forEach(id => { updates[`purchases.${id}`] = true; });
      }
    }

    await profileRef.set(updates, { merge: true });
    // Return a flag so the client knows to refresh instead of redirecting
    return res.status(200).json({ activated: true });
  } catch (err) {
    console.error('Free activation error:', err);
    return res.status(500).json({ error: 'Failed to activate' });
  }
}

async function getOrCreateCustomer(stripe, uid) {
  if (!ensureFirebaseAdmin()) throw new Error('Firebase Admin not available');

  const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
  const snap = await profileRef.get();
  const existing = snap.exists ? snap.data().stripeCustomerId : null;

  if (existing) return existing;

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

// ─── Portal ───

async function handlePortal(req, res) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
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
}

// ─── Router ───

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const route = req.query.route;

  switch (route) {
    case 'checkout':
      return handleCheckout(req, res);
    case 'portal':
      return handlePortal(req, res);
    default:
      return res.status(400).json({ error: 'Missing or invalid route parameter' });
  }
};
