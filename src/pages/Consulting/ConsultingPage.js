import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import './ConsultingPage.css';

const CLIENT_TYPES = [
  {
    title: 'Storytellers & Artists',
    text: 'You carry a vision. The story you\'re making is also making you. We work with the mythic pattern inside the creative process \u2014 from the raw impulse to the release.',
  },
  {
    title: 'Creators & Makers',
    text: 'Whether you build worlds, products, or experiences \u2014 creation follows the same archetypal arc. The forge is where the material meets the meaning.',
  },
  {
    title: 'Seekers on the Journey',
    text: 'You feel the pull. Something is changing, or needs to. We map the territory of your transition through the lens of the hero\'s journey \u2014 not as metaphor, but as lived pattern.',
  },
  {
    title: 'Brands & Organizations',
    text: 'Every organization carries a myth, spoken or not. We surface the founding story, the shadow, and the transformation \u2014 so your narrative becomes conscious and coherent.',
  },
  {
    title: 'Leaders & Visionaries',
    text: 'Leadership is a mythic act. The leader who knows their story \u2014 and the story they\'re inside \u2014 leads with depth, not just direction.',
  },
];

const TIERS = [
  {
    name: 'Atlas-Guided',
    price: 'Included with subscription',
    desc: 'Atlas conducts your mythic intake and guides you through a self-paced journey on the platform. Access the full coordinate system \u2014 archetypes, stages, correspondences \u2014 at your own rhythm.',
  },
  {
    name: 'Practitioner-Guided',
    price: 'Session packs available',
    desc: 'Matched with a certified Mythouse practitioner who walks the journey alongside you. Live sessions grounded in archetypal and narrative language. Session packs of 4 or 8.',
  },
  {
    name: 'Direct',
    price: 'By arrangement',
    desc: 'Work directly with Will and the Mentone space. Retreats, intensives, and residencies. For those ready to go deep into the forge.',
  },
];

const RETREATS = [
  {
    name: 'Day Visit',
    price: '$500',
    desc: 'A single day at the Mentone forge. Intake, a full session, and a closing narrative. Arrive in the morning, leave with clarity.',
  },
  {
    name: 'Weekend Retreat',
    price: '$1,500',
    desc: 'Two days in the mountains. Multiple sessions, walking meditations, evening fire. Time to let the work breathe between thresholds.',
  },
  {
    name: 'Week-Long Residency',
    price: '$5,000',
    desc: 'A full immersion. The complete engagement arc in concentrated form. For those ready to walk all eight stages in the forge itself.',
  },
];

export default function ConsultingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const consultantLevel = profile?.credentials?.consultant?.level || 0;

  return (
    <div className="consulting-page">
      <div className="consulting-container">
        {/* Hero */}
        <div className="consulting-hero">
          <h1 className="consulting-hero-title">Mythic Narrative Consulting</h1>
          <p className="consulting-hero-subtitle">
            One practice. Archetypal, psychological, philosophical, narrative.
          </p>
        </div>

        {/* The Practice */}
        <div className="consulting-section">
          <h2 className="consulting-section-title">The Practice</h2>
          <div className="consulting-practice-text">
            This is not business consulting with mythic window dressing. The methodology <em>is</em> the myth.
            We work with the archetypal patterns that have always shaped how humans navigate transformation &mdash;
            the hero's journey, the planetary archetypes, the alchemical stages, the narrative structures
            that cultures have used for millennia to make meaning from change.
            <br /><br />
            Whether you're a storyteller finding the shape of your next work, a seeker standing at a threshold,
            or an organization searching for its authentic narrative &mdash; the same mythic architecture applies.
            We don't impose frameworks. We surface the patterns already alive in your situation and give you
            the language to work with them.
          </div>
        </div>

        <hr className="consulting-divider" />

        {/* Who It Serves */}
        <div className="consulting-section">
          <h2 className="consulting-section-title">Who It Serves</h2>
          <div className="consulting-serves-grid">
            {CLIENT_TYPES.map(ct => (
              <div key={ct.title} className="consulting-serves-card">
                <h3 className="consulting-serves-card-title">{ct.title}</h3>
                <p className="consulting-serves-card-text">{ct.text}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="consulting-divider" />

        {/* How It Works */}
        <div className="consulting-section">
          <h2 className="consulting-section-title">How It Works</h2>
          <div className="consulting-arc">
            <div className="consulting-arc-step">
              <div className="consulting-arc-step-label">Intake</div>
              <div className="consulting-arc-step-desc">
                Atlas conducts a mythic assessment. Where are you in your story? What archetype is active?
              </div>
            </div>
            <div className="consulting-arc-step">
              <div className="consulting-arc-step-label">Engagement</div>
              <div className="consulting-arc-step-desc">
                Eight stages, each a threshold. Sessions grounded in archetypal and narrative language.
              </div>
            </div>
            <div className="consulting-arc-step">
              <div className="consulting-arc-step-label">Synthesis</div>
              <div className="consulting-arc-step-desc">
                The narrative of your transformation. What you carried through the fire and what emerged.
              </div>
            </div>
          </div>
        </div>

        <hr className="consulting-divider" />

        {/* Tiers */}
        <div className="consulting-section">
          <h2 className="consulting-section-title">Engagement Tiers</h2>
          <div className="consulting-tiers">
            {TIERS.map(tier => (
              <div key={tier.name} className="consulting-tier">
                <h3 className="consulting-tier-name">{tier.name}</h3>
                <div className="consulting-tier-price">{tier.price}</div>
                <p className="consulting-tier-desc">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="consulting-divider" />

        {/* Retreats */}
        <div className="consulting-section">
          <h2 className="consulting-section-title">Retreats &amp; Residencies</h2>
          <div className="consulting-practice-text" style={{ marginBottom: 20 }}>
            The Mentone space sits in the mountains of northeast Alabama &mdash; a place where the forge
            metaphor becomes literal. Sessions happen around fires, on trails, and at the anvil.
            These are not conferences. They are mythic intensives.
          </div>
          <div className="consulting-tiers">
            {RETREATS.map(r => (
              <div key={r.name} className="consulting-tier">
                <h3 className="consulting-tier-name">{r.name}</h3>
                <div className="consulting-tier-price">{r.price}</div>
                <p className="consulting-tier-desc">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="consulting-divider" />

        {/* CTA */}
        <div className="consulting-cta">
          {user ? (
            <Link to="/consulting/intake" className="consulting-begin-btn">
              Begin Your Intake
            </Link>
          ) : (
            <Link to="/login" className="consulting-begin-btn">
              Sign In to Begin
            </Link>
          )}
          {user && (
            <Link
              to="/consulting/dashboard"
              style={{ display: 'inline-block', marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'Crimson Pro, serif' }}
            >
              View your engagements
            </Link>
          )}
          {consultantLevel >= 2 && (
            <Link
              to="/consulting/practitioner"
              style={{ display: 'inline-block', marginTop: 8, marginLeft: user ? 16 : 0, color: 'var(--accent-gold)', fontSize: '0.85rem', fontFamily: 'Crimson Pro, serif' }}
            >
              Practitioner Dashboard
            </Link>
          )}
          <p className="consulting-cta-sub">
            Atlas will guide you through a mythic assessment to map where you are in your story.
          </p>
        </div>
      </div>
    </div>
  );
}
