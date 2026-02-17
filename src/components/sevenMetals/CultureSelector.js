import React from 'react';

const CULTURES = ['Greek', 'Roman', 'Hindu', 'Norse', 'Babylonian', 'Jewish'];

export default function CultureSelector({ activeCulture, onSelectCulture }) {
  return (
    <div className="culture-selector">
      {CULTURES.map(c => (
        <button
          key={c}
          className={`culture-btn${activeCulture === c ? ' active' : ''}`}
          onClick={() => onSelectCulture(activeCulture === c ? null : c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
