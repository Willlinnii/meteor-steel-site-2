import React, { useState } from 'react';
import { BODY_SYSTEMS } from './BodySystemDefs';

export default function BodyButtonStack({ activeSystem, onToggleSystem, is2D, onToggle2D }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="microcosmos-btn-stack"
      data-expanded={expanded || undefined}
    >
      {/* System toggle buttons */}
      {BODY_SYSTEMS.map((sys) => (
        <button
          key={sys.id}
          className={`microcosmos-sys-btn${activeSystem === sys.id ? ' active' : ''}`}
          style={{
            '--sys-color': sys.color,
          }}
          onClick={() => onToggleSystem(sys.id)}
          title={sys.label}
        >
          {sys.icon}
        </button>
      ))}

      {/* 2D/3D toggle */}
      <button
        className="microcosmos-dim-btn"
        onClick={onToggle2D}
        title={is2D ? 'Switch to 3D' : 'Switch to 2D'}
      >
        {is2D ? '3D' : '2D'}
      </button>

      {/* Hamburger expand/collapse — always visible at bottom */}
      <button
        className="microcosmos-menu-btn"
        onClick={() => setExpanded((p) => !p)}
        title={expanded ? 'Collapse buttons' : 'Show buttons'}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          {expanded ? (
            <path d="M5 5l8 8M13 5l-8 8" />
          ) : (
            <>
              <line x1="3" y1="5" x2="15" y2="5" />
              <line x1="3" y1="9" x2="15" y2="9" />
              <line x1="3" y1="13" x2="15" y2="13" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
