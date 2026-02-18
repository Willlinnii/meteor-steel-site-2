import React from 'react';

// D6 face with pips
const PIP_POSITIONS = {
  1: [[25, 25]],
  2: [[10, 10], [40, 40]],
  3: [[10, 10], [25, 25], [40, 40]],
  4: [[10, 10], [40, 10], [10, 40], [40, 40]],
  5: [[10, 10], [40, 10], [25, 25], [10, 40], [40, 40]],
  6: [[10, 10], [40, 10], [10, 25], [40, 25], [10, 40], [40, 40]],
};

export function D6Display({ value, rolling }) {
  const pips = PIP_POSITIONS[value] || [];
  return (
    <svg className={`dice-svg d6${rolling ? ' dice-rolling' : ''}`} viewBox="0 0 50 50" width="48" height="48">
      <rect x="1" y="1" width="48" height="48" rx="6" fill="var(--bg-medium)" stroke="var(--accent-gold)" strokeWidth="1.5" />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="var(--text-primary)" />
      ))}
    </svg>
  );
}

// Stick dice for Senet (4 sticks)
export function StickDiceDisplay({ sticks, result, rolling }) {
  const sticksArr = sticks || (result && result.sticks);
  return (
    <div className={`dice-sticks${rolling ? ' dice-rolling' : ''}`}>
      {(sticksArr || [0, 0, 0, 0]).map((s, i) => (
        <svg key={i} className="dice-svg stick" viewBox="0 0 12 50" width="16" height="48">
          <rect x="1" y="1" width="10" height="48" rx="3"
            fill={s === 1 ? 'var(--bg-dark)' : 'var(--accent-gold)'}
            stroke="var(--border-subtle)" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

// Tetrahedral dice for Ur (4 pyramids)
export function TetrahedralDiceDisplay({ dice, result, rolling }) {
  // Accept either 'dice' array or 'result' object with .dice property
  const diceArr = dice || (result && result.dice);
  return (
    <div className={`dice-tetra${rolling ? ' dice-rolling' : ''}`}>
      {(diceArr || [0, 0, 0, 0]).map((d, i) => (
        <svg key={i} className="dice-svg tetra" viewBox="0 0 30 30" width="28" height="28">
          <polygon points="15,2 2,28 28,28"
            fill={d === 1 ? 'var(--accent-gold)' : 'var(--bg-medium)'}
            stroke="var(--accent-steel)" strokeWidth="1.5" />
          {d === 1 && <circle cx="15" cy="18" r="3" fill="var(--bg-dark)" />}
        </svg>
      ))}
    </div>
  );
}

// Cowrie shells for Pachisi
export function CowrieDiceDisplay({ shells, rolling }) {
  return (
    <div className={`dice-cowrie${rolling ? ' dice-rolling' : ''}`}>
      {(shells || [0, 0, 0, 0, 0, 0]).map((s, i) => (
        <svg key={i} className="dice-svg cowrie" viewBox="0 0 24 30" width="20" height="26">
          <ellipse cx="12" cy="15" rx="10" ry="13"
            fill={s === 1 ? 'var(--accent-gold)' : 'var(--bg-medium)'}
            stroke="var(--accent-steel)" strokeWidth="1" />
          {s === 1 && <line x1="6" y1="15" x2="18" y2="15" stroke="var(--bg-dark)" strokeWidth="1.5" />}
        </svg>
      ))}
    </div>
  );
}
