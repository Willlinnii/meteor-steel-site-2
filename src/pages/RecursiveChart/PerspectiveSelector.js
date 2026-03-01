import React from 'react';
import { PERSPECTIVE_VIEWS, PERSPECTIVE_THEMES } from '../../data/recursiveRules';

export default function PerspectiveSelector({
  perspective, onSelect,
  emFieldVisible, onEmToggle,
  showOrbitalPaths, onOrbitsToggle,
  mode, zodiacFrame, onZodiacToggle,
}) {
  const groups = {
    frame: PERSPECTIVE_VIEWS.filter(v => v.group === 'frame'),
    planet: PERSPECTIVE_VIEWS.filter(v => v.group === 'planet'),
    reading: PERSPECTIVE_VIEWS.filter(v => v.group === 'reading'),
  };

  return (
    <div className="recursive-selector">
      {Object.entries(groups).map(([groupKey, items]) => (
        <div key={groupKey} className="recursive-selector-group">
          {items.map(v => {
            const isActive = perspective === v.key;
            return (
              <button
                key={v.key}
                className={`recursive-seg-btn${isActive ? ' active' : ''}`}
                onClick={() => onSelect(v.key)}
              >
                <span className="recursive-seg-symbol">{v.symbol}</span>
                <span className="recursive-seg-label">{v.label}</span>
              </button>
            );
          })}
        </div>
      ))}

      {/* Settings toggle row */}
      <div className="rc-settings-row">
        <button
          className={`rc-toggle-pill${zodiacFrame === 'tropical' ? ' active' : ''}`}
          onClick={() => onZodiacToggle && onZodiacToggle('tropical')}
          title="Tropical (Western) — anchored to the vernal equinox"
        >
          Tropical
        </button>
        <button
          className={`rc-toggle-pill${zodiacFrame === 'sidereal' ? ' active' : ''}`}
          onClick={() => onZodiacToggle && onZodiacToggle('sidereal')}
          title="Sidereal (Vedic) — anchored to the fixed stars"
        >
          Sidereal
        </button>
        <span className="rc-settings-divider">|</span>
        <button
          className={`rc-toggle-pill${emFieldVisible ? ' active' : ''}`}
          onClick={onEmToggle}
          title="Toggle electromagnetic field overlay"
        >
          EM
        </button>
        <button
          className={`rc-toggle-pill${showOrbitalPaths ? ' active' : ''}`}
          onClick={onOrbitsToggle}
          title="Toggle orbital path circles"
        >
          Orbits
        </button>
      </div>
    </div>
  );
}
