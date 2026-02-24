import React from 'react';

/* ── Tree of Life constants ─────────────────────────────────── */

const SEPHIROTH_LAYOUT = [
  { sephira: 'Kether',    x: 50, y: 4  },
  { sephira: 'Binah',     x: 20, y: 18 },
  { sephira: 'Chokmah',   x: 80, y: 18 },
  { sephira: 'Geburah',   x: 20, y: 36 },
  { sephira: 'Chesed',    x: 80, y: 36 },
  { sephira: 'Tiphareth', x: 50, y: 50 },
  { sephira: 'Hod',       x: 20, y: 64 },
  { sephira: 'Netzach',   x: 80, y: 64 },
  { sephira: 'Yesod',     x: 50, y: 79 },
  { sephira: 'Malkuth',   x: 50, y: 95 },
];

// 22 paths of the Tree (Golden Dawn attribution)
const TREE_PATHS = [
  ['Kether', 'Chokmah'], ['Kether', 'Binah'], ['Kether', 'Tiphareth'],
  ['Chokmah', 'Binah'], ['Chokmah', 'Tiphareth'], ['Chokmah', 'Chesed'],
  ['Binah', 'Tiphareth'], ['Binah', 'Geburah'],
  ['Chesed', 'Geburah'], ['Chesed', 'Tiphareth'], ['Chesed', 'Netzach'],
  ['Geburah', 'Tiphareth'], ['Geburah', 'Hod'],
  ['Tiphareth', 'Netzach'], ['Tiphareth', 'Hod'], ['Tiphareth', 'Yesod'],
  ['Netzach', 'Hod'], ['Netzach', 'Yesod'], ['Netzach', 'Malkuth'],
  ['Hod', 'Yesod'], ['Hod', 'Malkuth'],
  ['Yesod', 'Malkuth'],
];

const POS_MAP = {};
SEPHIROTH_LAYOUT.forEach(s => { POS_MAP[s.sephira] = s; });

/* ── Order badge (shared) ───────────────────────────────────── */

function OrderBadge({ orderLabel }) {
  if (!orderLabel) return null;
  return <span className="column-sequence-order">ORDER — {orderLabel}</span>;
}

/* ── Tree of Life renderer ──────────────────────────────────── */

function TreeOfLifeLayout({ columnLabel, traditionName, sequence, activePlanet, onClose, orderLabel }) {
  const seqMap = {};
  sequence.forEach(item => {
    const name = item.key.split(' \u2014 ')[0].trim();
    seqMap[name] = item;
  });

  return (
    <div className="column-sequence-overlay" onClick={onClose}>
      <div className="tol-popup" onClick={e => e.stopPropagation()}>
        <div className="column-sequence-header">
          <div>
            <h4 className="column-sequence-title">{columnLabel}</h4>
            <p className="column-sequence-tradition">{traditionName} — Tree of Life</p>
            <OrderBadge orderLabel={orderLabel} />
          </div>
          <button className="column-sequence-close" onClick={onClose} title="Close">&times;</button>
        </div>
        <div className="tol-container">
          {/* Pillar labels */}
          <span className="tol-pillar" style={{ left: '20%' }}>Severity</span>
          <span className="tol-pillar" style={{ left: '50%' }}>Equilibrium</span>
          <span className="tol-pillar" style={{ left: '80%' }}>Mercy</span>

          {/* 22 connecting paths */}
          <svg className="tol-paths">
            {TREE_PATHS.map(([from, to], i) => {
              const a = POS_MAP[from];
              const b = POS_MAP[to];
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                />
              );
            })}
          </svg>

          {/* Sephiroth nodes */}
          {SEPHIROTH_LAYOUT.map(({ sephira, x, y }) => {
            const item = seqMap[sephira];
            if (!item) return null;
            const isActive = item.classicalPlanet === activePlanet;
            const meaning = item.key.split(' \u2014 ')[1] || '';
            const planet = item.classicalPlanet;
            return (
              <div
                key={sephira}
                className={`tol-node${isActive ? ' active' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span className="tol-name">{sephira}</span>
                {meaning && <span className="tol-meaning">{meaning}</span>}
                {planet && <span className="tol-planet">{planet}</span>}
                <span className="tol-value">
                  {item.value != null && item.value !== '' ? String(item.value) : '\u2014'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Standard linear popup ──────────────────────────────────── */

export default function ColumnSequencePopup({ columnKey, columnLabel, traditionName, sequence, activePlanet, onClose, perspectiveId, orderLabel, displayReversed }) {
  if (perspectiveId === 'kabbalah') {
    return (
      <TreeOfLifeLayout
        columnLabel={columnLabel}
        traditionName={traditionName}
        sequence={sequence}
        activePlanet={activePlanet}
        onClose={onClose}
        orderLabel={orderLabel}
      />
    );
  }

  // Earthly at bottom, divine/monad at top
  const displaySequence = displayReversed ? [...sequence].reverse() : sequence;

  return (
    <div className="column-sequence-overlay" onClick={onClose}>
      <div className="column-sequence-popup" onClick={e => e.stopPropagation()}>
        <div className="column-sequence-header">
          <div>
            <h4 className="column-sequence-title">{columnLabel}</h4>
            <p className="column-sequence-tradition">{traditionName}</p>
            <OrderBadge orderLabel={orderLabel} />
          </div>
          <button className="column-sequence-close" onClick={onClose} title="Close">&times;</button>
        </div>
        <div className="column-sequence-body">
          {displaySequence.map(item => {
            const planetLabel = item.classicalPlanet
              ? `${item.key} (${item.classicalPlanet})`
              : item.key;
            const isActive = item.key === activePlanet ||
              item.classicalPlanet === activePlanet;
            return (
              <div
                key={item.key}
                className={`column-sequence-row${isActive ? ' active' : ''}`}
              >
                <span className="column-sequence-planet">{planetLabel}</span>
                <span className="column-sequence-value">
                  {item.value != null && item.value !== '' ? item.value : '\u2014'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
