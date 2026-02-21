import React from 'react';
import { useStoryForge, useYBRMode } from '../../App';

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

export default function MetalContentTabs({ activeTab, onSelectTab, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, getTabClass, onToggleYBR, ybrActive }) {
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();
  return (
    <div className="metal-tabs">
      {TABS.map(t => (
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
