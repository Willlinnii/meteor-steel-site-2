import React from 'react';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'deities',   label: 'Deities' },
  { id: 'sins',      label: 'Sins' },
  { id: 'day',       label: 'Day' },
  { id: 'theology',  label: 'Theology' },
  { id: 'stories',   label: 'Stories' },
  { id: 'body',      label: 'Body' },
  { id: 'hebrew',    label: 'Hebrew' },
];

export default function MetalContentTabs({ activeTab, onSelectTab }) {
  return (
    <div className="metal-tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onSelectTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
