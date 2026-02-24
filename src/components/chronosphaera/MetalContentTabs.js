import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStoryForge, useYBRMode } from '../../App';
import { ERA_GROUPS, CYCLE_ORDER } from './usePerspective';

// Representative midpoint year per tradition (for timeline positioning)
const TIMELINE_YEARS = {
  'sumerian': -2500,
  'babylon': -1200,
  'phoenician': -900,
  'assyrian': -700,
  'genesis': -550,
  'pythagorean': -530,
  'plato': -380,
  'corpus-hermeticum': 200,
  'kabbalah': 750,
  'neoplatonist': 400,
  'vedic': 850,
  'norse': 1100,
  'al-farabi': 910,
  'ikhwan-al-safa': 970,
  'dante': 1320,
  'tarot': 1435,
  'ficino': 1470,
  'paracelsus': 1520,
  'john-dee': 1585,
  'kepler': 1610,
  'rosicrucian': 1630,
  'blavatsky': 1884,
  'golden-dawn': 1894,
  'besant-theosophy': 1913,
  'steiner': 1915,
  'leadbeater-theosophy': 1919,
  'manly-p-hall': 1928,
  'krishnamurti': 1929,
  'perennial-philosophy': 1945,
  'tolkien': 1954,
  'ra-law-of-one': 1982,
  'mythouse': 2026,
};

const TIMELINE_MIN = -2500;
const TIMELINE_MAX = 2026;
const TIMELINE_SPAN = TIMELINE_MAX - TIMELINE_MIN;

// Full chronological sequence for arrow stepping: all traditions + events + mythouse at the end
const TIMELINE_SEQUENCE = (() => {
  const seq = [...CYCLE_ORDER, 'mythouse'];
  // Insert timeline events at chronological positions
  const hallIdx = seq.indexOf('manly-p-hall');
  seq.splice(hallIdx + 1, 0, 'krishnamurti');
  return seq;
})();

// Pre-sorted positions for snap-to-nearest during drag
const SNAP_POINTS = TIMELINE_SEQUENCE.map(id => ({
  id,
  pct: ((TIMELINE_YEARS[id] - TIMELINE_MIN) / TIMELINE_SPAN) * 100,
})).sort((a, b) => a.pct - b.pct);

function findNearest(pct) {
  let best = SNAP_POINTS[0];
  let bestDist = Math.abs(pct - best.pct);
  for (let i = 1; i < SNAP_POINTS.length; i++) {
    const d = Math.abs(pct - SNAP_POINTS[i].pct);
    if (d < bestDist) { best = SNAP_POINTS[i]; bestDist = d; }
  }
  return best.id;
}

function TimelineBar({ activePerspective, onSelectPerspective }) {
  const barRef = useRef(null);
  const dragging = useRef(false);

  const pct = useMemo(() => {
    const year = TIMELINE_YEARS[activePerspective] ?? TIMELINE_MAX;
    return ((year - TIMELINE_MIN) / TIMELINE_SPAN) * 100;
  }, [activePerspective]);

  const pctFromEvent = useCallback((e) => {
    const bar = barRef.current;
    if (!bar) return 50;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const selectNearest = useCallback((e) => {
    const p = pctFromEvent(e);
    const id = findNearest(p);
    onSelectPerspective(id);
  }, [pctFromEvent, onSelectPerspective]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      selectNearest(e);
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
  }, [selectNearest]);

  const goPrev = useCallback(() => {
    const idx = TIMELINE_SEQUENCE.indexOf(activePerspective);
    const prev = idx <= 0 ? TIMELINE_SEQUENCE[TIMELINE_SEQUENCE.length - 1] : TIMELINE_SEQUENCE[idx - 1];
    onSelectPerspective(prev);
  }, [activePerspective, onSelectPerspective]);

  const goNext = useCallback(() => {
    const idx = TIMELINE_SEQUENCE.indexOf(activePerspective);
    const next = idx < 0 || idx >= TIMELINE_SEQUENCE.length - 1 ? TIMELINE_SEQUENCE[0] : TIMELINE_SEQUENCE[idx + 1];
    onSelectPerspective(next);
  }, [activePerspective, onSelectPerspective]);

  const isKrishnamurti = activePerspective === 'krishnamurti';
  const meteorPct = ((1929 - TIMELINE_MIN) / TIMELINE_SPAN) * 100;

  return (
    <div className="perspective-timeline">
      <button className="perspective-timeline-arrow prev" onClick={goPrev} title="Previous tradition">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M6,1 L2,6 L6,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="perspective-timeline-bar" ref={barRef} onClick={selectNearest}>
        <div className="perspective-timeline-track" />
        {/* Krishnamurti meteor marker */}
        <div
          className={`perspective-timeline-event${isKrishnamurti ? ' active' : ''}`}
          style={{ left: `${meteorPct}%` }}
          onClick={(e) => { e.stopPropagation(); onSelectPerspective('krishnamurti'); }}
          title="Krishnamurti · 1929"
        >
          <svg viewBox="0 0 14 10" width="14" height="10">
            <circle cx="10.5" cy="3.5" r="2.5" fill="currentColor" />
            <path d="M9,5 L3,9 M9.5,4.5 L5,8 M8.5,5.5 L4.5,8.5" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
          </svg>
        </div>
        {!isKrishnamurti && (
          <div
            className="perspective-timeline-dot"
            style={{ left: `${pct}%` }}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
          />
        )}
      </div>
      <button className="perspective-timeline-arrow next" onClick={goNext} title="Next tradition">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M2,1 L6,6 L2,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

// --- Culture Timeline (for zodiac sign views) ---

const CULTURE_YEARS = {
  Babylonian: -1800,
  Vedic: -1000,
  Greek: -400,
  Roman: 100,
  Islamic: 850,
  Norse: 1050,
  Medieval: 1200,
  Atlas: 2026,
};

const CULTURE_MIN = -1800;
const CULTURE_MAX = 2026;
const CULTURE_SPAN = CULTURE_MAX - CULTURE_MIN;

const CULTURE_SEQUENCE = ['Babylonian', 'Vedic', 'Greek', 'Roman', 'Islamic', 'Norse', 'Medieval', 'Atlas'];

const CULTURE_SNAP_POINTS = CULTURE_SEQUENCE.map(id => ({
  id,
  pct: ((CULTURE_YEARS[id] - CULTURE_MIN) / CULTURE_SPAN) * 100,
})).sort((a, b) => a.pct - b.pct);

function findNearestCulture(pct) {
  let best = CULTURE_SNAP_POINTS[0];
  let bestDist = Math.abs(pct - best.pct);
  for (let i = 1; i < CULTURE_SNAP_POINTS.length; i++) {
    const d = Math.abs(pct - CULTURE_SNAP_POINTS[i].pct);
    if (d < bestDist) { best = CULTURE_SNAP_POINTS[i]; bestDist = d; }
  }
  return best.id;
}

export function CultureTimelineBar({ activeCulture, onSelectCulture }) {
  const barRef = useRef(null);
  const dragging = useRef(false);

  const pct = useMemo(() => {
    const year = CULTURE_YEARS[activeCulture] ?? CULTURE_MAX;
    return ((year - CULTURE_MIN) / CULTURE_SPAN) * 100;
  }, [activeCulture]);

  const pctFromEvent = useCallback((e) => {
    const bar = barRef.current;
    if (!bar) return 50;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const selectNearest = useCallback((e) => {
    const p = pctFromEvent(e);
    const id = findNearestCulture(p);
    onSelectCulture(id);
  }, [pctFromEvent, onSelectCulture]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      selectNearest(e);
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
  }, [selectNearest]);

  const goPrev = useCallback(() => {
    const idx = CULTURE_SEQUENCE.indexOf(activeCulture);
    const prev = idx <= 0 ? CULTURE_SEQUENCE[CULTURE_SEQUENCE.length - 1] : CULTURE_SEQUENCE[idx - 1];
    onSelectCulture(prev);
  }, [activeCulture, onSelectCulture]);

  const goNext = useCallback(() => {
    const idx = CULTURE_SEQUENCE.indexOf(activeCulture);
    const next = idx < 0 || idx >= CULTURE_SEQUENCE.length - 1 ? CULTURE_SEQUENCE[0] : CULTURE_SEQUENCE[idx + 1];
    onSelectCulture(next);
  }, [activeCulture, onSelectCulture]);

  return (
    <div className="perspective-timeline">
      <button className="perspective-timeline-arrow prev" onClick={goPrev} title="Previous culture">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M6,1 L2,6 L6,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="perspective-timeline-bar" ref={barRef} onClick={selectNearest}>
        <div className="perspective-timeline-track" />
        <div
          className="perspective-timeline-dot"
          style={{ left: `${pct}%` }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        />
      </div>
      <button className="perspective-timeline-arrow next" onClick={goNext} title="Next culture">
        <svg viewBox="0 0 8 12" width="6" height="10"><path d="M2,1 L6,6 L2,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'metal',     label: 'Metal' },
  { id: 'planet',    label: 'Planet' },
  { id: 'deities',   label: 'Deities' },
  { id: 'sins',      label: 'Sins' },
  { id: 'day',       label: 'Day' },
  { id: 'body',      label: 'Self' },
  { id: 'hebrew',    label: 'Creation' },
  { id: 'tarot',     label: 'Tarot' },
];

function PerspectivePicker({ activePerspective, onSelectPerspective, populatedPerspectives, perspectiveLabel }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedEra, setExpandedEra] = useState(null);
  const wrapperRef = useRef(null);
  const isMythouse = !activePerspective || activePerspective === 'mythouse';

  // Build set of populated IDs for fast lookup
  const populatedIds = React.useMemo(
    () => new Set((populatedPerspectives || []).map(p => p.id)),
    [populatedPerspectives]
  );

  // Build id→tradition label map from populated perspectives
  const labelMap = React.useMemo(() => {
    const m = {};
    for (const p of (populatedPerspectives || [])) m[p.id] = p.tradition;
    return m;
  }, [populatedPerspectives]);

  // Auto-expand the era containing the active tradition when panel opens
  useEffect(() => {
    if (panelOpen && !isMythouse) {
      const era = ERA_GROUPS.find(g => g.traditions.includes(activePerspective));
      if (era) setExpandedEra(era.id);
    }
  }, [panelOpen, activePerspective, isMythouse]);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [panelOpen]);

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => !prev);
  }, []);

  const handleEraClick = useCallback((eraId) => {
    setExpandedEra(prev => prev === eraId ? null : eraId);
  }, []);

  const handleSelect = useCallback((id) => {
    onSelectPerspective(id);
    setPanelOpen(false);
  }, [onSelectPerspective]);

  return (
    <div className="perspective-picker" ref={wrapperRef}>
      <button
        className={`metal-tab perspective-cycle-tab${!isMythouse ? ' perspective-active' : ''}${panelOpen ? ' perspective-open' : ''}`}
        onClick={togglePanel}
        title="Choose tradition lens"
      >
        {perspectiveLabel || 'Atlas'}
        <span className={`perspective-chevron${panelOpen ? ' open' : ''}`}>&#9662;</span>
      </button>
      {panelOpen && (
        <div className="perspective-dropdown">
          <button
            className={`perspective-tradition${isMythouse ? ' active' : ''}`}
            onClick={() => handleSelect('mythouse')}
          >
            Atlas
          </button>
          <div className="perspective-divider" />
          {ERA_GROUPS.map(era => {
            const visibleTraditions = era.traditions.filter(id => populatedIds.has(id));
            if (visibleTraditions.length === 0) return null;
            const isExpanded = expandedEra === era.id;
            return (
              <div key={era.id} className="perspective-era">
                <button
                  className={`perspective-era-header${isExpanded ? ' expanded' : ''}`}
                  onClick={() => handleEraClick(era.id)}
                >
                  <span className={`perspective-chevron era-chevron${isExpanded ? ' open' : ''}`}>&#9662;</span>
                  <span className="perspective-era-label">{era.label}</span>
                  <span className="perspective-era-period">{era.period}</span>
                </button>
                {isExpanded && (
                  <div className="perspective-era-list">
                    {visibleTraditions.map(id => (
                      <button
                        key={id}
                        className={`perspective-tradition${activePerspective === id ? ' active' : ''}`}
                        onClick={() => handleSelect(id)}
                      >
                        {labelMap[id] || id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MetalContentTabs({ activeTab, onSelectTab, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, getTabClass, onToggleYBR, ybrActive, perspectiveLabel, orderLabel, onSelectPerspective, activePerspective, populatedPerspectives, tabs }) {
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();
  const displayTabs = tabs || TABS;
  return (
    <div className="metal-tabs">
      {onSelectPerspective && (
        <TimelineBar activePerspective={activePerspective} onSelectPerspective={onSelectPerspective} />
      )}
      {onSelectPerspective && (
        <PerspectivePicker
          activePerspective={activePerspective}
          onSelectPerspective={onSelectPerspective}
          populatedPerspectives={populatedPerspectives}
          perspectiveLabel={perspectiveLabel}
        />
      )}
      {orderLabel && (
        <span className="perspective-order-label">{orderLabel}</span>
      )}
      {displayTabs.map(t => (
        <button
          key={t.id}
          className={`metal-tab${activeTab === t.id ? ' active' : ''} ${getTabClass ? getTabClass(t.id) : ''}`}
          onClick={() => onSelectTab(t.id)}
        >
          {t.label}
        </button>
      ))}
      {forgeMode && (
        <button
          className={`metal-tab forge-icon-tab${activeTab === 'development' ? ' active' : ''}`}
          title="Story Forge"
          onClick={() => onSelectTab('development')}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10,2 L10,11" />
            <path d="M7,5 Q10,3 13,5" />
            <path d="M6,11 L14,11" />
            <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
          </svg>
        </button>
      )}
      {ybrMode && onToggleYBR && (
        <button
          className={`metal-tab ybr-icon-tab${ybrActive ? ' active' : ''}`}
          title={ybrActive ? 'Exit Yellow Brick Road' : 'Walk the Yellow Brick Road'}
          onClick={onToggleYBR}
        >
          <svg viewBox="0 0 20 14" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M1,4 L7,1 L19,1 L13,4 Z" />
            <path d="M1,4 L1,13 L13,13 L13,4" />
            <path d="M13,4 L19,1 L19,10 L13,13" />
            <line x1="7" y1="4" x2="7" y2="13" />
            <line x1="1" y1="8.5" x2="13" y2="8.5" />
            <line x1="4" y1="8.5" x2="4" y2="13" />
            <line x1="10" y1="4" x2="10" y2="8.5" />
          </svg>
        </button>
      )}
      {playlistUrl && (
        <button
          className={`metal-tab playlist-tab${videoActive ? ' active' : ''}`}
          title="Watch playlist"
          onClick={onToggleVideo}
        >
          {videoActive ? '\u25A0' : '\u25B6'}
        </button>
      )}
      <button
        className={`metal-tab persona-tab${personaChatActive ? ' active' : ''}`}
        title={personaChatActive ? 'Close persona chat' : 'Speak to this entity'}
        onClick={onTogglePersonaChat}
      >
        {personaChatActive ? '\u25A0' : '\uD83C\uDF99'}
      </button>
    </div>
  );
}
