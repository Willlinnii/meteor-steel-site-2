import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  TRIGRAMS, HEXAGRAMS, lookupHexagram,
  nuclearTrigrams, hexagramComplement, hexagramInverse,
  fuxiNumber, kingWenPair, trigramComplement,
} from '../../data/ichingData';
import './IChingExplorerPage.css';

/* ── Glossary definitions ─────────────────────────────────────── */
const GLOSSARY = {
  'Attribute':     'The core quality or archetype this trigram embodies — its essential nature in the I Ching system.',
  'Family':        'Position in the trigram family. Father (Heaven) and Mother (Earth) produce three sons and three daughters by changing one line.',
  'Direction':     'Compass direction assigned in the Later Heaven (King Wen) arrangement, linking trigrams to spatial orientation and feng shui.',
  'Season':        'Season or seasonal phase associated with this trigram in the annual cycle.',
  'Body Part':     'Part of the human body corresponding to this trigram, from the Shuo Gua (Discussion of the Trigrams).',
  'Animal':        'Animal symbol for this trigram from the Shuo Gua tradition.',
  'Complement':    'The opposite hexagram formed by flipping every line: yang becomes yin and yin becomes yang. Chinese: cuò guà 錯卦.',
  'Nuclear':       'The hidden inner hexagram. Lines 2-3-4 form the lower nuclear trigram and lines 3-4-5 form the upper, revealing the latent situation within.',
  'Inverse':       'The hexagram formed by turning this one upside down — reversing the line order. Chinese: zōng guà 綜卦. Eight hexagrams are self-inverse.',
  'King Wen Pair': 'The paired hexagram in the King Wen sequence. Most pairs are inverses; the eight self-inverse hexagrams pair with their complements instead.',
  'Fu Xi #':       'Binary number in the Fu Xi (Earlier Heaven) sequence. Top line = most significant bit, bottom = least. Ranges from 0 (all yin) to 63 (all yang).',
  'King Wen #':    'Position in the traditional King Wen sequence (1-64), the standard ordering used since the Zhou dynasty.',
  'Upper':         'The upper trigram (lines 4-5-6). Represents the outer situation, the visible, or the direction of movement.',
  'Lower':         'The lower trigram (lines 1-2-3). Represents the inner situation, the hidden foundation, or the starting condition.',
};

/* ── TermLabel — clickable glossary popover ────────────────────── */
function TermLabel({ term, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const desc = GLOSSARY[term];
  if (!desc) return <span className={className}>{term}</span>;

  return (
    <span className={`iching-term-wrap ${className || ''}`} ref={ref}>
      <button
        className={`iching-term-btn ${className || ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {term}
      </button>
      {open && (
        <span className="iching-term-popover">
          <span className="iching-term-popover-title">{term}</span>
          {desc}
        </span>
      )}
    </span>
  );
}

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

/* ── Bagua Compass (SVG) ───────────────────────────────────── */
function BaguaCompass({ arrangement, selectedTrigram, highlightedTrigrams, onSelectTrigram, onClear, spinning }) {
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
      <g className={`iching-compass-taijitu${spinning ? ' iching-compass-spinning' : ''}`} clipPath="url(#taijitu-clip)" onClick={onClear} role="button" aria-label="Clear selection" style={{ cursor: 'pointer' }}>
        {/* Base circle — yin (dark, right side) */}
        <circle cx={CX} cy={CY} r={R} fill="rgba(230,225,210,0.06)" />
        {/* Yang (light) half — left side, head at top.
            Standard orientation: yang rises on the left (Fire/Li side),
            matures at top, yin descends on the right (Water/Kan side). */}
        <path
          d={`M ${CX} ${CY - R} A ${R} ${R} 0 0 0 ${CX} ${CY + R} A ${R / 2} ${R / 2} 0 0 0 ${CX} ${CY} A ${R / 2} ${R / 2} 0 0 1 ${CX} ${CY - R} Z`}
          fill="rgba(230,225,210,0.18)"
        />
        {/* Small yin dot in yang head (upper) */}
        <circle cx={CX} cy={CY - R / 2} r={R * 0.12} fill="rgba(230,225,210,0.06)" />
        {/* Small yang dot in yin head (lower) */}
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
            <text x={pos.x} y={pos.y} textAnchor="middle" className="iching-compass-trigram-symbol">
              {tri.symbol}
            </text>
            <text x={pos.x} y={pos.y + 16} textAnchor="middle" className="iching-compass-trigram-name">
              {tri.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Line Drawing (shared helper) ──────────────────────────── */
function LineDrawing({ lines, className }) {
  const reversed = lines.slice().reverse();
  return (
    <div className={className || 'iching-explorer-hex-drawing'}>
      {reversed.map((bit, i) => (
        bit === 1
          ? <div key={i} className="iching-explorer-hex-line iching-explorer-hex-line-yang" />
          : <div key={i} className="iching-explorer-hex-line iching-explorer-hex-line-yin"><span /><span /></div>
      ))}
    </div>
  );
}

/* ── Trigram Oracle Content ────────────────────────────────── */
function TrigramOracleContent({ trigram }) {
  return (
    <div className="iching-explorer-trigram-detail">
      <div className="iching-explorer-trigram-header">
        <span className="iching-explorer-trigram-symbol">{trigram.symbol}</span>
        <div>
          <h2 className="iching-explorer-trigram-title">{trigram.name}</h2>
          <span className="iching-explorer-trigram-pinyin">{trigram.ch}</span>
        </div>
      </div>
      <div className="iching-explorer-trigram-quality">{trigram.quality}</div>
    </div>
  );
}

/* ── Trigram Info Content ──────────────────────────────────── */
function TrigramInfoContent({ trigram, onSelectTrigram }) {
  const complement = trigramComplement(trigram);
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
            <TermLabel term={label} className="iching-explorer-trigram-label" />
            <span className="iching-explorer-trigram-value">{val}</span>
          </React.Fragment>
        ))}
      </div>
      <LineDrawing lines={trigram.lines} className="iching-explorer-trigram-drawing" />
      <div className="iching-explorer-trigram-complement">
        <TermLabel term="Complement" className="iching-explorer-trigram-label" />
        <button className="iching-explorer-link-btn" onClick={() => onSelectTrigram(complement)}>
          {complement.symbol} {complement.name}
        </button>
      </div>
    </div>
  );
}

/* ── Hexagram Oracle Content ──────────────────────────────── */
function HexagramOracleContent({ hexagram }) {
  return (
    <div className="iching-explorer-hex-detail">
      <div className="iching-explorer-hex-header">
        <span className="iching-explorer-hex-number">{hexagram.n}</span>
        <div>
          <h2 className="iching-explorer-hex-title">{hexagram.name}</h2>
          <span className="iching-explorer-hex-pinyin">{hexagram.ch}</span>
        </div>
      </div>

      <div className="iching-explorer-hex-section-label">Judgment</div>
      <div className="iching-explorer-hex-text">{hexagram.judgment}</div>

      <div className="iching-explorer-hex-section-label">Image</div>
      <div className="iching-explorer-hex-text">{hexagram.image}</div>

      {hexagram.lineTexts && (
        <>
          <div className="iching-explorer-hex-section-label">
            Lines<span className="iching-explorer-chinese-label">yáo cí 爻辭</span>
          </div>
          <div className="iching-explorer-hex-lines-list">
            {hexagram.lineTexts.map((text, i) => (
              <div key={i} className="iching-explorer-hex-line-text">
                <span className="iching-explorer-hex-line-num">{i + 1}</span>
                <span className={`iching-explorer-hex-line-indicator ${hexagram.lines[i] === 1 ? 'yang' : 'yin'}`}>
                  {hexagram.lines[i] === 1 ? '━' : '╌'}
                </span>
                <span className="iching-explorer-hex-line-body">{text}</span>
              </div>
            ))}
          </div>
          {hexagram.allLines && (
            <div className="iching-explorer-hex-all-lines">{hexagram.allLines}</div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Hexagram Info Content ────────────────────────────────── */
function HexagramInfoContent({ hexagram, onSelectHexagram }) {
  const lower = TRIGRAMS.find(t => t.name === hexagram.lo);
  const upper = TRIGRAMS.find(t => t.name === hexagram.up);

  const nuclear = nuclearTrigrams(hexagram.lines);
  const complement = hexagramComplement(hexagram.lines);
  const inverse = hexagramInverse(hexagram.lines);
  const isSelfInverse = inverse.n === hexagram.n;
  const pair = kingWenPair(hexagram);
  const fuxi = fuxiNumber(hexagram.lines);

  const structureFields = [
    ['King Wen #', hexagram.n],
    ['Upper', `${upper?.symbol || ''} ${hexagram.up}`],
    ['Lower', `${lower?.symbol || ''} ${hexagram.lo}`],
  ];

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
        Upper: <span>{upper?.symbol} {hexagram.up}</span>
        {upper && <> — {upper.attr}, {upper.family}, {upper.season}</>}
        &nbsp;&middot;&nbsp;
        Lower: <span>{lower?.symbol} {hexagram.lo}</span>
        {lower && <> — {lower.attr}, {lower.family}, {lower.season}</>}
      </div>

      <LineDrawing lines={hexagram.lines} />

      <div className="iching-explorer-hex-structure-grid">
        {structureFields.map(([label, val]) => (
          <React.Fragment key={label}>
            <TermLabel term={label} className="iching-explorer-trigram-label" />
            <span className="iching-explorer-trigram-value">{val}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="iching-explorer-relationships">
        <div className="iching-explorer-relationships-title">Structural Relationships</div>
        <div className="iching-explorer-relationships-grid">
          <TermLabel term="Nuclear" className="iching-explorer-trigram-label" />
          <span className="iching-explorer-trigram-value">
            {nuclear.lower.symbol} {nuclear.lower.attr} / {nuclear.upper.symbol} {nuclear.upper.attr}
            {nuclear.hexagram && (
              <> → <button className="iching-explorer-link-btn" onClick={() => onSelectHexagram(nuclear.hexagram)}>
                #{nuclear.hexagram.n} {nuclear.hexagram.name}
              </button></>
            )}
          </span>

          <TermLabel term="Complement" className="iching-explorer-trigram-label" />
          <span className="iching-explorer-trigram-value">
            <button className="iching-explorer-link-btn" onClick={() => onSelectHexagram(complement)}>
              #{complement.n} {complement.name}
            </button>
            <span className="iching-explorer-chinese-label">cuò guà 錯卦</span>
          </span>

          <TermLabel term="Inverse" className="iching-explorer-trigram-label" />
          <span className="iching-explorer-trigram-value">
            {isSelfInverse ? (
              <span className="iching-explorer-self-label">self-inverse</span>
            ) : (
              <button className="iching-explorer-link-btn" onClick={() => onSelectHexagram(inverse)}>
                #{inverse.n} {inverse.name}
              </button>
            )}
            <span className="iching-explorer-chinese-label">zōng guà 綜卦</span>
          </span>

          <TermLabel term="King Wen Pair" className="iching-explorer-trigram-label" />
          <span className="iching-explorer-trigram-value">
            <button className="iching-explorer-link-btn" onClick={() => onSelectHexagram(pair)}>
              #{pair.n} {pair.name}
            </button>
          </span>

          <TermLabel term="Fu Xi #" className="iching-explorer-trigram-label" />
          <span className="iching-explorer-trigram-value">
            {fuxi.decimal} ({fuxi.binary})
          </span>
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState('oracle');
  const [spinning, setSpinning] = useState(false);

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

  const detailKey = selectedHexagram
    ? `hex-${selectedHexagram.n}-${activeTab}`
    : selectedTrigram
    ? `tri-${selectedTrigram.id}-${activeTab}`
    : `empty-${activeTab}`;

  return (
    <div className="iching-explorer-page">
      <div className="iching-explorer-heading">
        <h1 className="iching-explorer-title">I Ching</h1>
        <span className="iching-explorer-sub">Book of Changes — 易經</span>
      </div>

      <div className="iching-explorer-diagram-center">
        <div className="iching-explorer-compass-wrap">
          <BaguaCompass
            arrangement={arrangement}
            selectedTrigram={selectedTrigram}
            highlightedTrigrams={highlightedTrigrams}
            onSelectTrigram={handleSelectTrigram}
            onClear={handleClear}
            spinning={spinning}
          />
          <div className="iching-explorer-arrangement-controls">
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
              <button
                className={`iching-spin-btn${spinning ? ' iching-spin-active' : ''}`}
                onClick={() => setSpinning(s => !s)}
                aria-label={spinning ? 'Stop spinning' : 'Spin'}
              >
                {spinning ? '◼' : '☯'}
              </button>
            </div>
            <div className="iching-explorer-arrangement-label">
              {arrangement === 'earlier'
                ? 'Fu Xi (先天) — opposing complements face each other'
                : 'King Wen (後天) — directions, seasons, elements'}
            </div>
          </div>
        </div>
      </div>

      <div className="iching-explorer-tabs">
        <button
          className={`iching-tab${activeTab === 'oracle' ? ' active' : ''}`}
          onClick={() => setActiveTab('oracle')}
        >
          Oracle
        </button>
        <button
          className={`iching-tab${activeTab === 'info' ? ' active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Informational
        </button>
      </div>

      <div className="iching-explorer-content-fade" key={detailKey}>
        {selectedHexagram ? (
          activeTab === 'oracle'
            ? <HexagramOracleContent hexagram={selectedHexagram} />
            : <HexagramInfoContent hexagram={selectedHexagram} onSelectHexagram={handleSelectHexagram} />
        ) : selectedTrigram ? (
          activeTab === 'oracle'
            ? <TrigramOracleContent trigram={selectedTrigram} />
            : <TrigramInfoContent trigram={selectedTrigram} onSelectTrigram={handleSelectTrigram} />
        ) : activeTab === 'oracle' ? (
          <div className="iching-explorer-detail-placeholder">
            Select a trigram on the compass or a hexagram in the grid below.
          </div>
        ) : (
          <div className="iching-explorer-detail-placeholder iching-explorer-info-intro">
            <p>
              The I Ching (易經) is one of the oldest texts in continuous use, originating over three thousand
              years ago in the Zhou dynasty. Its sixty-four hexagrams model every situation as a combination
              of two trigrams — eight fundamental patterns of change drawn from natural forces.
            </p>
            <p>
              Each trigram consists of three lines, either solid (yang) or broken (yin). Stacked in pairs,
              these produce the sixty-four hexagrams that map the full cycle of transformation. Select any
              trigram or hexagram to explore its structural attributes, correspondences, and line composition.
            </p>
          </div>
        )}
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
