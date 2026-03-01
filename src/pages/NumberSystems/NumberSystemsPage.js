import React, { useState, useMemo, useCallback } from 'react';
import {
  TRADITIONS,
  ALL_ENTRIES,
  entriesForNumber,
  entriesForTradition,
} from '../../data/numberSystemsIndex';
import './NumberSystemsPage.css';

/* ─── range presets ─── */
const RANGE_PRESETS = [
  { label: '1–10', lo: 1, hi: 10 },
  { label: '0–21', lo: 0, hi: 21 },
  { label: '1–64', lo: 1, hi: 64 },
  { label: 'All',  lo: -Infinity, hi: Infinity },
];

/* ─── unique sorted numbers across all entries ─── */
const ALL_NUMBERS = [...new Set(ALL_ENTRIES.map(e => e.number))].sort((a, b) => a - b);

/* ─── tradition-specific detail renderers ─── */

function DetailEarthCount({ detail }) {
  return (
    <>
      {detail.dir && (
        <div className="numbers-detail-fields">
          <span className="numbers-detail-label">Direction</span>
          <span className="numbers-detail-value">{detail.dir}</span>
          {detail.sublabel && <>
            <span className="numbers-detail-label">Sublabel</span>
            <span className="numbers-detail-value">{detail.sublabel}</span>
          </>}
          {detail.pages && <>
            <span className="numbers-detail-label">Pages</span>
            <span className="numbers-detail-value">{detail.pages.join(', ')}</span>
          </>}
        </div>
      )}
      {detail.teaching && <div className="numbers-detail-teaching">{detail.teaching}</div>}
    </>
  );
}

function DetailPythagorean({ detail }) {
  return (
    <>
      <div className="numbers-detail-fields">
        <span className="numbers-detail-label">Greek Name</span>
        <span className="numbers-detail-value">{detail.greekName}</span>
        <span className="numbers-detail-label">Principle</span>
        <span className="numbers-detail-value">{detail.principle}</span>
        {detail.epithets && <>
          <span className="numbers-detail-label">Epithets</span>
          <span className="numbers-detail-value">{detail.epithets.join(', ')}</span>
        </>}
        <span className="numbers-detail-label">Geometry</span>
        <span className="numbers-detail-value">{detail.geometry}</span>
        <span className="numbers-detail-label">Properties</span>
        <span className="numbers-detail-value">{detail.properties}</span>
      </div>
      {detail.teaching && <div className="numbers-detail-teaching">{detail.teaching}</div>}
    </>
  );
}

function DetailKabbalah({ detail }) {
  return (
    <>
      <div className="numbers-detail-fields">
        <span className="numbers-detail-label">Meaning</span>
        <span className="numbers-detail-value">{detail.meaning}</span>
        <span className="numbers-detail-label">Pillar</span>
        <span className="numbers-detail-value">{detail.pillar}</span>
        {detail.classicalPlanet && <>
          <span className="numbers-detail-label">Planet</span>
          <span className="numbers-detail-value">{detail.classicalPlanet}</span>
        </>}
        {detail.metal && <>
          <span className="numbers-detail-label">Metal</span>
          <span className="numbers-detail-value">{detail.metal}</span>
        </>}
        <span className="numbers-detail-label">Angel</span>
        <span className="numbers-detail-value">{detail.angel}</span>
        <span className="numbers-detail-label">Divine Name</span>
        <span className="numbers-detail-value">{detail.divineNameTetragrammaton}</span>
        <span className="numbers-detail-label">Color</span>
        <span className="numbers-detail-value">{detail.color}</span>
        <span className="numbers-detail-label">Body</span>
        <span className="numbers-detail-value">{detail.bodyCorrespondence}</span>
      </div>
      {detail.teaching && <div className="numbers-detail-teaching">{detail.teaching}</div>}
    </>
  );
}

function DetailTarot({ detail }) {
  return (
    <>
      <div className="numbers-detail-fields">
        <span className="numbers-detail-label">Card</span>
        <span className="numbers-detail-value">{detail.cardName} ({detail.romanNumeral})</span>
        {detail.classicalPlanet && <>
          <span className="numbers-detail-label">Planet</span>
          <span className="numbers-detail-value">{detail.classicalPlanet}</span>
        </>}
        {detail.zodiacSign && <>
          <span className="numbers-detail-label">Zodiac</span>
          <span className="numbers-detail-value">{detail.zodiacSign}</span>
        </>}
        {detail.element && <>
          <span className="numbers-detail-label">Element</span>
          <span className="numbers-detail-value">{detail.element}</span>
        </>}
        {detail.metal && <>
          <span className="numbers-detail-label">Metal</span>
          <span className="numbers-detail-value">{detail.metal}</span>
        </>}
        <span className="numbers-detail-label">Hebrew Letter</span>
        <span className="numbers-detail-value">{detail.hebrewLetter}</span>
        <span className="numbers-detail-label">Tree Path</span>
        <span className="numbers-detail-value">{detail.treePath}</span>
        <span className="numbers-detail-label">Esoteric Title</span>
        <span className="numbers-detail-value">{detail.esotericTitle}</span>
      </div>
      {detail.overview && <div className="numbers-detail-teaching">{detail.overview}</div>}
    </>
  );
}

function DetailTrigram({ detail }) {
  return (
    <>
      <div className="numbers-detail-fields">
        <span className="numbers-detail-label">Symbol</span>
        <span className="numbers-detail-value">{detail.symbol} {detail.ch}</span>
        <span className="numbers-detail-label">Attribute</span>
        <span className="numbers-detail-value">{detail.attr}</span>
        <span className="numbers-detail-label">Family</span>
        <span className="numbers-detail-value">{detail.family}</span>
        <span className="numbers-detail-label">Direction</span>
        <span className="numbers-detail-value">{detail.direction}</span>
        <span className="numbers-detail-label">Season</span>
        <span className="numbers-detail-value">{detail.season}</span>
        <span className="numbers-detail-label">Body Part</span>
        <span className="numbers-detail-value">{detail.bodyPart}</span>
        <span className="numbers-detail-label">Animal</span>
        <span className="numbers-detail-value">{detail.animal}</span>
      </div>
      {detail.quality && <div className="numbers-detail-teaching">{detail.quality}</div>}
    </>
  );
}

function DetailHexagram({ detail }) {
  return (
    <>
      <div className="numbers-detail-fields">
        <span className="numbers-detail-label">Chinese</span>
        <span className="numbers-detail-value">{detail.ch}</span>
        <span className="numbers-detail-label">Upper</span>
        <span className="numbers-detail-value">{detail.up}</span>
        <span className="numbers-detail-label">Lower</span>
        <span className="numbers-detail-value">{detail.lo}</span>
        <span className="numbers-detail-label">Judgment</span>
        <span className="numbers-detail-value">{detail.judgment}</span>
      </div>
      {detail.image && <div className="numbers-detail-teaching">{detail.image}</div>}
    </>
  );
}

function DetailNumerology({ detail }) {
  return (
    <div className="numbers-detail-teaching">{detail.meaning}</div>
  );
}

const DETAIL_RENDERERS = {
  'earth-count': DetailEarthCount,
  'pythagorean-decad': DetailPythagorean,
  'kabbalah': DetailKabbalah,
  'tarot': DetailTarot,
  'iching-trigrams': DetailTrigram,
  'iching-hexagrams': DetailHexagram,
  'numerology': DetailNumerology,
};

function EntryDetail({ entry, onClose }) {
  const Renderer = DETAIL_RENDERERS[entry.tradition];
  return (
    <div className="numbers-detail">
      <div className="numbers-detail-header">
        <div>
          <h3 className="numbers-detail-title">{entry.name}</h3>
          <div className="numbers-detail-tradition">{entry.traditionLabel} — #{entry.number}</div>
        </div>
        {onClose && <button className="numbers-detail-close" onClick={onClose}>✕</button>}
      </div>
      <div className="numbers-detail-summary">{entry.summary}</div>
      {Renderer && <Renderer detail={entry.detail} />}
    </div>
  );
}

/* ─── number popup ─── */

function NumberPopup({ number, onClose }) {
  const entries = useMemo(() => entriesForNumber(number), [number]);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="numbers-popup-overlay" onClick={onClose}>
      <div className="numbers-popup" onClick={e => e.stopPropagation()}>
        <div className="numbers-popup-header">
          <span className="numbers-popup-number">Number {number}</span>
          <button className="numbers-popup-close" onClick={onClose}>✕</button>
        </div>
        <div className="numbers-popup-entries">
          {entries.length === 0 && (
            <p className="numbers-popup-empty">No traditions cover this number.</p>
          )}
          {entries.map(entry => (
            <div key={entry.tradition} className="numbers-popup-entry">
              <div className="numbers-popup-entry-header">
                <span className="numbers-popup-entry-name">{entry.name}</span>
                <span className="numbers-popup-entry-tradition">{entry.traditionLabel}</span>
              </div>
              <div className="numbers-popup-entry-summary">{entry.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─── */

export default function NumberSystemsPage() {
  const [view, setView] = useState('table');            // table | byNumber | byTradition
  const [range, setRange] = useState(RANGE_PRESETS[0]); // default 1-10
  const [hiddenTraditions, setHiddenTraditions] = useState(new Set());
  const [selectedKey, setSelectedKey] = useState(null);  // "tradition:number" for table
  const [expandedCard, setExpandedCard] = useState(null); // index for card views
  const [pickedNumber, setPickedNumber] = useState(1);
  const [pickedTradition, setPickedTradition] = useState(TRADITIONS[0].id);
  const [popupNumber, setPopupNumber] = useState(null);
  const [isMobile] = useState(() => window.innerWidth < 600);

  const toggleTradition = useCallback((id) => {
    setHiddenTraditions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const visibleTraditions = useMemo(
    () => TRADITIONS.filter(t => !hiddenTraditions.has(t.id)),
    [hiddenTraditions]
  );

  // Numbers in the active range
  const numbersInRange = useMemo(
    () => ALL_NUMBERS.filter(n => n >= range.lo && n <= range.hi),
    [range]
  );

  // Build table data: for each number, map each visible tradition
  const tableData = useMemo(() => {
    // Pre-index entries by number+tradition for O(1) lookup
    const idx = {};
    ALL_ENTRIES.forEach(e => { idx[`${e.tradition}:${e.number}`] = e; });
    return numbersInRange.map(n => ({
      number: n,
      cells: visibleTraditions.map(t => idx[`${t.id}:${n}`] || null),
    }));
  }, [numbersInRange, visibleTraditions]);

  const selectedEntry = useMemo(() => {
    if (!selectedKey) return null;
    return ALL_ENTRIES.find(e => `${e.tradition}:${e.number}` === selectedKey) || null;
  }, [selectedKey]);

  // By-number entries
  const byNumberEntries = useMemo(
    () => entriesForNumber(pickedNumber).filter(e => !hiddenTraditions.has(e.tradition)),
    [pickedNumber, hiddenTraditions]
  );

  // By-tradition entries
  const byTraditionEntries = useMemo(
    () => entriesForTradition(pickedTradition).filter(e => e.number >= range.lo && e.number <= range.hi),
    [pickedTradition, range]
  );

  // Numbers that have at least one entry (for By Number picker)
  const numbersWithEntries = useMemo(() => {
    const s = new Set(ALL_ENTRIES.filter(e => !hiddenTraditions.has(e.tradition)).map(e => e.number));
    return s;
  }, [hiddenTraditions]);

  const effectiveView = (isMobile && view === 'table') ? 'byNumber' : view;

  return (
    <div className="numbers-page">
      <h1 className="numbers-heading">Number Systems</h1>
      <p className="numbers-subtitle">Browse and compare number symbolism across traditions</p>

      {/* ── Controls ── */}
      <div className="numbers-controls">
        {/* View toggle */}
        <div className="numbers-control-group">
          <span className="numbers-control-label">View</span>
          {['table', 'byNumber', 'byTradition'].map(v => (
            <button
              key={v}
              className={`numbers-toggle-btn ${view === v ? 'active' : ''}`}
              onClick={() => { setView(v); setSelectedKey(null); setExpandedCard(null); }}
            >
              {v === 'table' ? 'Table' : v === 'byNumber' ? 'By Number' : 'By Tradition'}
            </button>
          ))}
        </div>

        {/* Range presets */}
        <div className="numbers-control-group">
          <span className="numbers-control-label">Range</span>
          {RANGE_PRESETS.map(rp => (
            <button
              key={rp.label}
              className={`numbers-toggle-btn ${range === rp ? 'active' : ''}`}
              onClick={() => { setRange(rp); setSelectedKey(null); setExpandedCard(null); }}
            >
              {rp.label}
            </button>
          ))}
        </div>

        {/* Tradition filter */}
        <div className="numbers-control-group">
          <span className="numbers-control-label">Traditions</span>
          {TRADITIONS.map(t => (
            <button
              key={t.id}
              className={`numbers-toggle-btn ${hiddenTraditions.has(t.id) ? 'trad-off' : 'active'}`}
              onClick={() => toggleTradition(t.id)}
              title={t.label}
            >
              {t.label.split('(')[0].split(' ').slice(0, 2).join(' ').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {effectiveView === 'table' && (
        <>
          <div className="numbers-table-wrap">
            <table className="numbers-table">
              <thead>
                <tr>
                  <th>#</th>
                  {visibleTraditions.map(t => <th key={t.id}>{t.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.number}>
                    <td className="numbers-row-num" onClick={() => setPopupNumber(row.number)}>{row.number}</td>
                    {row.cells.map((entry, ci) => (
                      <td key={visibleTraditions[ci].id}>
                        {entry ? (
                          <div
                            className={`numbers-cell ${selectedKey === `${entry.tradition}:${entry.number}` ? 'selected' : ''}`}
                            onClick={() => setSelectedKey(
                              selectedKey === `${entry.tradition}:${entry.number}` ? null : `${entry.tradition}:${entry.number}`
                            )}
                          >
                            {entry.name}
                          </div>
                        ) : (
                          <div className="numbers-cell-empty">—</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedEntry && (
            <EntryDetail entry={selectedEntry} onClose={() => setSelectedKey(null)} />
          )}
        </>
      )}

      {/* ── BY NUMBER VIEW ── */}
      {effectiveView === 'byNumber' && (
        <>
          <div className="numbers-picker">
            {numbersInRange.map(n => (
              <button
                key={n}
                className={`numbers-picker-btn ${pickedNumber === n ? 'active' : ''} ${numbersWithEntries.has(n) ? 'has-entries' : ''}`}
                onClick={() => { setPickedNumber(n); setExpandedCard(null); }}
              >
                {n}
              </button>
            ))}
          </div>
          <h2 className="numbers-group-header" style={{ cursor: 'pointer' }} onClick={() => setPopupNumber(pickedNumber)}>Number {pickedNumber}</h2>
          <div className="numbers-cards">
            {byNumberEntries.length === 0 && (
              <p style={{ color: 'var(--np-text-dim)', textAlign: 'center' }}>No entries for this number in active traditions.</p>
            )}
            {byNumberEntries.map((entry, i) => (
              <div
                key={`${entry.tradition}:${entry.number}`}
                className={`numbers-card ${expandedCard === i ? 'expanded' : ''}`}
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              >
                <div className="numbers-card-header">
                  <span className="numbers-card-name">{entry.name}</span>
                </div>
                <div className="numbers-card-tradition">{entry.traditionLabel}</div>
                <div className="numbers-card-summary">{entry.summary}</div>
                {expandedCard === i && (
                  <div className="numbers-card-body">
                    <EntryDetail entry={entry} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── BY TRADITION VIEW ── */}
      {effectiveView === 'byTradition' && (
        <>
          <div className="numbers-picker">
            {TRADITIONS.map(t => (
              <button
                key={t.id}
                className={`numbers-picker-btn ${pickedTradition === t.id ? 'active' : ''}`}
                onClick={() => { setPickedTradition(t.id); setExpandedCard(null); }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <h2 className="numbers-group-header">
            {TRADITIONS.find(t => t.id === pickedTradition)?.label}
          </h2>
          <div className="numbers-cards">
            {byTraditionEntries.length === 0 && (
              <p style={{ color: 'var(--np-text-dim)', textAlign: 'center' }}>No entries in this range.</p>
            )}
            {byTraditionEntries.map((entry, i) => (
              <div
                key={`${entry.tradition}:${entry.number}`}
                className={`numbers-card ${expandedCard === i ? 'expanded' : ''}`}
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              >
                <div className="numbers-card-header">
                  <span className="numbers-card-name">{entry.name}</span>
                  <span className="numbers-card-num" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setPopupNumber(entry.number); }}>#{entry.number}</span>
                </div>
                <div className="numbers-card-summary">{entry.summary}</div>
                {expandedCard === i && (
                  <div className="numbers-card-body">
                    <EntryDetail entry={entry} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── NUMBER POPUP ── */}
      {popupNumber !== null && (
        <NumberPopup number={popupNumber} onClose={() => setPopupNumber(null)} />
      )}
    </div>
  );
}
