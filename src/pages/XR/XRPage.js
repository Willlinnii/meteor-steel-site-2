import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useXRMode } from '../../App';
import './XRPage.css';

const EXPERIENCES = [
  {
    id: 'celestial-3d',
    label: 'Celestial Wheels 3D',
    description: 'Step inside the planetary spheres. Orbit the Sun in heliocentric view, stand at the center in geocentric, or see where the planets are right now. Full VR headset and phone AR support.',
    path: '/metals/vr',
    features: 'VR · Phone AR · Fullscreen',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="16" opacity="0.3" />
        <circle cx="20" cy="20" r="10" opacity="0.5" />
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="30" cy="10" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="10" cy="30" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="33" cy="24" r="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'mythic-earth',
    label: 'Mythic Earth Globe',
    description: 'View the world\'s sacred sites, mythic locations, and literary landmarks on an interactive 3D globe. In AR mode the earth floats over your camera feed, controlled by your phone\'s gyroscope.',
    path: '/mythic-earth',
    features: 'Phone AR · Gyroscope · Fullscreen',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="15" opacity="0.4" />
        <ellipse cx="20" cy="20" rx="15" ry="6" opacity="0.25" />
        <ellipse cx="20" cy="20" rx="6" ry="15" opacity="0.25" />
        <circle cx="14" cy="14" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="26" cy="18" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="27" r="1.5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'sacred-sites-360',
    label: 'Sacred Sites 360',
    description: 'Browse the world\'s sacred sites in immersive 360 Street View panoramas. Pick a site and look around from ground level.',
    path: '/sacred-sites-360',
    features: '360 Panorama \u00B7 Street View',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="16" opacity="0.25" />
        <path d="M20 4 L20 8" opacity="0.5" />
        <path d="M20 32 L20 36" opacity="0.5" />
        <path d="M4 20 L8 20" opacity="0.5" />
        <path d="M32 20 L36 20" opacity="0.5" />
        <circle cx="20" cy="20" r="6" opacity="0.5" />
        <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.6" />
        <path d="M20 14 L20 10" />
        <path d="M25 17 L28 14" />
        <path d="M25 23 L28 26" />
      </svg>
    ),
  },
];

export default function XRPage() {
  const navigate = useNavigate();
  const { xrMode, setXrMode } = useXRMode();

  const handleEnter = (path) => {
    if (!xrMode) setXrMode(true);
    navigate(path);
  };

  return (
    <div className="xr-page">
      <div className="xr-header">
        <div className="xr-header-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="7" width="22" height="11" rx="3" />
            <circle cx="8" cy="12.5" r="2.5" />
            <circle cx="16" cy="12.5" r="2.5" />
            <path d="M10.5 12.5 Q12 15 13.5 12.5" />
          </svg>
        </div>
        <h1 className="xr-title">VR / XR Experiences</h1>
        <p className="xr-subtitle">
          Immersive views of the mythic cosmos. Use a VR headset, phone AR with your camera, or fullscreen mode to step inside the Mythouse.
        </p>
      </div>

      <div className="xr-grid">
        {EXPERIENCES.map(exp => (
          <div key={exp.id} className="xr-card">
            <div className="xr-card-main">
              <div className="xr-card-icon">{exp.icon}</div>
              <div className="xr-card-body">
                <span className="xr-card-title">{exp.label}</span>
                <span className="xr-card-features">{exp.features}</span>
                <span className="xr-card-desc">{exp.description}</span>
              </div>
            </div>
            <button
              className="xr-card-enter"
              onClick={() => handleEnter(exp.path)}
            >
              Enter Experience
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
