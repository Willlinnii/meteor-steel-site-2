import React, { useState, useMemo, useCallback } from 'react';
import { TRIGRAMS, HEXAGRAMS } from '../../data/ichingData';
import './IChingExplorerPage.css';

/*
 * Two traditional bagua arrangements:
 *
 * EARLIER HEAVEN (Fu Xi) — cosmological symmetry.
 * Each opposing pair is a binary complement.
 *     Heaven ☰ top ↔ Earth ☷ bottom
 *     Fire ☲ left   ↔ Water ☵ right
 *     Thunder ☳ BL  ↔ Wind ☴ TR-left
 *     Lake ☱ TR     ↔ Mountain ☶ BR
 *
 * LATER HEAVEN (King Wen) — compass directions, seasons, Shuo Gua.
 *     N: Water ☵    S: Fire ☲
 *     E: Thunder ☳  W: Lake ☱
 *     NW: Heaven ☰  SW: Earth ☷
 *     NE: Mountain ☶  SE: Wind ☴
 */

const EARLIER_HEAVEN = {
  Heaven: 270, Lake: 315, Water: 0, Mountain: 45,
  Earth: 90, Thunder: 135, Fire: 180, Wind: 225,
};

/* Later Heaven uses compass directions from the data; map direction → angle (N = top) */
const DIR_TO_ANGLE = {
  N: 270, NE: 315, E: 0, SE: 45,
  S: 90, SW: 135, W: 180, NW: 225,
};

const RADIUS = 140;
const CX = 200;
const CY = 200;

function polar(trigramName, direction, arrangement) {
  const deg = arrangement === 'earlier'
    ? EARLIER_HEAVEN[trigramName]
    : DIR_TO_ANGLE[direction];
  const a = (deg * Math.PI) / 180;
  return { x: CX + RADIUS * Math.cos(a), y: CY + RADIUS * Math.sin(a) };
}

/* ── Trigram line drawing (3 SVG rects, bottom→top) ────────── */
function TrigramLines({ lines, x, y, w = 28, h = 4, gap = 6, className = '' }) {
  // lines[0]=bottom, lines[2]=top — draw top-to-bottom visually
  return lines.slice().reverse().map((bit, i) => {
    const ly = y + i * (h + gap);
    if (bit === 1) {
      return <rect key={i} x={x - w / 2} y={ly} width={w} height={h} rx={1} className={className} />;
    }
    const segW = (w - 5) / 2;
    return (
      <g key={i}>
        <rect x={x - w / 2} y={ly} width={segW} height={h} rx={1} className={className} />
        <rect x={x - w / 2 + segW + 5} y={ly} width={segW} height={h} rx={1} className={className} />
      </g>
    );
  });
}

/* ── Bagua Compass (SVG) ───────────────────────────────────── */
function BaguaCompass({ arrangement, selectedTrigram, highlightedTrigrams, onSelectTrigram, onClear }) {
  const R = 110; // taijitu radius
  const isEarlier = arrangement === 'earlier';

  const compassLabels = [
    { label: 'N', x: CX, y: 30 },
    { label: 'S', x: CX, y: 385 },
    { label: 'E', x: 385, y: CY + 5 },
    { label: 'W', x: 15, y: CY + 5 },
  ];

  return (
    <svg className="iching-explorer-compass" viewBox="0 0 400 400" aria-label={`Bagua compass — ${isEarlier ? 'Earlier' : 'Later'} Heaven`}>
      <defs>
        <clipPath id="taijitu-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* Outer circle */}
      <circle cx={CX} cy={CY} r={175} fill="none" stroke="var(--border-subtle)" strokeWidth={1} />

      {/* Full-sized taijitu (yin-yang) */}
      <g className="iching-compass-taijitu" clipPath="url(#taijitu-clip)" onClick={onClear} role="button" aria-label="Clear selection" style={{ cursor: 'pointer' }}>
        {/* Base circle — yin (dark) */}
        <circle cx={CX} cy={CY} r={R} fill="rgba(230,225,210,0.06)" />
        {/* Yang (light) half — top */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} A ${R / 2} ${R / 2} 0 0 1 ${CX} ${CY} A ${R / 2} ${R / 2} 0 0 0 ${CX - R} ${CY} Z`}
          fill="rgba(230,225,210,0.18)"
        />
        {/* Small yin dot in yang half */}
        <circle cx={CX} cy={CY - R / 2} r={R * 0.12} fill="rgba(230,225,210,0.06)" />
        {/* Small yang dot in yin half */}
        <circle cx={CX} cy={CY + R / 2} r={R * 0.12} fill="rgba(230,225,210,0.18)" />
        {/* Outline */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border-subtle)" strokeWidth={0.75} />
      </g>

      {/* Compass direction labels — only in Later Heaven mode */}
      {!isEarlier && compassLabels.map(({ label, x, y }) => (
        <text key={label} x={x} y={y} textAnchor="middle" className="iching-compass-direction">{label}</text>
      ))}

      {/* 8 trigrams */}
      {TRIGRAMS.map(tri => {
        const pos = polar(tri.name, tri.direction, arrangement);
        const isSelected = selectedTrigram?.id === tri.id;
        const isHighlighted = highlightedTrigrams.has(tri.name);
        const cls = [
          'iching-compass-trigram-group',
          (isSelected || isHighlighted) ? 'iching-compass-selected' : '',
        ].join(' ');

        return (
          <g key={tri.id} className={cls} onClick={() => onSelectTrigram(tri)} role="button" tabIndex={0} aria-label={`${tri.name} trigram`}>
            <TrigramLines
              lines={tri.lines}
              x={pos.x}
              y={pos.y - 30}
              className="iching-compass-line-yang"
            />
            <text x={pos.x} y={pos.y + 10} textAnchor="middle" className="iching-compass-trigram-symbol">
              {tri.symbol}
            </text>
            <text x={pos.x} y={pos.y + 26} textAnchor="middle" className="iching-compass-trigram-name">
              {tri.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Trigram Detail ─────────────────────────────────────────── */
function TrigramDetail({ trigram }) {
  const fields = [
    ['Attribute', trigram.attr],
    ['Family', trigram.family],
    ['Direction', trigram.direction],
    ['Season', trigram.season],
    ['Body Part', trigram.bodyPart],
    ['Animal', trigram.animal],
  ];

  return (
    <div className="iching-explorer-trigram-detail">
      <div className="iching-explorer-trigram-header">
        <span className="iching-explorer-trigram-symbol">{trigram.symbol}</span>
        <div>
          <h2 className="iching-explorer-trigram-title">{trigram.name}</h2>
          <span className="iching-explorer-trigram-pinyin">{trigram.ch}</span>
        </div>
      </div>
      <div className="iching-explorer-trigram-fields">
        {fields.map(([label, val]) => (
          <React.Fragment key={label}>
            <span className="iching-explorer-trigram-label">{label}</span>
            <span className="iching-explorer-trigram-value">{val}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="iching-explorer-trigram-quality">{trigram.quality}</div>
    </div>
  );
}

/* ── Hexagram Detail ───────────────────────────────────────── */
function HexagramDetail({ hexagram }) {
  const lower = TRIGRAMS.find(t => t.name === hexagram.lo);
  const upper = TRIGRAMS.find(t => t.name === hexagram.up);

  // lines[0]=bottom → lines[5]=top; draw top-to-bottom
  const linesReversed = hexagram.lines.slice().reverse();

  return (
    <div className="iching-explorer-hex-detail">
      <div className="iching-explorer-hex-header">
        <span className="iching-explorer-hex-number">{hexagram.n}</span>
        <div>
          <h2 className="iching-explorer-hex-title">{hexagram.name}</h2>
          <span className="iching-explorer-hex-pinyin">{hexagram.ch}</span>
        </div>
      </div>

      <div className="iching-explorer-hex-trigrams-info">
        Upper: <span>{upper?.symbol} {hexagram.up}</span> &nbsp;·&nbsp; Lower: <span>{lower?.symbol} {hexagram.lo}</span>
      </div>

      {/* 6-line drawing */}
      <div className="iching-explorer-hex-drawing">
        {linesReversed.map((bit, i) => (
          bit === 1
            ? <div key={i} className="iching-explorer-hex-line iching-explorer-hex-line-yang" />
            : <div key={i} className="iching-explorer-hex-line iching-explorer-hex-line-yin"><span /><span /></div>
        ))}
      </div>

      <div className="iching-explorer-hex-section-label">Judgment</div>
      <div className="iching-explorer-hex-text">{hexagram.judgment}</div>

      <div className="iching-explorer-hex-section-label">Image</div>
      <div className="iching-explorer-hex-text">{hexagram.image}</div>
    </div>
  );
}

/* ── Hexagram Grid (8×8 table) ─────────────────────────────── */
function HexagramGrid({ hexByPair, selectedTrigram, selectedHexagram, onSelectTrigram, onSelectHexagram }) {
  // Column headers = upper trigrams, Row headers = lower trigrams
  // Use TRIGRAMS order as-is (by id 0-7)
  return (
    <div className="iching-explorer-grid-section">
      <div className="iching-explorer-grid-title">64 Hexagrams — Lower × Upper</div>
      <div className="iching-explorer-grid-scroll">
        <table className="iching-explorer-grid">
          <thead>
            <tr>
              <th className="iching-grid-corner" />
              <th className="iching-grid-corner" />
              <th colSpan={8} className="iching-grid-upper-label">Upper Trigram ↓</th>
            </tr>
            <tr>
              <th className="iching-grid-corner" />
              <th className="iching-grid-corner" />
              {TRIGRAMS.map(t => {
                const hl = selectedTrigram?.id === t.id || selectedHexagram?.up === t.name;
                return (
                  <th
                    key={t.id}
                    className={`iching-grid-header-cell ${hl ? 'iching-grid-header-highlight' : ''}`}
                    onClick={() => onSelectTrigram(t)}
                  >
                    {t.symbol}<br />{t.name}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TRIGRAMS.map((lo, ri) => {
              const rowHl = selectedTrigram?.id === lo.id || selectedHexagram?.lo === lo.name;
              return (
                <tr key={lo.id}>
                  {ri === 0 && <td rowSpan={8} className="iching-grid-lower-label">Lower Trigram →</td>}
                  <th
                    className={`iching-grid-header-cell ${rowHl ? 'iching-grid-header-highlight' : ''}`}
                    onClick={() => onSelectTrigram(lo)}
                  >
                    {lo.symbol} {lo.name}
                  </th>
                  {TRIGRAMS.map(up => {
                    const hex = hexByPair[lo.name]?.[up.name];
                    if (!hex) return <td key={up.id} className="iching-grid-cell">—</td>;
                    const isSel = selectedHexagram?.n === hex.n;
                    const isHl = !isSel && (selectedTrigram?.name === lo.name || selectedTrigram?.name === up.name);
                    const cls = [
                      'iching-grid-cell',
                      isSel ? 'iching-grid-cell-selected' : '',
                      isHl ? 'iching-grid-cell-highlight' : '',
                    ].join(' ');
                    return (
                      <td key={up.id} className={cls} onClick={() => onSelectHexagram(hex)} title={hex.name}>
                        {hex.n}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function IChingExplorerPage() {
  const [selectedTrigram, setSelectedTrigram] = useState(null);
  const [selectedHexagram, setSelectedHexagram] = useState(null);
  const [arrangement, setArrangement] = useState('earlier'); // 'earlier' | 'later'

  // Build lookup: hexByPair[lowerName][upperName] = hexagram
  const hexByPair = useMemo(() => {
    const map = {};
    HEXAGRAMS.forEach(h => {
      if (!map[h.lo]) map[h.lo] = {};
      map[h.lo][h.up] = h;
    });
    return map;
  }, []);

  // Set of trigram names to highlight on compass (from selected hexagram)
  const highlightedTrigrams = useMemo(() => {
    if (!selectedHexagram) return new Set();
    return new Set([selectedHexagram.lo, selectedHexagram.up]);
  }, [selectedHexagram]);

  const handleSelectTrigram = useCallback((tri) => {
    setSelectedTrigram(tri);
    setSelectedHexagram(null);
  }, []);

  const handleSelectHexagram = useCallback((hex) => {
    setSelectedHexagram(hex);
    setSelectedTrigram(null);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedTrigram(null);
    setSelectedHexagram(null);
  }, []);

  return (
    <div className="iching-explorer-page">
      <h1 className="iching-explorer-title">I Ching</h1>
      <p className="iching-explorer-subtitle">Book of Changes — 易經</p>

      <div className="iching-explorer-top">
        <div className="iching-explorer-compass-wrap">
          <div className="iching-explorer-arrangement-toggle">
            <button
              className={arrangement === 'earlier' ? 'iching-toggle-active' : ''}
              onClick={() => setArrangement('earlier')}
            >
              Cosmic Order
            </button>
            <button
              className={arrangement === 'later' ? 'iching-toggle-active' : ''}
              onClick={() => setArrangement('later')}
            >
              Compass
            </button>
          </div>
          <BaguaCompass
            arrangement={arrangement}
            selectedTrigram={selectedTrigram}
            highlightedTrigrams={highlightedTrigrams}
            onSelectTrigram={handleSelectTrigram}
            onClear={handleClear}
          />
          <div className="iching-explorer-arrangement-label">
            {arrangement === 'earlier'
              ? 'Fu Xi (先天) — opposing complements face each other'
              : 'King Wen (後天) — directions, seasons, elements'}
          </div>
        </div>

        <div className="iching-explorer-detail">
          {selectedHexagram ? (
            <HexagramDetail hexagram={selectedHexagram} />
          ) : selectedTrigram ? (
            <TrigramDetail trigram={selectedTrigram} />
          ) : (
            <div className="iching-explorer-detail-placeholder">
              Select a trigram on the compass or a hexagram in the grid below.
            </div>
          )}
        </div>
      </div>

      <HexagramGrid
        hexByPair={hexByPair}
        selectedTrigram={selectedTrigram}
        selectedHexagram={selectedHexagram}
        onSelectTrigram={handleSelectTrigram}
        onSelectHexagram={handleSelectHexagram}
      />
    </div>
  );
}
