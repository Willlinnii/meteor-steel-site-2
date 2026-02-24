import React, { useRef, useCallback, useEffect, useMemo } from 'react';

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
const TIMELINE_SPAN = TIMELINE_MAX - TIMELINE_MIN; // 12026

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

  // "present"
  if (/present/i.test(s)) return 2026;

  // Century: "3rd century BCE", "8th century CE", "6th century BCE"
  const centuryMatch = s.match(/(\d+(?:st|nd|rd|th))\s+century\s*(BCE|BC|CE|AD)?/i);
  if (centuryMatch) {
    const num = CENTURY_WORDS[centuryMatch[1].toLowerCase()] || parseInt(centuryMatch[1]);
    const isBCE = /BCE|BC/i.test(centuryMatch[2] || '');
    if (isBCE) return -(num * 100) + 50; // midpoint of century
    return (num - 1) * 100 + 50; // e.g. 3rd century CE → 250
  }

  // Decade: "1920s"
  const decadeMatch = s.match(/(\d{4})s/);
  if (decadeMatch) return parseInt(decadeMatch[1]) + 5;

  // Plain year: "447 BCE", "1010 CE", "1933", "4 BCE"
  const yearMatch = s.match(/(\d{1,5})\s*(BCE|BC|CE|AD)?/i);
  if (yearMatch) {
    const yr = parseInt(yearMatch[1]);
    const isBCE = /BCE|BC/i.test(yearMatch[2] || '');
    return isBCE ? -yr : yr;
  }

  return null;
}

export function parseEraString(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^c\.\s*/, '').replace(/^~\s*/, '').replace(/\(traditionally\)/g, '');

  // Range with separator: "–", "—", "-", "to"
  const parts = cleaned.split(/\s*[–—]\s*|\s+-\s+|\s+to\s+/);
  if (parts.length >= 2) {
    // Carry BCE/CE from second part to first if first lacks it
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

  // Single date/century
  const yr = parseSingleDate(cleaned);
  if (yr != null) return { startYear: yr, endYear: yr };
  return null;
}

export function formatYear(year) {
  if (year <= 0) return `${Math.abs(year).toLocaleString()} BCE`;
  return `${year} CE`;
}

/* ── Helpers ── */
function yearToPct(year) {
  return ((year - TIMELINE_MIN) / TIMELINE_SPAN) * 100;
}

function pctToYear(pct) {
  return Math.round(TIMELINE_MIN + (pct / 100) * TIMELINE_SPAN);
}

const MIN_GAP = 100; // minimum 100-year gap between handles

/* ── Component ── */
export default function MythicAgesTimeline({ rangeStart, rangeEnd, onRangeChange, pins = [], onPinClick }) {
  const barRef = useRef(null);
  const draggingHandle = useRef(null); // 'start' | 'end' | null

  const startPct = yearToPct(rangeStart);
  const endPct = yearToPct(rangeEnd);

  const getYearFromEvent = useCallback((e) => {
    if (!barRef.current) return null;
    const rect = barRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    return pctToYear(pct);
  }, []);

  const handleMove = useCallback((e) => {
    if (!draggingHandle.current) return;
    const year = getYearFromEvent(e);
    if (year == null) return;

    if (draggingHandle.current === 'start') {
      const clamped = Math.max(TIMELINE_MIN, Math.min(year, rangeEnd - MIN_GAP));
      onRangeChange(clamped, rangeEnd);
    } else {
      const clamped = Math.min(TIMELINE_MAX, Math.max(year, rangeStart + MIN_GAP));
      onRangeChange(rangeStart, clamped);
    }
  }, [rangeStart, rangeEnd, onRangeChange, getYearFromEvent]);

  const handleUp = useCallback(() => {
    if (!draggingHandle.current) return;
    draggingHandle.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [handleMove, handleUp]);

  const onHandleDown = useCallback((which) => (e) => {
    e.preventDefault();
    draggingHandle.current = which;
    document.body.style.userSelect = 'none';
  }, []);

  const onBarClick = useCallback((e) => {
    if (draggingHandle.current) return;
    const year = getYearFromEvent(e);
    if (year == null) return;
    // Move whichever handle is closer
    const distStart = Math.abs(year - rangeStart);
    const distEnd = Math.abs(year - rangeEnd);
    if (distStart <= distEnd) {
      const clamped = Math.max(TIMELINE_MIN, Math.min(year, rangeEnd - MIN_GAP));
      onRangeChange(clamped, rangeEnd);
    } else {
      const clamped = Math.min(TIMELINE_MAX, Math.max(year, rangeStart + MIN_GAP));
      onRangeChange(rangeStart, clamped);
    }
  }, [rangeStart, rangeEnd, onRangeChange, getYearFromEvent]);

  // Group overlapping pins
  const pinElements = useMemo(() => {
    return pins.map(pin => {
      const midYear = (pin.startYear + pin.endYear) / 2;
      const pct = yearToPct(midYear);
      return { ...pin, pct };
    });
  }, [pins]);

  return (
    <div className="mythic-ages-timeline">
      <span className="mythic-ages-label">{formatYear(TIMELINE_MIN)}</span>
      <div className="mythic-ages-bar" ref={barRef} onClick={onBarClick}>
        {/* Age segments */}
        {MYTHIC_AGES.map(age => {
          const left = yearToPct(age.startYear);
          const width = yearToPct(age.endYear) - left;
          const isSelected = rangeStart === age.startYear && rangeEnd === age.endYear;
          return (
            <div
              key={age.id}
              className={`mythic-ages-segment${isSelected ? ' selected' : ''}`}
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: age.color }}
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) {
                  onRangeChange(TIMELINE_MIN, TIMELINE_MAX);
                } else {
                  onRangeChange(age.startYear, age.endYear);
                }
              }}
            >
              <span className="mythic-ages-segment-label">{age.label}</span>
            </div>
          );
        })}

        {/* Dim overlays outside selected range */}
        {startPct > 0 && (
          <div className="mythic-ages-dim" style={{ left: 0, width: `${startPct}%` }} />
        )}
        {endPct < 100 && (
          <div className="mythic-ages-dim" style={{ left: `${endPct}%`, width: `${100 - endPct}%` }} />
        )}

        {/* Pins */}
        {pinElements.map(pin => (
          <div
            key={pin.id}
            className="mythic-ages-pin"
            style={{ left: `${pin.pct}%`, backgroundColor: pin.color }}
            title={`${pin.name} (${formatYear(pin.startYear)}${pin.endYear !== pin.startYear ? ' – ' + formatYear(pin.endYear) : ''})`}
            onClick={(e) => { e.stopPropagation(); onPinClick?.(pin); }}
          />
        ))}

        {/* Handles */}
        <div
          className="mythic-ages-handle"
          style={{ left: `${startPct}%` }}
          onMouseDown={onHandleDown('start')}
          onTouchStart={onHandleDown('start')}
        >
          <span className="mythic-ages-handle-label">{formatYear(rangeStart)}</span>
        </div>
        <div
          className="mythic-ages-handle"
          style={{ left: `${endPct}%` }}
          onMouseDown={onHandleDown('end')}
          onTouchStart={onHandleDown('end')}
        >
          <span className="mythic-ages-handle-label">{formatYear(rangeEnd)}</span>
        </div>
      </div>
      <span className="mythic-ages-label">2026</span>
    </div>
  );
}
