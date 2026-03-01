import React, { useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * Yellow timeline bar for historical-core content in Lost Treasures.
 * Evenly-spaced stops with draggable dot, arrow nav, and year labels.
 *
 * Props:
 *   stops       – array of { year, label, text }
 *   activeIndex – currently selected stop index
 *   onSelect    – (index) => void
 */
export default function HistoricalCoreTimeline({ stops, activeIndex, onSelect }) {
  const barRef = useRef(null);
  const dragging = useRef(false);
  const count = stops.length;

  const pct = useMemo(() => {
    if (count <= 1) return 50;
    return (activeIndex / (count - 1)) * 100;
  }, [activeIndex, count]);

  const indexFromPct = useCallback((p) => {
    if (count <= 1) return 0;
    const raw = (p / 100) * (count - 1);
    return Math.max(0, Math.min(count - 1, Math.round(raw)));
  }, [count]);

  const pctFromEvent = useCallback((e) => {
    const bar = barRef.current;
    if (!bar) return 50;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const selectFromEvent = useCallback((e) => {
    const p = pctFromEvent(e);
    onSelect(indexFromPct(p));
  }, [pctFromEvent, indexFromPct, onSelect]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      selectFromEvent(e);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.userSelect = '';
    }
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
  }, [selectFromEvent]);

  const goPrev = useCallback(() => {
    onSelect(Math.max(0, activeIndex - 1));
  }, [activeIndex, onSelect]);

  const goNext = useCallback(() => {
    onSelect(Math.min(count - 1, activeIndex + 1));
  }, [activeIndex, count, onSelect]);

  if (!stops || stops.length === 0) return null;

  return (
    <div className="treasures-hc-timeline">
      <button className="treasures-hc-arrow" onClick={goPrev} title="Previous">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M6,1 L2,6 L6,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="treasures-hc-bar" ref={barRef} onClick={selectFromEvent}>
        <div className="treasures-hc-track" />
        {stops.map((stop, i) => {
          const stopPct = count <= 1 ? 50 : (i / (count - 1)) * 100;
          const isActive = i === activeIndex;
          return (
            <div
              key={i}
              className={`treasures-hc-stop${isActive ? ' active' : ''}`}
              style={{ left: `${stopPct}%` }}
              onClick={(e) => { e.stopPropagation(); onSelect(i); }}
              title={`${stop.label} · ${stop.year <= 0 ? `${Math.abs(stop.year)} BCE` : stop.year}`}
            >
              <div className="treasures-hc-stop-dot" />
              <span className="treasures-hc-stop-year">
                {stop.year <= 0 ? `${Math.abs(stop.year)} BCE` : stop.year}
              </span>
            </div>
          );
        })}
        <div
          className="treasures-hc-dot"
          style={{ left: `${pct}%` }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        />
      </div>
      <button className="treasures-hc-arrow" onClick={goNext} title="Next">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M2,1 L6,6 L2,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}
