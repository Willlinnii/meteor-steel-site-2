import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStoryForge, useYBRMode } from '../../App';
import { ERA_GROUPS } from './usePerspective';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'deities',   label: 'Deities' },
  { id: 'sins',      label: 'Sins' },
  { id: 'day',       label: 'Day' },
  { id: 'body',      label: 'Body' },
  { id: 'hebrew',    label: 'Creation' },
  { id: 'tarot',     label: 'Tarot' },
  { id: 'synthesis', label: 'Synthesis' },
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
        {perspectiveLabel || 'Mythouse'}
        <span className={`perspective-chevron${panelOpen ? ' open' : ''}`}>&#9662;</span>
      </button>
      {panelOpen && (
        <div className="perspective-dropdown">
          <button
            className={`perspective-tradition${isMythouse ? ' active' : ''}`}
            onClick={() => handleSelect('mythouse')}
          >
            Mythouse
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

export default function MetalContentTabs({ activeTab, onSelectTab, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, getTabClass, onToggleYBR, ybrActive, perspectiveLabel, onSelectPerspective, activePerspective, populatedPerspectives, tabs }) {
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();
  const displayTabs = tabs || TABS;
  return (
    <div className="metal-tabs">
      {onSelectPerspective && (
        <PerspectivePicker
          activePerspective={activePerspective}
          onSelectPerspective={onSelectPerspective}
          populatedPerspectives={populatedPerspectives}
          perspectiveLabel={perspectiveLabel}
        />
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
