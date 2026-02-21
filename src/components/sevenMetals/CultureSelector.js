import React from 'react';

const CULTURES = ['Roman', 'Greek', 'Norse', 'Babylonian', 'Vedic', 'Islamic', 'Medieval'];

export default function CultureSelector({ activeCulture, onSelectCulture }) {
  return (
    <div className="culture-selector">
      {CULTURES.map(c => (
        <button
          key={c}
          className={`culture-btn${activeCulture === c ? ' active' : ''}`}
          onClick={() => { if (activeCulture !== c) onSelectCulture(c); }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
