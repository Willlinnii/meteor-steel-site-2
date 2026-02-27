import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { buildPriceMatrix } from '../../utils/jewelryPricing';

// Client-side catalog — mirrors api/_lib/stripeProducts.js
const CATALOG = [
  // Subscriptions
  { id: 'master-key', name: 'Mythouse Master Key', mode: 'sub', cents: 10000, label: '$100/mo', description: 'Full access to everything: all subscriptions, all books, all tools.', group: 'subscriptions', bundle: true },
  { id: 'ybr', name: 'Yellow Brick Road', mode: 'sub', cents: 500, label: '$5/mo', description: 'Guided cosmic journey through 26 mythic stops.', group: 'subscriptions' },
  { id: 'forge', name: 'Story Forge', mode: 'sub', cents: 4500, label: '$45/mo', description: 'Personal story development tools with AI-guided narrative craft.', group: 'subscriptions' },
  { id: 'coursework', name: 'Coursework', mode: 'sub', cents: 4500, label: '$45/mo', description: 'Structured courses in mythology, narrative, and archetypal psychology.', group: 'subscriptions' },
  { id: 'monomyth', name: 'Monomyth & Meteor Steel', mode: 'sub', cents: 2500, label: '$25/mo', description: 'The hero\'s journey mapped across cultures, theorists, and natural cycles.', group: 'subscriptions' },
  { id: 'developer-api', name: 'Secret Weapon API', mode: 'sub', cents: 0, label: 'Free', description: 'Developer access to the Mythouse mythology coordinate system.', group: 'subscriptions', free: true },
  // Books
  { id: 'starlight-bundle', name: 'Starlight Bundle', mode: 'purchase', cents: 4000, label: '$40', description: 'Both books together: Fallen Starlight + Story of Stories.', group: 'books', bundle: true },
  { id: 'fallen-starlight', name: 'Fallen Starlight', mode: 'purchase', cents: 2500, label: '$25', description: 'An original mythic narrative — the story of a star that falls to earth.', group: 'books' },
  { id: 'story-of-stories', name: 'Story of Stories', mode: 'purchase', cents: 2500, label: '$25', description: 'The companion theory book — how story structures echo natural cycles.', group: 'books' },
  // Donations
  { id: 'medicine-wheel', name: 'Medicine Wheel', mode: 'purchase', cents: 0, label: 'Donation', description: 'Support sacred site stewardship and indigenous knowledge preservation.', group: 'donations', donation: true },
];

const DICE_PRODUCTS = [
  { key: 'd12', faces: 12,
    ore: { label: 'Obsidian D12', material: 'Ore', price: '$195', cents: 19500, iconKey: 'obsidian-d12',
      description: 'Hand-cut obsidian d12 — volcanic glass with the night sky carved in.' },
    std: { label: 'Cosmic D12', material: 'Cosmic', price: '$5', cents: 500, iconKey: 'cosmic-d12',
      description: 'The cosmos mapped onto a dodecahedron. Twelve faces, twelve constellations.' } },
  { key: 'set', bundle: true,
    ore: { label: 'Platonic Set', material: 'Ore', price: '$275', cents: 27500, iconKey: 'platonic-set',
      description: 'All five Platonic solids in mineral stone. The complete geometry of the cosmos.' },
    std: { label: 'Platonic Set', material: 'Cosmic', price: '$25', cents: 2500, iconKey: 'platonic-set',
      description: 'All five Platonic solids. The complete geometry of the cosmos in your hand.' } },
  { key: 'd6', faces: 6, label: 'Galena D6', price: '$35', cents: 3500, iconKey: 'galena-d6',
    description: 'Lead ore cube — Saturn\'s mineral carved into the six-faced solid of Earth.' },
  { key: 'd20', faces: 20, label: 'Malachite D20', price: '$65', cents: 6500, iconKey: 'malachite-d20',
    description: 'Green copper carbonate icosahedron — Venus\'s stone shaped into the solid of Water.' },
  { key: 'd4', faces: 4, label: 'Quartz D4', price: '$40', cents: 4000, iconKey: 'quartz-d4',
    description: 'Clear quartz tetrahedron — the simplest solid, the element of Fire, cut from crystal.' },
  { key: 'd8', faces: 8, label: 'Cinnabar D8', price: '$55', cents: 5500, iconKey: 'cinnabar-d8',
    description: 'Mercury\'s ore octahedron — the red mineral of quicksilver shaped into the solid of Air.' },
  { key: 'd12-magnetite', faces: 12, label: 'Magnetite D12', price: '$80', cents: 8000, iconKey: 'magnetite-d12',
    description: 'Magnetic iron ore dodecahedron — twelve faces for twelve constellations, the solid of the Cosmos.' },
];

const JEWELRY_FORMS = [
  { key: 'ring',     label: 'Ring',     description: 'Seven planetary gemstones set to a moment in the cosmos. The oldest personal talisman — your birth chart on a finger.' },
  { key: 'bracelet', label: 'Bracelet', description: 'The planets orbit the wrist at the pulse point where blood meets cosmos. Geocentric stones circling you.' },
  { key: 'armband',  label: 'Arm Band', description: 'A wide celestial band with stones set flush against skin. The warrior\'s adornment — mythic armor in metal and gemstone.' },
  { key: 'belt',     label: 'Belt',     description: 'The ecliptic worn at the waist. Leather and metal connecting heaven to earth at the body\'s center of gravity.' },
  { key: 'crown',    label: 'Crown',    description: 'All seven classical planets in a headpiece band. The oldest symbol of cosmic authority, from Mesopotamia to the alchemical kings.' },
];

const METAL_LABELS = {
  gold: 'Gold', silver: 'Silver', meteorSteel: 'Meteor Steel',
  bronze: 'Bronze', copper: 'Copper', tin: 'Tin', lead: 'Lead',
};

const GROUPS = [
  { id: 'subscriptions', title: 'Subscriptions', subtitle: 'Ongoing access to tools, courses, and journeys' },
  { id: 'books', title: 'Books', subtitle: 'Original works on mythology and narrative' },
  { id: 'adornments', title: 'Adornments', subtitle: 'Celestial jewelry configured to your birth chart' },
  { id: 'dice', title: 'Dice', subtitle: 'The five Platonic solids carved from mineral stone' },
  { id: 'donations', title: 'Support', subtitle: 'Contribute to cultural preservation' },
];

const UTM_SESSION_KEY = 'mythouse_utm';

const DICE_COLORS = {
  'cosmic-d12':    '#c9a961',  // gold accent
  'obsidian-d12':  '#1a1a22',  // obsidian black
  'galena-d6':     '#5a5a62',  // lead-grey
  'malachite-d20': '#2d8a56',  // malachite green
  'quartz-d4':     '#d4d8e0',  // clear quartz
  'cinnabar-d8':   '#c03020',  // cinnabar red
  'magnetite-d12': '#3a3a42',  // dark iron
  'platonic-set':  '#c9a961',  // gold accent
};

function DiceIcon({ diceKey, size = 48 }) {
  const stroke = DICE_COLORS[diceKey] || '#c9a961';
  const fill = stroke;
  const icons = {
    'cosmic-d12': ( // Dodecahedron — gold constellation lines
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 16 L36 34 L12 34 L8 16 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.15" />
        <circle cx="24" cy="10" r="1.5" fill={stroke} />
        <circle cx="36" cy="18" r="1.5" fill={stroke} />
        <circle cx="32" cy="32" r="1.5" fill={stroke} />
        <circle cx="16" cy="32" r="1.5" fill={stroke} />
        <circle cx="12" cy="18" r="1.5" fill={stroke} />
      </svg>
    ),
    'obsidian-d12': ( // Dodecahedron — dark with star points
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 16 L36 34 L12 34 L8 16 Z" stroke="#4a4a5a" strokeWidth="2" fill={fill} fillOpacity="0.4" />
        <path d="M24 6 L20 20 L8 16 M20 20 L12 34 M20 20 L36 34 M20 20 L40 16" stroke="#4a4a5a" strokeWidth="0.8" opacity="0.35" />
        <circle cx="24" cy="14" r="1" fill="#e8e0ff" opacity="0.8" />
        <circle cx="30" cy="24" r="0.8" fill="#e8e0ff" opacity="0.6" />
        <circle cx="18" cy="28" r="0.8" fill="#e8e0ff" opacity="0.6" />
      </svg>
    ),
    'galena-d6': ( // Cube
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M14 14 L34 14 L34 34 L14 34 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.15" />
        <path d="M14 14 L22 8 L42 8 L34 14" stroke={stroke} strokeWidth="1.5" fill={fill} fillOpacity="0.08" />
        <path d="M34 14 L42 8 L42 28 L34 34" stroke={stroke} strokeWidth="1.5" fill={fill} fillOpacity="0.08" />
      </svg>
    ),
    'malachite-d20': ( // Icosahedron (simplified)
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 4 L40 16 L36 36 L12 36 L8 16 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.15" />
        <path d="M24 4 L8 16 M24 4 L40 16 M8 16 L12 36 M40 16 L36 36 M12 36 L36 36" stroke={stroke} strokeWidth="1" opacity="0.5" />
        <path d="M24 4 L24 44 M8 16 L36 36 M40 16 L12 36" stroke={stroke} strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
    'quartz-d4': ( // Tetrahedron
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 38 L8 38 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.12" />
        <path d="M24 6 L28 22 M8 38 L28 22 M40 38 L28 22" stroke={stroke} strokeWidth="1" opacity="0.4" />
      </svg>
    ),
    'cinnabar-d8': ( // Octahedron
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 24 L24 42 L8 24 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.15" />
        <path d="M8 24 L40 24" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
      </svg>
    ),
    'magnetite-d12': ( // Dodecahedron (simplified pentagon)
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 16 L36 34 L12 34 L8 16 Z" stroke={stroke} strokeWidth="2" fill={fill} fillOpacity="0.15" />
        <path d="M24 6 L20 20 L8 16 M20 20 L12 34 M20 20 L36 34 M20 20 L40 16" stroke={stroke} strokeWidth="0.8" opacity="0.35" />
      </svg>
    ),
    'platonic-set': ( // All five nested
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M24 6 L40 38 L8 38 Z" stroke="#d4d8e0" strokeWidth="1" opacity="0.5" />
        <path d="M24 8 L38 24 L24 40 L10 24 Z" stroke="#c03020" strokeWidth="1" opacity="0.5" />
        <path d="M16 16 L32 16 L32 32 L16 32 Z" stroke="#5a5a62" strokeWidth="1" opacity="0.5" />
        <path d="M24 10 L36 18 L33 34 L15 34 L12 18 Z" stroke="#3a3a42" strokeWidth="1.5" opacity="0.7" />
        <path d="M24 14 L34 20 L30 32 L18 32 L14 20 Z" stroke="#2d8a56" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  };
  return icons[diceKey] || icons['platonic-set'];
}

function JewelryFormIcon({ formKey, size = 48 }) {
  const gold = '#c9a961';
  const gem = '#f0c040';
  const icons = {
    ring: (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <circle cx="24" cy="24" r="14" stroke={gold} strokeWidth="2.5" />
        <circle cx="24" cy="10" r="3" fill={gem} />
      </svg>
    ),
    bracelet: (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <ellipse cx="24" cy="24" rx="16" ry="12" stroke={gold} strokeWidth="2.5" />
        <circle cx="24" cy="12" r="2.5" fill={gem} />
        <circle cx="11" cy="20" r="2" fill={gem} />
        <circle cx="37" cy="20" r="2" fill={gem} />
      </svg>
    ),
    armband: (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <rect x="6" y="14" width="36" height="20" rx="6" stroke={gold} strokeWidth="2.5" />
        <circle cx="16" cy="24" r="2.5" fill={gem} />
        <circle cx="24" cy="24" r="2.5" fill={gem} />
        <circle cx="32" cy="24" r="2.5" fill={gem} />
      </svg>
    ),
    belt: (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <rect x="4" y="18" width="40" height="12" rx="3" stroke={gold} strokeWidth="2.5" />
        <circle cx="14" cy="24" r="2" fill={gem} />
        <circle cx="24" cy="24" r="2.5" fill={gem} />
        <circle cx="34" cy="24" r="2" fill={gem} />
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <path d="M8 32 L12 16 L20 24 L24 12 L28 24 L36 16 L40 32 Z" stroke={gold} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="24" cy="14" r="2.5" fill={gem} />
        <circle cx="14" cy="22" r="2" fill={gem} />
        <circle cx="34" cy="22" r="2" fill={gem} />
      </svg>
    ),
  };
  return icons[formKey] || null;
}

/**
 * Public-facing store page. Works both inside the authenticated app shell
 * (where profile is available via prop) and as a standalone public page
 * (where profile is null).
 */
export default function StorePage({ profile }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const highlightRef = useRef(null);
  const jewelryRef = useRef(null);
  const diceRef = useRef(null);

  const highlight = searchParams.get('highlight');
  const activeFormParam = searchParams.get('form');
  const metalParam = searchParams.get('metal');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmContent = searchParams.get('utm_content');

  // Jewelry pricing — computed client-side, no API call needed
  const pricingData = useMemo(() => buildPriceMatrix(), []);
  const [diceMaterials, setDiceMaterials] = useState({});  // { d12: 'ore', d6: 'std', ... }
  const activeMetal = metalParam || profile?.ringMetal || null;

  const getJewelryPrice = (formKey) => {
    if (!pricingData || !activeMetal) return null;
    return pricingData.prices?.[formKey]?.[activeMetal] ?? null;
  };

  // Store UTM params in sessionStorage for checkout attribution
  useEffect(() => {
    if (utmCampaign || utmContent) {
      const utm = {};
      if (utmCampaign) utm.campaign = utmCampaign;
      if (utmContent) utm.content = utmContent;
      sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm));
    }
  }, [utmCampaign, utmContent]);

  // Scroll to highlighted product or jewelry/dice section
  useEffect(() => {
    if (highlight === 'jewelry' && jewelryRef.current) {
      setTimeout(() => {
        jewelryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else if (highlight === 'dice' && diceRef.current) {
      setTimeout(() => {
        diceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else if (highlight && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlight]);

  const handlePurchase = async (item) => {
    if (!user) {
      // Store return URL and let the login page handle it
      // The app will redirect to login; after login, user lands back on /store
      sessionStorage.setItem('mythouse_return', `/store${window.location.search}`);
      navigate('/');
      return;
    }

    if (!profile) return; // shouldn't happen when logged in, but safety check

    // Read UTM from sessionStorage
    const utmRaw = sessionStorage.getItem(UTM_SESSION_KEY);
    const utm = utmRaw ? JSON.parse(utmRaw) : {};

    const options = {};
    if (utm.campaign) options.campaign = utm.campaign;
    if (utm.content) options.content = utm.content;

    if (item.donation) {
      const amount = prompt('Enter donation amount in dollars (minimum $1):');
      if (!amount) return;
      const cents = Math.round(Number(amount) * 100);
      if (cents < 100) { alert('Minimum donation is $1.00'); return; }
      options.donationAmount = cents;
    }

    try {
      await profile.initiateCheckout(item.id, options);
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Determine which items the user already has
  const owned = useMemo(() => {
    if (!profile) return new Set();
    const set = new Set();
    CATALOG.forEach(item => {
      if (item.mode === 'sub' && profile.hasSubscription(item.id)) set.add(item.id);
      if (item.mode === 'purchase' && profile.hasPurchase(item.id)) set.add(item.id);
    });
    return set;
  }, [profile]);

  const S = {
    page: { minHeight: '100vh', padding: '60px 20px 80px', maxWidth: 800, margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: 48 },
    title: { fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: 'var(--accent-gold, #c9a961)', margin: '0 0 8px', letterSpacing: '0.06em' },
    subtitle: { color: 'var(--text-secondary, #8a8a9a)', fontSize: '0.92rem', margin: 0 },
    groupTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: 'var(--accent-gold, #c9a961)', margin: '0 0 4px', letterSpacing: '0.04em' },
    groupSubtitle: { color: 'var(--text-secondary, #8a8a9a)', fontSize: '0.8rem', margin: '0 0 16px' },
    group: { marginBottom: 40 },
    card: { padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', borderRadius: 12, marginBottom: 12, transition: 'border-color 0.3s, box-shadow 0.3s' },
    cardHighlight: { borderColor: 'rgba(201,169,97,0.5)', boxShadow: '0 0 20px rgba(201,169,97,0.15)' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
    cardName: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #e8e8f0)', margin: '0 0 4px' },
    cardDesc: { fontSize: '0.82rem', color: 'var(--text-secondary, #8a8a9a)', margin: '0 0 12px', lineHeight: 1.5 },
    cardRight: { textAlign: 'right', flexShrink: 0 },
    price: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold, #c9a961)', marginBottom: 8 },
    btn: { padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: '1px solid rgba(201,169,97,0.4)', background: 'rgba(201,169,97,0.12)', color: 'var(--accent-gold, #c9a961)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
    btnOwned: { background: 'rgba(110,200,122,0.1)', borderColor: 'rgba(110,200,122,0.3)', color: '#6ec87a', cursor: 'default' },
    bundleBadge: { display: 'inline-block', padding: '2px 8px', fontSize: '0.7rem', borderRadius: 10, background: 'rgba(201,169,97,0.12)', color: 'var(--accent-gold, #c9a961)', border: '1px solid rgba(201,169,97,0.2)', marginLeft: 8, verticalAlign: 'middle' },
    freeBadge: { display: 'inline-block', padding: '2px 8px', fontSize: '0.7rem', borderRadius: 10, background: 'rgba(110,200,122,0.1)', color: '#6ec87a', border: '1px solid rgba(110,200,122,0.2)', marginLeft: 8, verticalAlign: 'middle' },
    jewelryRow: { display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, WebkitOverflowScrolling: 'touch' },
    jewelryCard: { flex: '0 0 160px', padding: '16px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', borderRadius: 12, cursor: 'pointer', scrollSnapAlign: 'start', transition: 'border-color 0.3s, box-shadow 0.3s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
    jewelryCardActive: { borderColor: 'rgba(201,169,97,0.6)', boxShadow: '0 0 16px rgba(201,169,97,0.18)' },
    jewelryIcon: { marginBottom: 4 },
    jewelryLabel: { fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary, #e8e8f0)', margin: 0 },
    jewelryDesc: { fontSize: '0.72rem', color: 'var(--text-secondary, #8a8a9a)', margin: 0, lineHeight: 1.4 },
    jewelryPrice: { fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold, #c9a961)', margin: 0 },
    jewelryBtn: { padding: '6px 14px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6, border: '1px solid rgba(201,169,97,0.4)', background: 'rgba(201,169,97,0.12)', color: 'var(--accent-gold, #c9a961)', cursor: 'pointer', transition: 'all 0.2s' },
    jewelryBuyBtn: { padding: '6px 14px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6, border: '1px solid rgba(201,169,97,0.4)', background: 'rgba(201,169,97,0.25)', color: 'var(--accent-gold, #c9a961)', cursor: 'pointer', transition: 'all 0.2s' },
    jewelryBtns: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, width: '100%' },
    cardDetails: { display: 'flex', flexDirection: 'column', gap: 2, margin: '4px 0' },
    detailLine: { fontSize: '0.68rem', color: 'var(--accent-gold, #c9a961)', opacity: 0.7 },
    diceMatBtn: { padding: '3px 8px', fontSize: '0.62rem', fontWeight: 600, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary, #8a8a9a)', cursor: 'pointer', transition: 'all 0.2s' },
    diceMatActive: { borderColor: 'rgba(201,169,97,0.5)', background: 'rgba(201,169,97,0.15)', color: 'var(--accent-gold, #c9a961)' },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Mythouse Store</h1>
        <p style={S.subtitle}>Tools, stories, and journeys for mythic exploration</p>
      </div>

      {GROUPS.map(group => {
        // Jewelry carousel for adornments group
        if (group.id === 'adornments') {
          return (
            <div key={group.id} style={S.group} ref={jewelryRef}>
              <h2 style={S.groupTitle}>{group.title}</h2>
              <p style={S.groupSubtitle}>{group.subtitle}</p>
              <div style={S.jewelryRow}>
                {JEWELRY_FORMS.map(form => {
                  const isActive = activeFormParam === form.key;
                  return (
                    <div
                      key={form.key}
                      style={{ ...S.jewelryCard, ...(isActive ? S.jewelryCardActive : {}) }}
                      onClick={() => navigate(`/ring?form=${form.key}`)}
                    >
                      <div style={S.jewelryIcon}>
                        <JewelryFormIcon formKey={form.key} />
                      </div>
                      <h3 style={S.jewelryLabel}>{form.label}</h3>
                      <p style={S.jewelryDesc}>{form.description}</p>
                      {form.key === 'belt' && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #8a8a9a)', margin: '0 0 2px', fontStyle: 'italic' }}>
                          Leather with metal accents
                        </p>
                      )}
                      {(() => {
                        const metalLabel = activeMetal ? (METAL_LABELS[activeMetal] || activeMetal) : null;
                        const fc = profile?.jewelryConfig?.[form.key];
                        const size = fc?.size;
                        const dateRaw = fc?.date;
                        const dateStr = dateRaw ? (() => {
                          const [y, m, d] = dateRaw.split('-').map(Number);
                          return `${m}/${d}/${y}`;
                        })() : null;
                        const dateLabel = fc?.dateType && fc.dateType !== 'birthday' && dateStr
                          ? `${fc.dateType.charAt(0).toUpperCase() + fc.dateType.slice(1)}: ${dateStr}`
                          : dateStr;
                        if (!metalLabel && size == null && !dateLabel) return null;
                        return (
                          <div style={S.cardDetails}>
                            {metalLabel && <span style={S.detailLine}>{metalLabel}</span>}
                            {size != null && <span style={S.detailLine}>Size {size}</span>}
                            {dateLabel && <span style={S.detailLine}>{dateLabel}</span>}
                          </div>
                        );
                      })()}
                      {(() => {
                        const price = getJewelryPrice(form.key);
                        return (
                          <p style={S.jewelryPrice}>
                            {price != null ? `$${price.toLocaleString()}` : '$ \u2014'}
                          </p>
                        );
                      })()}
                      <div style={S.jewelryBtns}>
                        <button
                          style={S.jewelryBtn}
                          onClick={(e) => { e.stopPropagation(); navigate(`/ring?form=${form.key}`); }}
                        >
                          Configure
                        </button>
                        <button
                          style={S.jewelryBuyBtn}
                          onClick={(e) => { e.stopPropagation(); handlePurchase({ id: `jewelry-${form.key}`, mode: 'purchase', name: form.label }); }}
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Dice section
        if (group.id === 'dice') {
          const isDiceHighlighted = highlight === 'dice';
          return (
            <div key={group.id} style={S.group} ref={diceRef}>
              <h2 style={S.groupTitle}>{group.title}</h2>
              <p style={S.groupSubtitle}>{group.subtitle}</p>
              <div style={S.jewelryRow}>
                {DICE_PRODUCTS.map(dice => {
                  const hasToggle = dice.ore && dice.std;
                  const mat = hasToggle ? (diceMaterials[dice.key] || 'ore') : null;
                  const label = hasToggle ? dice[mat].label : dice.label;
                  const desc = hasToggle ? dice[mat].description : dice.description;
                  const price = hasToggle ? dice[mat].price : dice.price;
                  const iconKey = hasToggle ? dice[mat].iconKey : dice.iconKey;
                  const purchaseId = hasToggle ? `dice-${dice.key}-${mat}` : `dice-${dice.key}`;
                  return (
                    <div
                      key={dice.key}
                      style={{ ...S.jewelryCard, flex: '0 0 160px', ...(isDiceHighlighted ? S.jewelryCardActive : {}) }}
                    >
                      <div style={S.jewelryIcon}>
                        <DiceIcon diceKey={iconKey} />
                      </div>
                      <h3 style={S.jewelryLabel}>
                        {label}
                        {dice.bundle && <span style={S.bundleBadge}>Set</span>}
                      </h3>
                      {dice.faces && <p style={{ fontSize: '0.68rem', color: 'var(--accent-gold, #c9a961)', margin: 0, opacity: 0.7 }}>{dice.faces} faces</p>}
                      {hasToggle && (
                        <div style={{ display: 'flex', gap: 4, margin: '4px 0' }}>
                          <button
                            style={{ ...S.diceMatBtn, ...(mat === 'ore' ? S.diceMatActive : {}) }}
                            onClick={() => setDiceMaterials(prev => ({ ...prev, [dice.key]: 'ore' }))}
                          >{dice.ore.material}</button>
                          <button
                            style={{ ...S.diceMatBtn, ...(mat === 'std' ? S.diceMatActive : {}) }}
                            onClick={() => setDiceMaterials(prev => ({ ...prev, [dice.key]: 'std' }))}
                          >{dice.std.material}</button>
                        </div>
                      )}
                      <p style={S.jewelryDesc}>{desc}</p>
                      <p style={S.jewelryPrice}>{price}</p>
                      <div style={S.jewelryBtns}>
                        <button
                          style={S.jewelryBuyBtn}
                          onClick={() => handlePurchase({ id: purchaseId, mode: 'purchase', name: label })}
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        const items = CATALOG.filter(c => c.group === group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id} style={S.group}>
            <h2 style={S.groupTitle}>{group.title}</h2>
            <p style={S.groupSubtitle}>{group.subtitle}</p>
            {items.map(item => {
              const isHighlighted = highlight === item.id;
              const isOwned = owned.has(item.id);
              return (
                <div
                  key={item.id}
                  ref={isHighlighted ? highlightRef : null}
                  style={{ ...S.card, ...(isHighlighted ? S.cardHighlight : {}) }}
                >
                  <div style={S.cardTop}>
                    <div style={{ flex: 1 }}>
                      <h3 style={S.cardName}>
                        {item.name}
                        {item.bundle && <span style={S.bundleBadge}>Bundle</span>}
                        {item.free && <span style={S.freeBadge}>Free</span>}
                      </h3>
                      <p style={S.cardDesc}>{item.description}</p>
                    </div>
                    <div style={S.cardRight}>
                      <div style={S.price}>{item.donation ? 'Pay What You Want' : item.label}</div>
                      {isOwned ? (
                        <span style={{ ...S.btn, ...S.btnOwned }}>Owned</span>
                      ) : !user && !item.free ? (
                        <button style={S.btn} onClick={() => handlePurchase(item)}>
                          Sign Up to {item.mode === 'sub' ? 'Subscribe' : 'Buy'}
                        </button>
                      ) : (
                        <button style={S.btn} onClick={() => handlePurchase(item)}>
                          {item.free ? 'Activate' : item.mode === 'sub' ? 'Subscribe' : item.donation ? 'Donate' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {!user && (
        <div style={{ textAlign: 'center', marginTop: 40, padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', borderRadius: 12 }}>
          <p style={{ color: 'var(--text-secondary, #8a8a9a)', fontSize: '0.88rem', margin: '0 0 12px' }}>
            Already have an account?
          </p>
          <button
            style={S.btn}
            onClick={() => { sessionStorage.setItem('mythouse_return', `/store${window.location.search}`); navigate('/'); }}
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}
