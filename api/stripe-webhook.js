/**
 * POST /api/stripe-webhook
 * Handles Stripe webhook events. This is the ONLY writer of subscription/purchase
 * flags in Firestore — the client never writes these directly.
 *
 * Events handled:
 * - checkout.session.completed — activate item after successful payment
 * - customer.subscription.updated — handle subscription status changes
 * - customer.subscription.deleted — deactivate subscription
 * - invoice.payment_failed — (logged, could add email notification later)
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin } = require('./_lib/auth');
const { getStripe } = require('./_lib/stripe');
const { getProduct, getBundleExpansion } = require('./_lib/stripeProducts');

// Vercel doesn't parse the body when we export a config with no bodyParser
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    // req.body is a Buffer when bodyParser is disabled on Vercel
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (!ensureFirebaseAdmin()) {
    console.error('Firebase Admin not available for webhook processing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        console.warn('Payment failed for invoice:', event.data.object.id);
        break;
      default:
        // Unhandled event type — no-op
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Disable Vercel body parser so we get the raw body for signature verification
module.exports.config = {
  api: { bodyParser: false },
};

/**
 * checkout.session.completed
 * Fired when a customer completes checkout (both subscriptions and one-time payments).
 */
async function handleCheckoutCompleted(session, stripe) {
  const uid = session.metadata?.uid;
  const itemId = session.metadata?.itemId;
  if (!uid || !itemId) {
    console.warn('Checkout session missing uid or itemId metadata:', session.id);
    return;
  }

  const product = getProduct(itemId);
  if (!product) {
    console.warn('Unknown itemId in checkout session:', itemId);
    return;
  }

  const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
  const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

  // Campaign attribution from UTM params
  const campaign = session.metadata?.utm_campaign || null;
  const content = session.metadata?.utm_content || null;

  if (product.mode === 'subscription') {
    // Activate the subscription flag
    updates[`subscriptions.${itemId}`] = true;

    // Store Stripe subscription ID for future webhook mapping (keep as string for resolveSubscription compat)
    if (session.subscription) {
      updates[`stripeSubscriptions.${itemId}`] = session.subscription;
    }

    // Store campaign attribution if present
    if (campaign || content) {
      const attr = { subscribedAt: admin.firestore.FieldValue.serverTimestamp() };
      if (campaign) attr.campaign = campaign;
      if (content) attr.content = content;
      updates[`subscriptionAttribution.${itemId}`] = attr;
    }

    // Expand bundles
    const expansion = getBundleExpansion(itemId);
    if (expansion) {
      if (expansion.subscriptions) {
        expansion.subscriptions.forEach(id => { updates[`subscriptions.${id}`] = true; });
      }
      if (expansion.purchases) {
        expansion.purchases.forEach(id => { updates[`purchases.${id}`] = true; });
      }
    }
  } else {
    // One-time purchase — activate the purchase flag
    updates[`purchases.${itemId}`] = true;

    // Store payment intent ID for audit trail + campaign attribution
    if (session.payment_intent) {
      const purchaseRecord = {
        paymentIntentId: session.payment_intent,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (campaign) purchaseRecord.campaign = campaign;
      if (content) purchaseRecord.content = content;
      updates[`stripePurchases.${itemId}`] = purchaseRecord;
    }

    // Expand bundles
    const expansion = getBundleExpansion(itemId);
    if (expansion) {
      if (expansion.purchases) {
        expansion.purchases.forEach(id => { updates[`purchases.${id}`] = true; });
      }
    }
  }

  await profileRef.set(updates, { merge: true });
  console.log(`Activated ${itemId} for user ${uid}`);
}

/**
 * customer.subscription.updated
 * Fired when a subscription changes status (e.g. active → past_due → canceled).
 */
async function handleSubscriptionUpdated(subscription) {
  const uid = subscription.metadata?.uid;
  const itemId = subscription.metadata?.itemId;
  if (!uid || !itemId) {
    // Try to look up by customer ID
    const resolved = await resolveSubscription(subscription);
    if (resolved) return handleSubscriptionStatusChange(resolved.uid, resolved.itemId, subscription.status);
    console.warn('Subscription updated but missing metadata:', subscription.id);
    return;
  }

  await handleSubscriptionStatusChange(uid, itemId, subscription.status);
}

/**
 * customer.subscription.deleted
 * Fired when a subscription is canceled/expired.
 */
async function handleSubscriptionDeleted(subscription) {
  const uid = subscription.metadata?.uid;
  const itemId = subscription.metadata?.itemId;
  if (!uid || !itemId) {
    const resolved = await resolveSubscription(subscription);
    if (resolved) return deactivateSubscription(resolved.uid, resolved.itemId);
    console.warn('Subscription deleted but missing metadata:', subscription.id);
    return;
  }

  await deactivateSubscription(uid, itemId);
}

/**
 * Update Firestore flags based on subscription status.
 */
async function handleSubscriptionStatusChange(uid, itemId, status) {
  const isActive = status === 'active' || status === 'trialing';

  if (isActive) {
    // Already handled by checkout.session.completed, but ensure flags are correct
    const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
    const updates = {
      [`subscriptions.${itemId}`]: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

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
  } else if (status === 'canceled' || status === 'unpaid') {
    await deactivateSubscription(uid, itemId);
  }
  // past_due: keep active for now, let invoice.payment_failed handle notifications
}

/**
 * Deactivate a subscription and its bundle expansions.
 * Preserves purchase flags if the user has a direct purchase record
 * (e.g. they bought Fallen Starlight separately before subscribing to Master Key).
 */
async function deactivateSubscription(uid, itemId) {
  const profileRef = admin.firestore().doc(`users/${uid}/meta/profile`);
  const updates = {
    [`subscriptions.${itemId}`]: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const expansion = getBundleExpansion(itemId);
  if (expansion) {
    if (expansion.subscriptions) {
      expansion.subscriptions.forEach(id => { updates[`subscriptions.${id}`] = false; });
    }
    if (expansion.purchases) {
      // Read profile to check for direct purchase records before revoking
      const snap = await profileRef.get();
      const stripePurchases = snap.exists ? (snap.data().stripePurchases || {}) : {};
      expansion.purchases.forEach(id => {
        // Only revoke if no separate direct purchase exists
        if (!stripePurchases[id]) {
          updates[`purchases.${id}`] = false;
        }
      });
    }
  }

  await profileRef.set(updates, { merge: true });
  console.log(`Deactivated subscription ${itemId} for user ${uid}`);
}

/**
 * Attempt to resolve a subscription's uid/itemId by looking up the customer
 * in Firestore via stripeCustomerId, then matching the subscription ID.
 */
async function resolveSubscription(subscription) {
  const customerId = subscription.customer;
  if (!customerId) return null;

  // Search for the user with this stripeCustomerId
  const usersSnap = await admin.firestore()
    .collectionGroup('meta')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnap.empty) return null;

  const docSnap = usersSnap.docs[0];
  const data = docSnap.data();
  const uid = docSnap.ref.parent.parent.id;

  // Find which itemId this subscription belongs to
  const stripeSubscriptions = data.stripeSubscriptions || {};
  for (const [itemId, subId] of Object.entries(stripeSubscriptions)) {
    if (subId === subscription.id) {
      return { uid, itemId };
    }
  }

  return null;
}
