/**
 * Periodic storage estimation for usage tracking.
 * Estimates user storage based on document counts and average sizes.
 * Phase 1: soft enforcement only (display warning, don't block writes).
 */

const admin = require('firebase-admin');

// Average document sizes by collection (bytes)
const AVG_DOC_SIZES = {
  writings: 2000,
  'story-cards': 1500,
  progress: 500,
  'teacher-courses': 3000,
};

// Fixed overhead for profile, secrets, usage docs (bytes)
const FIXED_OVERHEAD_BYTES = 10000;

// Minimum interval between storage re-estimates (24 hours)
const STALE_MS = 24 * 60 * 60 * 1000;

// Re-estimate every N messages
const MESSAGE_INTERVAL = 100;

/**
 * Check whether a storage re-estimate is needed.
 */
function shouldReestimate(usageData, messagesThisMonth) {
  if (!usageData?.storageEstimatedAt) return true;
  const elapsed = Date.now() - (usageData.storageEstimatedAt?.toMillis?.() || 0);
  if (elapsed > STALE_MS) return true;
  if (messagesThisMonth > 0 && messagesThisMonth % MESSAGE_INTERVAL === 0) return true;
  return false;
}

/**
 * Estimate storage for a user by counting documents in key collections.
 * Returns size in MB.
 */
async function estimateStorageMB(uid) {
  const firestore = admin.firestore();
  const counts = {};

  const collections = Object.keys(AVG_DOC_SIZES);
  const promises = collections.map(async (col) => {
    try {
      const snap = await firestore.collection(`users/${uid}/${col}`).count().get();
      counts[col] = snap.data().count || 0;
    } catch {
      counts[col] = 0;
    }
  });

  await Promise.all(promises);

  let totalBytes = FIXED_OVERHEAD_BYTES;
  for (const [col, count] of Object.entries(counts)) {
    totalBytes += count * (AVG_DOC_SIZES[col] || 500);
  }

  return Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
}

/**
 * Update the storage estimate in the usage doc (fire-and-forget).
 */
async function updateStorageEstimate(uid) {
  try {
    const storageMB = await estimateStorageMB(uid);
    const firestore = admin.firestore();
    await firestore.doc(`users/${uid}/meta/usage`).set({
      storageEstimateMB: storageMB,
      storageEstimatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Storage estimate failed:', err?.message);
  }
}

module.exports = { shouldReestimate, estimateStorageMB, updateStorageEstimate };
