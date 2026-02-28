import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';

/* ── Age Definitions ── */
export const MYTHIC_AGES = [
  { id: 'nature', label: 'Nature', startYear: -13000, endYear: -10000, color: '#5b8a72' },
  { id: 'stone',        label: 'Stone',        startYear: -10000, endYear: -5000, color: '#a89070' },
  { id: 'gold',         label: 'Gold',         startYear: -5000,  endYear: -4500, color: '#d4af37' },
  { id: 'copper',       label: 'Copper',       startYear: -4500,  endYear: -4000, color: '#b87333' },
  { id: 'silver',       label: 'Silver',       startYear: -4000,  endYear: -3300, color: '#c0c0c0' },
  { id: 'bronze',       label: 'Bronze',       startYear: -3300,  endYear: -1800, color: '#c4713a' },
  { id: 'meteor-steel', label: 'Meteor Steel', startYear: -1800,  endYear: -1200, color: '#c9a961' },
  { id: 'iron',         label: 'Iron',         startYear: -1200,  endYear: 2026,  color: '#8b9dc3' },
];

export const TIMELINE_MIN = -13000;
export const TIMELINE_MAX = 2026;
const TIMELINE_SPAN = TIMELINE_MAX - TIMELINE_MIN;

// Year values at each age boundary: [-13000, -10000, -5000, -4500, -4000, -3300, -1800, -1200, 2026]
const AGE_BOUNDARY_YEARS = [
  MYTHIC_AGES[0].startYear,
  ...MYTHIC_AGES.slice(0, -1).map(a => a.endYear),
  MYTHIC_AGES[MYTHIC_AGES.length - 1].endYear,
];

const DEFAULT_BOUNDARIES = AGE_BOUNDARY_YEARS.slice(1, -1).map(
  y => ((y - TIMELINE_MIN) / TIMELINE_SPAN) * 100
);

const MIN_SEGMENT_PCT = 3;
const MIN_GAP = 100; // minimum year gap between range handles

/* ── Era String Parser ── */
const CENTURY_WORDS = {
  '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6,
  '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12,
  '13th': 13, '14th': 14, '15th': 15, '16th': 16, '17th': 17,
  '18th': 18, '19th': 19, '20th': 20, '21st': 21,
};

function parseSingleDate(s) {
  if (!s) return null;
  s = s.trim().replace(/^c\.\s*/, '').replace(/^~\s*/, '').replace(/\(.*?\)/g, '').trim();

  if (/present/i.test(s)) return 2026;

  const centuryMatch = s.match(/(\d+(?:st|nd|rd|th))\s+century\s*(BCE|BC|CE|AD)?/i);
  if (centuryMatch) {
    const num = CENTURY_WORDS[centuryMatch[1].toLowerCase()] || parseInt(centuryMatch[1]);
    const isBCE = /BCE|BC/i.test(centuryMatch[2] || '');
    if (isBCE) return -(num * 100) + 50;
    return (num - 1) * 100 + 50;
  }

  const decadeMatch = s.match(/(\d{4})s/);
  if (decadeMatch) return parseInt(decadeMatch[1]) + 5;

  const yearMatch = s.match(/(\d{1,5})\s*(BCE|BC|CE|AD)?/i);
  if (yearMatch) {
    const yr = parseInt(yearMatch[1]);
    return /BCE|BC/i.test(yearMatch[2] || '') ? -yr : yr;
  }

  return null;
}

export function parseEraString(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^c\.\s*/, '').replace(/^~\s*/, '').replace(/\(traditionally\)/g, '');

  const parts = cleaned.split(/\s*[–—]\s*|\s+-\s+|\s+to\s+/);
  if (parts.length >= 2) {
    const secondHasEra = /BCE|BC|CE|AD/i.test(parts[1]);
    const firstHasEra = /BCE|BC|CE|AD/i.test(parts[0]);
    let first = parts[0];
    if (!firstHasEra && secondHasEra) {
      const eraMatch = parts[1].match(/(BCE|BC|CE|AD)/i);
      if (eraMatch) first = first + ' ' + eraMatch[1];
    }
    const startYear = parseSingleDate(first);
    const endYear = parseSingleDate(parts[parts.length - 1]);
    if (startYear != null && endYear != null) return { startYear, endYear };
    if (startYear != null) return { startYear, endYear: startYear };
    if (endYear != null) return { startYear: endYear, endYear };
    return null;
  }

  const yr = parseSingleDate(cleaned);
  if (yr != null) return { startYear: yr, endYear: yr };
  return null;
}

export function formatYear(year) {
  if (year <= 0) return `${Math.abs(year).toLocaleString()} BCE`;
  return `${year} CE`;
}

/* ── Piecewise-linear mapping ── */
function yearToPctScaled(year, pctArr) {
  for (let i = 0; i < AGE_BOUNDARY_YEARS.length - 1; i++) {
    const yStart = AGE_BOUNDARY_YEARS[i];
    const yEnd = AGE_BOUNDARY_YEARS[i + 1];
    if (year <= yEnd || i === AGE_BOUNDARY_YEARS.length - 2) {
      const t = (year - yStart) / (yEnd - yStart);
      return pctArr[i] + t * (pctArr[i + 1] - pctArr[i]);
    }
  }
  return 100;
}

function pctToYearScaled(pct, pctArr) {
  for (let i = 0; i < pctArr.length - 1; i++) {
    const pStart = pctArr[i];
    const pEnd = pctArr[i + 1];
    if (pct <= pEnd || i === pctArr.length - 2) {
      const segWidth = pEnd - pStart;
      const t = segWidth > 0 ? (pct - pStart) / segWidth : 0;
      return Math.round(AGE_BOUNDARY_YEARS[i] + t * (AGE_BOUNDARY_YEARS[i + 1] - AGE_BOUNDARY_YEARS[i]));
    }
  }
  return TIMELINE_MAX;
}

/* ── Component ── */
export default function MythicAgesTimeline({ rangeStart, rangeEnd, onRangeChange, pins = [], onPinClick, highlightedPinId }) {
  const barRef = useRef(null);
  const dragRef = useRef(null);      // { type: 'handle', which } | { type: 'boundary', idx } | null
  const didDragRef = useRef(false);  // prevents click-after-drag

  const [boundaries, setBoundaries] = useState(DEFAULT_BOUNDARIES);
  const pctArr = useMemo(() => [0, ...boundaries, 100], [boundaries]);

  // Ref-sync volatile props so event listeners stay stable
  const live = useRef({ rangeStart, rangeEnd, onRangeChange, pctArr });
  live.current = { rangeStart, rangeEnd, onRangeChange, pctArr };

  const startPct = yearToPctScaled(rangeStart, pctArr);
  const endPct = yearToPctScaled(rangeEnd, pctArr);

  // Stable: barRef never changes
  const getPct = useCallback((e) => {
    if (!barRef.current) return null;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
  }, []);

  // Document-level drag listeners — registered once
  useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;

      const pct = getPct(e);
      if (pct == null) return;

      if (drag.type === 'boundary') {
        setBoundaries(prev => {
          const next = [...prev];
          const { idx } = drag;
          const lo = idx === 0 ? MIN_SEGMENT_PCT : prev[idx - 1] + MIN_SEGMENT_PCT;
          const hi = idx === prev.length - 1 ? 100 - MIN_SEGMENT_PCT : prev[idx + 1] - MIN_SEGMENT_PCT;
          next[idx] = Math.max(lo, Math.min(hi, pct));
          return next;
        });
        return;
      }

      const { rangeStart: rs, rangeEnd: re, onRangeChange: cb, pctArr: pa } = live.current;
      const year = pctToYearScaled(pct, pa);
      if (drag.which === 'start') {
        cb(Math.max(TIMELINE_MIN, Math.min(year, re - MIN_GAP)), re);
      } else {
        cb(rs, Math.min(TIMELINE_MAX, Math.max(year, rs + MIN_GAP)));
      }
    };

    const onUp = () => {
      if (dragRef.current) didDragRef.current = true;
      dragRef.current = null;
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [getPct]);

  const startDrag = useCallback((drag) => (e) => {
    e.preventDefault();
    if (drag.type === 'boundary') e.stopPropagation();
    dragRef.current = drag;
    document.body.style.userSelect = 'none';
  }, []);

  const onBarClick = useCallback((e) => {
    // Swallow click that follows a drag
    if (didDragRef.current) { didDragRef.current = false; return; }

    const pct = getPct(e);
    if (pct == null) return;
    const { rangeStart: rs, rangeEnd: re, onRangeChange: cb, pctArr: pa } = live.current;
    const year = pctToYearScaled(pct, pa);
    if (Math.abs(year - rs) <= Math.abs(year - re)) {
      cb(Math.max(TIMELINE_MIN, Math.min(year, re - MIN_GAP)), re);
    } else {
      cb(rs, Math.min(TIMELINE_MAX, Math.max(year, rs + MIN_GAP)));
    }
  }, [getPct]);

  const isCustom = boundaries.some((b, i) => Math.abs(b - DEFAULT_BOUNDARIES[i]) > 0.5);

  const pinElements = useMemo(() =>
    pins.map(pin => ({
      ...pin,
      pct: yearToPctScaled((pin.startYear + pin.endYear) / 2, pctArr),
    })),
    [pins, pctArr]
  );

  return (
    <div className="mythic-ages-timeline">
      <span className="mythic-ages-label">{formatYear(TIMELINE_MIN)}</span>
      <div className="mythic-ages-bar" ref={barRef} onClick={onBarClick}>
        {/* Age segments */}
        {MYTHIC_AGES.map((age, i) => {
          const left = pctArr[i];
          const width = pctArr[i + 1] - left;
          const isSelected = rangeStart === age.startYear && rangeEnd === age.endYear;
          return (
            <div
              key={age.id}
              className={`mythic-ages-segment${isSelected ? ' selected' : ''}`}
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: age.color }}
              onClick={(e) => {
                e.stopPropagation();
                onRangeChange(isSelected ? TIMELINE_MIN : age.startYear, isSelected ? TIMELINE_MAX : age.endYear);
              }}
            >
              <span className="mythic-ages-segment-label">{age.label}</span>
            </div>
          );
        })}

        {/* Draggable boundary dividers */}
        {boundaries.map((bPct, i) => (
          <div
            key={`b${i}`}
            className="mythic-ages-boundary"
            style={{ left: `${bPct}%` }}
            onMouseDown={startDrag({ type: 'boundary', idx: i })}
            onTouchStart={startDrag({ type: 'boundary', idx: i })}
            title={formatYear(AGE_BOUNDARY_YEARS[i + 1])}
          />
        ))}

        {/* Dim overlays outside selected range */}
        {startPct > 0 && <div className="mythic-ages-dim" style={{ left: 0, width: `${startPct}%` }} />}
        {endPct < 100 && <div className="mythic-ages-dim" style={{ left: `${endPct}%`, width: `${100 - endPct}%` }} />}

        {/* Pins */}
        {pinElements.map(pin => (
          <div
            key={pin.id}
            className={`mythic-ages-pin${pin.id === highlightedPinId ? ' highlighted' : ''}`}
            style={{ left: `${pin.pct}%`, backgroundColor: pin.color }}
            title={`${pin.name} (${formatYear(pin.startYear)}${pin.endYear !== pin.startYear ? ' \u2013 ' + formatYear(pin.endYear) : ''})`}
            onClick={(e) => { e.stopPropagation(); onPinClick?.(pin); }}
          />
        ))}

        {/* Range handles */}
        <div
          className="mythic-ages-handle"
          style={{ left: `${startPct}%` }}
          onMouseDown={startDrag({ type: 'handle', which: 'start' })}
          onTouchStart={startDrag({ type: 'handle', which: 'start' })}
        >
          <span className="mythic-ages-handle-label">{formatYear(rangeStart)}</span>
        </div>
        <div
          className="mythic-ages-handle"
          style={{ left: `${endPct}%` }}
          onMouseDown={startDrag({ type: 'handle', which: 'end' })}
          onTouchStart={startDrag({ type: 'handle', which: 'end' })}
        >
          <span className="mythic-ages-handle-label">{formatYear(rangeEnd)}</span>
        </div>
      </div>
      <span className="mythic-ages-label">
        2026
        {isCustom && (
          <button
            className="mythic-ages-reset"
            onClick={(e) => { e.stopPropagation(); setBoundaries(DEFAULT_BOUNDARIES); }}
            title="Reset timeline scaling"
          >
            {'\u21BA'}
          </button>
        )}
      </span>
    </div>
  );
}
