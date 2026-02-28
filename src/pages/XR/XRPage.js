import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useXRMode } from '../../App';
import { usePageTracking } from '../../coursework/CourseworkContext';
import './XRPage.css';

const EXPERIENCES = [
  {
    id: 'celestial-3d',
    label: 'Celestial Wheels 3D',
    description: 'Step inside the planetary spheres. Orbit the Sun in heliocentric view, stand at the center in geocentric, or see where the planets are right now. Full VR headset and phone AR support.',
    path: '/chronosphaera/vr',
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
    features: '360 Panorama · Street View',
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
  {
    id: 'crown-3d',
    label: 'Crown & Ring 3D',
    description: 'Design a ring, bracelet, or crown with planetary metals and birthstones in an interactive 3D scene. Heliocentric, geocentric, and navaratna layouts.',
    path: '/ring',
    features: '3D · Orbit Controls · Fullscreen',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="24" rx="14" ry="6" opacity="0.4" />
        <path d="M6 24 L10 12 L16 18 L20 8 L24 18 L30 12 L34 24" opacity="0.6" />
        <circle cx="20" cy="8" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="30" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'dodecahedron-3d',
    label: 'Dodecahedron',
    description: 'Rotate a 3D Roman dodecahedron. Three modes: constellation map (Lantern of Phanes), Roman coin density calculator, and d12 die roller.',
    path: '/dodecahedron',
    features: '3D · Orbit Controls · Physics',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20,3 35,13 31,30 9,30 5,13" opacity="0.4" />
        <polygon points="20,10 28,16 26,26 14,26 12,16" opacity="0.6" />
        <line x1="20" y1="3" x2="20" y2="10" opacity="0.3" />
        <line x1="35" y1="13" x2="28" y2="16" opacity="0.3" />
        <line x1="31" y1="30" x2="26" y2="26" opacity="0.3" />
        <line x1="9" y1="30" x2="14" y2="26" opacity="0.3" />
        <line x1="5" y1="13" x2="12" y2="16" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'art-book-3d',
    label: 'Fallen Starlight 3D',
    description: 'Explore a 3D mountain with seven levels of gemstones and ores mapped to the Fallen Starlight narrative. Book and mountain camera modes.',
    path: '/art-book',
    features: '3D · Dual Camera · Audio',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 4 L34 34 L6 34 Z" opacity="0.3" />
        <line x1="10" y1="28" x2="30" y2="28" opacity="0.4" />
        <line x1="13" y1="22" x2="27" y2="22" opacity="0.4" />
        <line x1="15" y1="16" x2="25" y2="16" opacity="0.4" />
        <circle cx="20" cy="10" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="14" cy="25" r="1.5" fill="currentColor" opacity="0.3" />
        <circle cx="26" cy="25" r="1.5" fill="currentColor" opacity="0.3" />
        <circle cx="17" cy="19" r="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'microcosmos-3d',
    label: 'Microcosmos',
    description: 'An interactive 3D anatomical body explorer. Toggle body systems, select organs, and view planetary correspondences across traditions.',
    path: '/microcosmos',
    features: '3D · Orbit Controls · 2D Toggle',
    icon: (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="9" r="5" opacity="0.4" />
        <line x1="20" y1="14" x2="20" y2="28" opacity="0.5" />
        <line x1="20" y1="18" x2="12" y2="24" opacity="0.4" />
        <line x1="20" y1="18" x2="28" y2="24" opacity="0.4" />
        <line x1="20" y1="28" x2="14" y2="36" opacity="0.4" />
        <line x1="20" y1="28" x2="26" y2="36" opacity="0.4" />
        <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="18" cy="24" r="1.5" fill="currentColor" opacity="0.3" />
        <circle cx="22" cy="24" r="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
];

export default function XRPage() {
  const navigate = useNavigate();
  const { xrMode, setXrMode } = useXRMode();
  const { track } = usePageTracking('xr');

  const handleEnter = (path, experienceId) => {
    track(`experience.${experienceId}`);
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
              onClick={() => handleEnter(exp.path, exp.id)}
            >
              Enter Experience
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
