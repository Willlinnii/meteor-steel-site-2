import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTracking } from '../../coursework/CourseworkContext';
import { useProfile } from '../../profile/ProfileContext';
import './YellowBrickRoadPage.css';

const JOURNEYS = [
  {
    id: 'cosmic',
    label: 'Cosmic Journey',
    description: 'Ascend through the planetary spheres, traverse the zodiac, and descend carrying what you\'ve gathered. 26 encounters. 3 levels each.',
    path: '/chronosphaera/yellow-brick-road',
    storyPath: '/journey/cosmic',
    stages: '26 stops',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="16" opacity="0.3" />
        <circle cx="20" cy="20" r="10" opacity="0.5" />
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.6" />
        <line x1="20" y1="2" x2="20" y2="8" />
        <line x1="20" y1="32" x2="20" y2="38" />
        <line x1="2" y1="20" x2="8" y2="20" />
        <line x1="32" y1="20" x2="38" y2="20" />
      </svg>
    ),
  },
  {
    id: 'planetary',
    label: 'Planetary Journey',
    description: 'Ascend through the seven planetary spheres. Each planet tests you three times — Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn.',
    path: '/chronosphaera/yellow-brick-road',
    storyPath: '/journey/planetary',
    stages: '7 stops, 3 levels each',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="14" opacity="0.3" />
        <circle cx="20" cy="6" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="32" cy="11" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="34" cy="24" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="26" cy="34" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="14" cy="34" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="6" cy="24" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="8" cy="11" r="2.5" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'zodiac',
    label: 'Zodiac Journey',
    description: 'Traverse the twelve signs of the zodiac. Each sign tests you three times — Aries through Pisces.',
    path: '/chronosphaera/yellow-brick-road',
    storyPath: '/journey/zodiac',
    stages: '12 stops, 3 levels each',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="15" opacity="0.3" />
        {[...Array(12)].map((_, i) => {
          const a = (i * 30 - 90) * Math.PI / 180;
          return <circle key={i} cx={20 + 15 * Math.cos(a)} cy={20 + 15 * Math.sin(a)} r="1.8" fill="currentColor" opacity="0.6" />;
        })}
      </svg>
    ),
  },
  {
    id: 'monomyth',
    label: 'Monomyth Journey',
    description: 'Walk the eight stages of the Hero\'s Journey with Atlas as your guide. From the Surface through Calling, Crossing, Initiation, Nadir, Return, Arrival, and Renewal.',
    path: '/monomyth?journey=true',
    storyPath: '/journey/monomyth',
    stages: '8 stages',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="14" opacity="0.4" />
        <path d="M20,6 L20,14" />
        <path d="M34,20 L26,20" />
        <path d="M20,34 L20,26" />
        <path d="M6,20 L14,20" />
        <circle cx="20" cy="6" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="34" cy="20" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="20" cy="34" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="6" cy="20" r="2" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'meteor-steel',
    label: 'Meteor Steel Journey',
    description: 'Walk the eight stages of the Meteor Steel process with Atlas as your guide. From Golden Age through Calling Star, Crater Crossing, and into the Age of Steel.',
    path: '/?journey=true',
    storyPath: '/journey/meteor-steel',
    stages: '8 stages',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30,6 L12,28" opacity="0.5" />
        <path d="M10,28 L14,28 L12,34 L18,24 L14,24 L16,18" opacity="0.6" />
        <circle cx="30" cy="8" r="3" opacity="0.4" />
        <path d="M27,5 L33,11" opacity="0.3" />
        <path d="M33,5 L27,11" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'fused',
    label: 'Fused Journey',
    description: 'Walk monomyth and meteor steel fused into one wheel. Two questions per stage — one for each tradition.',
    storyPath: '/journey/fused',
    stages: '8 stages, 2 phases',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="15" cy="20" r="10" opacity="0.3" />
        <circle cx="25" cy="20" r="10" opacity="0.3" />
        <path d="M20,12 L20,28" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'fallen-starlight-journey',
    label: 'Fallen Starlight Journey',
    description: 'Walk the eight chapters of Fallen Starlight — from Golden Surface to Life in the Dirt. Each chapter tests you three times.',
    path: '/fallen-starlight',
    storyPath: '/journey/fallen-starlight-journey',
    stages: '8 chapters, 3 levels each',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,4 L20,14" opacity="0.4" />
        <circle cx="20" cy="4" r="2" fill="currentColor" opacity="0.7" />
        <path d="M14,16 L26,16 L24,36 L16,36 Z" opacity="0.3" />
        <path d="M17,20 L23,20" opacity="0.5" />
        <path d="M17,24 L23,24" opacity="0.5" />
        <path d="M17,28 L23,28" opacity="0.5" />
        <path d="M18,32 L22,32" opacity="0.5" />
      </svg>
    ),
  },
];

export default function YellowBrickRoadPage() {
  usePageTracking('ybr');
  const { hasSubscription } = useProfile();
  const navigate = useNavigate();
  const [showGate, setShowGate] = useState(false);
  const hasYBR = hasSubscription('ybr');

  const handleGatedClick = (e) => {
    if (!hasYBR) {
      e.preventDefault();
      setShowGate(true);
    }
  };

  return (
    <div className="ybr-page">
      <div className="ybr-header">
        <div className="ybr-header-icon">
          <svg viewBox="0 0 20 14" width="32" height="22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M1,4 L7,1 L19,1 L13,4 Z" />
            <path d="M1,4 L1,13 L13,13 L13,4" />
            <path d="M13,4 L19,1 L19,10 L13,13" />
            <line x1="7" y1="4" x2="7" y2="13" />
            <line x1="1" y1="8.5" x2="13" y2="8.5" />
            <line x1="4" y1="8.5" x2="4" y2="13" />
            <line x1="10" y1="4" x2="10" y2="8.5" />
          </svg>
        </div>
        <h1 className="ybr-title">Yellow Brick Road</h1>
        <p className="ybr-subtitle">
          Walk the paths of transformation with Atlas as your guide. Each journey tests your understanding through conversation — answer well and the wheel turns onward.
        </p>
      </div>

      <div className="ybr-grid">
        {JOURNEYS.map(j => (
          <div key={j.id} className={`ybr-card${!hasYBR ? ' ybr-card-locked' : ''}`}>
            {j.path ? (
              <Link className="ybr-card-main" to={j.path} onClick={handleGatedClick}>
                <div className="ybr-card-icon">{j.icon}</div>
                <div className="ybr-card-body">
                  <span className="ybr-card-title">{j.label}</span>
                  <span className="ybr-card-stages">{j.stages}</span>
                  <span className="ybr-card-desc">{j.description}</span>
                </div>
              </Link>
            ) : (
              <div className="ybr-card-main" onClick={!hasYBR ? handleGatedClick : undefined} style={!hasYBR ? { cursor: 'pointer' } : undefined}>
                <div className="ybr-card-icon">{j.icon}</div>
                <div className="ybr-card-body">
                  <span className="ybr-card-title">{j.label}</span>
                  <span className="ybr-card-stages">{j.stages}</span>
                  <span className="ybr-card-desc">{j.description}</span>
                </div>
              </div>
            )}
            {j.storyPath && (
              <Link
                className="ybr-card-story"
                to={j.storyPath}
                title="Enter the story — Atlas guides you through the Ouroboros"
                onClick={e => { e.stopPropagation(); handleGatedClick(e); }}
              >
                <img
                  src="/images/ouroboros-dragon.png"
                  alt="Ouroboros"
                  className="ybr-card-story-img"
                />
                <span className="ybr-card-story-label">Enter the Story</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {showGate && (
        <div className="subscription-gate-overlay" onClick={() => setShowGate(false)}>
          <div className="subscription-gate-popup" onClick={e => e.stopPropagation()}>
            <h3 className="subscription-gate-title">Yellow Brick Road</h3>
            <p className="subscription-gate-desc">The Yellow Brick Road is a guided, stage-by-stage journey through the monomyth. Enable the subscription in your profile to walk the path with Atlas.</p>
            <div className="subscription-gate-actions">
              <button className="subscription-gate-primary" onClick={() => { navigate('/profile#subscriptions'); setShowGate(false); }}>
                Manage Membership
              </button>
              <button className="subscription-gate-secondary" onClick={() => setShowGate(false)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
