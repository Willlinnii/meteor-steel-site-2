import React from 'react';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'deities',   label: 'Deities' },
  { id: 'sins',      label: 'Sins' },
  { id: 'day',       label: 'Day' },
  { id: 'body',      label: 'Body' },
  { id: 'hebrew',    label: 'Creation' },
  { id: 'tarot',     label: 'Tarot' },
  { id: 'synthesis', label: 'Synthesis' },
  { id: 'development', label: 'Development' },
];

export default function MetalContentTabs({ activeTab, onSelectTab, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, getTabClass }) {
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
