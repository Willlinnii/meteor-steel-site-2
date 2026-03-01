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

// D4 — Tetrahedron face (equilateral triangle with number)
export function D4Display({ value, rolling }) {
  return (
    <svg className={`dice-svg d4${rolling ? ' dice-rolling' : ''}`} viewBox="0 0 60 60" width="48" height="48">
      <polygon points="30,4 4,56 56,56"
        fill="var(--bg-medium)" stroke="var(--accent-gold)" strokeWidth="1.5" />
      <text x="30" y="42" textAnchor="middle" fill="var(--text-primary)"
        fontSize="20" fontFamily="Cinzel, serif" fontWeight="700">{value}</text>
    </svg>
  );
}

// D8 — Octahedron face (diamond with number)
export function D8Display({ value, rolling }) {
  return (
    <svg className={`dice-svg d8${rolling ? ' dice-rolling' : ''}`} viewBox="0 0 60 60" width="48" height="48">
      <polygon points="30,2 58,30 30,58 2,30"
        fill="var(--bg-medium)" stroke="var(--accent-gold)" strokeWidth="1.5" />
      <text x="30" y="36" textAnchor="middle" fill="var(--text-primary)"
        fontSize="18" fontFamily="Cinzel, serif" fontWeight="700">{value}</text>
    </svg>
  );
}

// D12 — Dodecahedron face (pentagon with number)
export function D12Display({ value, rolling }) {
  // Regular pentagon points
  const cx = 30, cy = 30, r = 26;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 72 - 90) * Math.PI / 180;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <svg className={`dice-svg d12${rolling ? ' dice-rolling' : ''}`} viewBox="0 0 60 60" width="48" height="48">
      <polygon points={pts}
        fill="var(--bg-medium)" stroke="var(--accent-gold)" strokeWidth="1.5" />
      <text x="30" y="36" textAnchor="middle" fill="var(--text-primary)"
        fontSize="17" fontFamily="Cinzel, serif" fontWeight="700">{value}</text>
    </svg>
  );
}

// D20 — Icosahedron face (equilateral triangle with number)
export function D20Display({ value, rolling }) {
  return (
    <svg className={`dice-svg d20${rolling ? ' dice-rolling' : ''}`} viewBox="0 0 60 60" width="48" height="48">
      <polygon points="30,2 4,52 56,52"
        fill="var(--bg-medium)" stroke="var(--accent-gold)" strokeWidth="1.5" />
      <text x="30" y="40" textAnchor="middle" fill="var(--text-primary)"
        fontSize="16" fontFamily="Cinzel, serif" fontWeight="700">{value}</text>
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
