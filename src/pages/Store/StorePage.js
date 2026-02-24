import React, { useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

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

const GROUPS = [
  { id: 'subscriptions', title: 'Subscriptions', subtitle: 'Ongoing access to tools, courses, and journeys' },
  { id: 'books', title: 'Books', subtitle: 'Original works on mythology and narrative' },
  { id: 'donations', title: 'Support', subtitle: 'Contribute to cultural preservation' },
];

const UTM_SESSION_KEY = 'mythouse_utm';

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

  const highlight = searchParams.get('highlight');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmContent = searchParams.get('utm_content');

  // Store UTM params in sessionStorage for checkout attribution
  useEffect(() => {
    if (utmCampaign || utmContent) {
      const utm = {};
      if (utmCampaign) utm.campaign = utmCampaign;
      if (utmContent) utm.content = utmContent;
      sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm));
    }
  }, [utmCampaign, utmContent]);

  // Scroll to highlighted product
  useEffect(() => {
    if (highlight && highlightRef.current) {
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
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Mythouse Store</h1>
        <p style={S.subtitle}>Tools, stories, and journeys for mythic exploration</p>
      </div>

      {GROUPS.map(group => {
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
