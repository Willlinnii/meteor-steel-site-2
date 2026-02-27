import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfile } from '../profile/ProfileContext';
import './RingButton.css';

const FORM_LABELS = { ring: 'Ring', bracelet: 'Bracelet', belt: 'Belt', armband: 'Arm Band', crown: 'Crown' };
const METAL_LABELS = { gold: 'Gold', silver: 'Silver', meteorSteel: 'Meteor Steel', bronze: 'Bronze', copper: 'Copper', tin: 'Tin', lead: 'Lead' };
const MODE_LABELS = { heliocentric: 'Helio', geocentric: 'Geo', birthstone: 'Birthstone' };
const LAYOUT_LABELS = { astronomical: 'Astronomical', navaratna: 'Navaratna' };

export default function RingButton() {
  const {
    ringForm, ringMetal, ringLayout, ringMode, ringZodiacMode,
    ringSize, jewelryConfig,
  } = useProfile();
  const location = useLocation();
  const [showRingArea, setShowRingArea] = useState(false);

  // Derive view from current route
  const is2D = location.pathname === '/ring/2d';
  const viewLabel = is2D ? '2D' : '3D';

  // Full config snapshot — everything the ring page knows
  const formConfig = jewelryConfig?.[ringForm] || {};
  const config = {
    form: ringForm,
    metal: ringMetal,
    layout: ringLayout,
    mode: ringMode,
    zodiacMode: ringZodiacMode,
    size: formConfig.size,
    date: formConfig.date,
    dateType: formConfig.dateType,
    view: viewLabel,
    showRingArea,
  };

  const handleClick = () => {
    setShowRingArea(prev => !prev);
  };

  // Build tooltip with full identity
  const tooltip = [
    `${FORM_LABELS[ringForm] || 'Ring'} · ${METAL_LABELS[ringMetal] || 'Gold'}`,
    `${LAYOUT_LABELS[ringLayout] || 'Astronomical'} · ${MODE_LABELS[ringMode] || 'Helio'}`,
    `${ringZodiacMode === 'sidereal' ? 'Sidereal' : 'Tropical'} · ${viewLabel}`,
    formConfig.size ? `Size ${formConfig.size}` : null,
  ].filter(Boolean).join('\n');

  // Mode-aware accent colors
  const accent = ringMode === 'geocentric' ? '#4a9bd9'
    : ringMode === 'birthstone' ? '#a86ef5'
    : '#c9a961';

  return (
    <button
      className={`ring-button${showRingArea ? ' ring-button-active' : ''}`}
      onClick={handleClick}
      aria-label={showRingArea ? 'Hide ring' : 'Show ring'}
      title={tooltip}
      data-form={ringForm}
      data-metal={ringMetal}
      data-layout={ringLayout}
      data-mode={ringMode}
      data-zodiac={ringZodiacMode}
      data-view={viewLabel}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        {/* Outer orbit — layout indicator */}
        <ellipse cx="12" cy="12" rx="9" ry="9"
          stroke={accent} strokeWidth="1.5" opacity="0.35"
          strokeDasharray={ringLayout === 'navaratna' ? '2 2' : 'none'}
        />
        {/* Ring band */}
        <ellipse cx="12" cy="12" rx="7" ry="7"
          stroke={accent} strokeWidth="2"
        />
        {/* Gemstone */}
        <ellipse cx="12" cy="5.5" rx="2.5" ry="1.5"
          fill={accent} opacity="0.85"
        />
        {/* View indicator: small dot for 2D, small cube-hint for 3D */}
        {is2D ? (
          <circle cx="12" cy="18.5" r="1.2" fill={accent} opacity="0.6" />
        ) : (
          <rect x="10.5" y="17" width="3" height="3" rx="0.5"
            stroke={accent} strokeWidth="0.8" opacity="0.6" fill="none"
          />
        )}
      </svg>
    </button>
  );
}
