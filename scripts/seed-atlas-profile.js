#!/usr/bin/env node
/**
 * One-off script: Create a fully-activated "Atlas" member profile
 * for themythologychannel@gmail.com
 *
 * Usage: node scripts/seed-atlas-profile.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// ── Init Firebase Admin ──
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw || raw === '{}') {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local');
  process.exit(1);
}
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(raw)),
});
const db = admin.firestore();
const TARGET_EMAIL = 'themythologychannel@gmail.com';
const NOW = Date.now();

// ── Course element constants (mirror courseEngine.js) ──
const ALL_STAGES = ['golden-age', 'falling-star', 'impact-crater', 'forge', 'quenching', 'integration', 'drawing', 'new-age'];
const MONOMYTH_TABS = ['overview', 'cycles', 'theorists', 'history', 'myths', 'films'];
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CARDINAL_POINTS = ['vernal-equinox', 'summer-solstice', 'autumnal-equinox', 'winter-solstice'];
const ANCIENT_GAMES = ['snakes-ladders', 'senet', 'ur', 'mehen', 'jackals-hounds', 'pachisi'];
const MYTHOLOGY_SHOWS = [
  'myths-tv', 'myth-salon', 'mythosophia', 'deep-sight', 'journey-of-the-goddess',
  'transformational-narrative', 'dennis-slattery', 'lionel-corbett', 'myth-is-all-around-us',
  'scholar-talks', 'mastery-circle', 'mythology-classroom', 'the-tao', 'pulling-focus', 'climate-journey',
];

async function main() {
  // ── Step 1: Find user by email ──
  console.log(`Looking up user: ${TARGET_EMAIL}`);

  let uid;
  try {
    const userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
    uid = userRecord.uid;
    console.log(`Found user UID: ${uid}`);
    console.log(`  displayName: ${userRecord.displayName}`);
    console.log(`  provider: ${userRecord.providerData?.[0]?.providerId}`);
  } catch (err) {
    console.error(`Could not find user with email ${TARGET_EMAIL}:`, err.message);
    console.log('\nThis user must first sign in to the site with Google OAuth.');
    process.exit(1);
  }

  // ── Step 2: Write profile document ──
  console.log('\nWriting profile document...');
  const profileRef = db.doc(`users/${uid}/meta/profile`);
  const profileData = {
    handle: 'atlas',
    displayName: 'Atlas',
    photoURL: null,
    onboardingComplete: true,

    // All credentials at highest levels
    credentials: {
      scholar: {
        level: 3,
        details: 'Atlas — mythological guide, keeper of celestial knowledge, professor of all traditions.',
        updatedAt: NOW,
      },
      mediaVoice: {
        level: 2,
        details: 'Atlas — broadcast voice across the Mythouse platform, guide to all mythic media.',
        updatedAt: NOW,
      },
      storyteller: {
        level: 4,
        details: 'Atlas — supreme storyteller, narrator of the monomyth across all cultures and ages.',
        updatedAt: NOW,
      },
      healer: {
        level: 3,
        details: 'Atlas — established practice in mythic depth psychology and transformational guidance.',
        updatedAt: NOW,
      },
      adventurer: {
        level: 3,
        details: 'Atlas — world walker, has visited every sacred site on Mythic Earth.',
        updatedAt: NOW,
      },
    },

    // Natal chart
    natalChart: {
      birthDate: '2024-01-01',
      birthTime: '00:00',
      birthLocation: 'Mount Olympus, Greece',
    },
    numerologyName: 'Atlas',
    luckyNumber: 7,

    // Guild — fully active, published
    guild: {
      type: 'scholar',
      status: 'approved',
      bio: 'I am Atlas, the mythological guide of Mythouse. I hold the celestial sphere and illuminate the paths between ancient wisdom and modern understanding. Ask me anything about mythology, the monomyth, sacred sites, or the journey of transformation.',
      capacity: 20,
      directoryListed: true,
      guildContractAccepted: true,
      guildContractAcceptedAt: NOW,
      appliedAt: NOW - 86400000,
      approvedAt: NOW,
      adminReviewedBy: 'willlinnii@gmail.com',
    },

    // Consulting — fully active with all types
    consulting: {
      consultingTypes: ['character', 'narrative', 'coaching', 'media', 'adventure'],
      specialties: ['Mythology', 'Depth Psychology', 'Storytelling', 'Sacred Sites', 'Transformational Narrative'],
      projects: [
        { name: 'Monomyth Guidance', description: 'Personal journey through the stages of the monomyth', type: 'coaching' },
        { name: 'Mythic Narrative Design', description: 'Story structure consultation using mythic archetypes', type: 'narrative' },
        { name: 'Sacred Site Pilgrimage', description: 'Guided exploration of the world\'s most sacred mythological sites', type: 'adventure' },
      ],
    },

    // All subscriptions activated
    subscriptions: {
      'master-key': true,
      ybr: true,
      forge: true,
      coursework: true,
      xr: true,
    },

    // All purchases activated
    purchases: {
      'fallen-starlight': true,
      'story-of-stories': true,
      'medicine-wheel': true,
      'starlight-bundle': true,
    },

    // Social links
    social: {
      youtube: 'https://youtube.com/@themythologychannel',
    },

    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await profileRef.set(profileData, { merge: true });
  console.log('  Profile written.');

  // ── Step 3: Write site-users entry ──
  console.log('Writing site-users entry...');
  const siteUserRef = db.doc(`site-users/${uid}`);
  await siteUserRef.set({
    email: TARGET_EMAIL,
    displayName: 'Atlas',
    provider: 'google.com',
    tags: ['atlas', 'test-member', 'admin-created'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('  site-users entry written.');

  // ── Step 4: Write progress documents for ALL course completions ──
  console.log('Writing coursework progress...');

  // Helper: generate element entry
  const el = (extra = {}) => ({ visited: true, visitedAt: NOW, count: 1, ...extra });
  const timeEl = (seconds = 30) => ({ visited: true, visitedAt: NOW, count: 1, timeSpent: seconds });

  // Organize elements by section (first dot-segment)
  const sections = {};
  function addElement(elementId, data = {}) {
    const section = elementId.split('.')[0];
    if (!sections[section]) sections[section] = {};
    sections[section][elementId] = el(data);
  }
  function addTimeElement(elementId, seconds = 30) {
    const section = elementId.split('.')[0];
    if (!sections[section]) sections[section] = {};
    sections[section][elementId] = timeEl(seconds);
  }

  // ── Monomyth Explorer: all tabs × all stages + quizzes + journey ──
  for (const tab of MONOMYTH_TABS) {
    for (const stage of ALL_STAGES) {
      addElement(`monomyth.${tab}.${stage}`);
    }
  }
  for (const stage of ALL_STAGES) {
    addElement(`monomyth.test.${stage}`, { passed: true, score: 100 });
  }
  addElement('journeys.monomyth.completed');
  addElement('journeys.fused.completed');

  // ── Mythic Gamer: all games completed + Atlas chat ──
  for (const game of ANCIENT_GAMES) {
    addElement(`games.${game}.started`);
    addElement(`games.${game}.completed`);
  }
  addElement('atlas.messages.games', { count: 15 });

  // ── Starlight Reader: all chapters + time ──
  for (const stage of ALL_STAGES) {
    addElement(`fallen-starlight.chapter.${stage}`);
    addTimeElement(`fallen-starlight.chapter.${stage}.time`, 60);
  }

  // ── Celestial Clocks Explorer: planets + zodiac + cardinals + calendar + wheel ──
  for (const planet of PLANETS) {
    addElement(`chronosphaera.planet.${planet}`);
  }
  for (const sign of ZODIAC_SIGNS) {
    addElement(`chronosphaera.zodiac.${sign}`);
  }
  for (const cp of CARDINAL_POINTS) {
    addElement(`chronosphaera.cardinal.${cp}`);
  }
  addElement('chronosphaera.calendar.opened');
  addElement('chronosphaera.medicine-wheel.opened');

  // ── Mythology Channel Viewer: all shows ──
  for (const show of MYTHOLOGY_SHOWS) {
    addElement(`mythology-channel.show.${show}`);
  }

  // ── Library Pilgrim: trail stops + page visit ──
  for (let i = 0; i < 8; i++) {
    addElement(`library.trail.stop.${i}`);
  }
  addElement('library.page.visited', { count: 3 });

  // ── Story Forger: template + stages + generate ──
  addElement('story-forge.template.personal');
  addElement('story-forge.template.fiction');
  for (const stage of ALL_STAGES) {
    addElement(`story-forge.stage.${stage}`);
  }
  addElement('story-forge.generate.personal');

  // ── Meteor Steel Initiate: all home stages ──
  for (const stage of ALL_STAGES) {
    addElement(`home.stage.${stage}`);
  }

  // ── Ouroboros Walker: all journey types completed ──
  // (monomyth and fused already added above)
  addElement('journeys.meteor-steel.completed');
  addElement('journeys.cosmic.completed');
  addElement('journeys.planetary.completed');
  addElement('journeys.zodiac.completed');

  // ── Atlas Conversationalist: total messages + multiple voices ──
  addElement('atlas.messages.total', { count: 50 });
  addElement('atlas.voice.atlas.message', { count: 15 });
  for (const planet of PLANETS) {
    addElement(`atlas.voice.planet:${planet}.message`, { count: 3 });
  }
  addElement(`atlas.voice.zodiac:Aries.message`, { count: 2 });
  addElement(`atlas.voice.zodiac:Leo.message`, { count: 2 });
  addElement(`atlas.voice.zodiac:Sagittarius.message`, { count: 2 });

  // ── Additional tracking: Mythic Earth page visit ──
  addElement('mythic-earth.page.visited', { count: 10 });

  // Write all section documents
  const batch = db.batch();
  for (const [sectionId, elements] of Object.entries(sections)) {
    const ref = db.doc(`users/${uid}/progress/${sectionId}`);
    batch.set(ref, { elements, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  await batch.commit();
  console.log(`  Wrote ${Object.keys(sections).length} progress sections:`);
  for (const [sec, els] of Object.entries(sections)) {
    console.log(`    ${sec}: ${Object.keys(els).length} elements`);
  }

  // ── Step 5: Write handles collection entry (required for friend search) ──
  console.log('Writing handles collection entry...');
  const handleRef = db.doc('handles/atlas');
  await handleRef.set({
    uid,
    handle: 'Atlas',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Also ensure handleLower is on the profile
  await profileRef.set({ handleLower: 'atlas' }, { merge: true });
  console.log('  handles/atlas written.');

  // ── Step 6: Write pilgrimages document (a few starter sacred sites) ──
  console.log('Writing pilgrimages...');
  const pilgrimagesRef = db.doc(`users/${uid}/meta/pilgrimages`);
  await pilgrimagesRef.set({
    sites: {
      delphi: { siteId: 'delphi', name: 'Oracle of Delphi', category: 'sacred-site', region: 'Greece', lat: 38.48, lng: 22.50, tradition: null, addedAt: NOW - 86400000 * 5 },
      'great-pyramid': { siteId: 'great-pyramid', name: 'Great Pyramid of Giza', category: 'sacred-site', region: 'Egypt', lat: 29.9792, lng: 31.1342, tradition: null, addedAt: NOW - 86400000 * 4 },
      varanasi: { siteId: 'varanasi', name: 'Varanasi', category: 'sacred-site', region: 'India', lat: 25.3176, lng: 83.0064, tradition: 'Hinduism', addedAt: NOW - 86400000 * 3 },
      'library-of-alexandria': { siteId: 'library-of-alexandria', name: 'Library of Alexandria', category: 'library', region: 'Egypt', lat: 31.2001, lng: 29.9187, tradition: null, addedAt: NOW - 86400000 * 2 },
      'temple-of-artemis': { siteId: 'temple-of-artemis', name: 'Temple of Artemis', category: 'temple', region: 'Turkey', lat: 37.9497, lng: 27.3638, tradition: null, addedAt: NOW - 86400000 },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('  5 pilgrimages written.');

  // ── Step 7: Write guild directory entry ──
  console.log('Writing guild directory entry...');
  const dirRef = db.doc(`guild-directory/${uid}`);
  await dirRef.set({
    uid,
    handle: 'atlas',
    displayName: 'Atlas',
    guildType: 'scholar',
    guildTitle: 'Mythologist',
    guildIcon: null,
    credentialLevel: 3,
    credentialName: 'Full Professor',
    bio: profileData.guild.bio,
    capacity: 20,
    activeStudents: 0,
    availableSlots: 20,
    active: true,
    consultingAvailable: true,
    consultingTypes: ['character', 'narrative', 'coaching', 'media', 'adventure'],
    consultingProjectCount: 3,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('  Mentor directory entry written.');

  // ── Done ──
  console.log('\n========================================');
  console.log('Atlas profile fully activated!');
  console.log('========================================');
  console.log(`  UID:           ${uid}`);
  console.log(`  Email:         ${TARGET_EMAIL}`);
  console.log(`  Handle:        atlas`);
  console.log(`  Credentials:   Scholar 3, Media 2, Storyteller 4, Healer 3, Adventurer 3`);
  console.log(`  Courses:       All 10 completed (Keeper of the Keys rank)`);
  console.log(`  Subscriptions: Master Key (all included)`);
  console.log(`  Purchases:     Starlight Bundle + Medicine Wheel`);
  console.log(`  Mentor:        Active, published to directory`);
  console.log(`  Consulting:    Active (5 types, 3 projects)`);
  console.log(`  Pilgrimages:   5 sacred sites saved`);
  console.log('========================================');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
