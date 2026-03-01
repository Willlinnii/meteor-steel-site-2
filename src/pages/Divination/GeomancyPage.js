import React, { useState, useCallback } from 'react';
import { lookupFigure, randomRow } from '../../data/geomancyData';

const ROW_LABELS = ['Fire', 'Air', 'Water', 'Earth'];

/** Render a row of 1 or 2 dots. */
function DotRow({ count, revealed, label }) {
  return (
    <div className={`geomancy-row${revealed ? ' visible' : ''}`}>
      <span className="geomancy-row-label">{label}</span>
      <div className="geomancy-dots">
        {count === 1 ? (
          <span className="geomancy-dot" />
        ) : count === 2 ? (
          <>
            <span className="geomancy-dot" />
            <span className="geomancy-dot" />
          </>
        ) : (
          <span className="geomancy-dot placeholder" />
        )}
      </div>
    </div>
  );
}

export default function GeomancyPage() {
  const [dots, setDots] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [casting, setCasting] = useState(false);
  const [history, setHistory] = useState([]);

  const handleCast = useCallback(() => {
    setCasting(true);
    setRevealed(0);
    setDots(null);

    const allDots = [randomRow(), randomRow(), randomRow(), randomRow()];
    setDots(allDots);

    for (let i = 0; i < 4; i++) {
      setTimeout(() => setRevealed(i + 1), 400 * (i + 1));
    }
    setTimeout(() => {
      setCasting(false);
      const fig = lookupFigure(allDots);
      if (fig) setHistory(prev => [fig.name, ...prev].slice(0, 20));
    }, 400 * 4 + 200);
  }, []);

  const allRevealed = revealed >= 4 && !casting;
  const figure = dots ? lookupFigure(dots) : null;

  return (
    <div className="divination-oracle divination-geomancy">
      <div className="geomancy-figure-display">
        {dots ? (
          dots.map((d, i) => (
            <DotRow key={i} count={d} revealed={i < revealed} label={ROW_LABELS[i]} />
          ))
        ) : (
          <div className="divination-oracle-empty">
            Generate a geomantic figure
          </div>
        )}
      </div>

      <button className="divination-roll-btn" onClick={handleCast} disabled={casting}>
        {casting ? 'Marking...' : 'Generate Figure'}
      </button>

      {allRevealed && figure && (
        <div className="divination-oracle-reading">
          <div className="divination-oracle-title">{figure.name}</div>
          <div className="geomancy-meta">
            {figure.english} &middot; {figure.planet} &middot; {figure.element} &middot; {figure.zodiac}
          </div>
          <div className="geomancy-attrs">
            <div><strong>Favorable:</strong> {figure.favorable}</div>
            <div><strong>Unfavorable:</strong> {figure.unfavorable}</div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="divination-oracle-history">
          {history.map((val, i) => (
            <div key={i} className="divination-oracle-history-item">{val}</div>
          ))}
        </div>
      )}

      <div className="divination-oracle-source">
        Planetary rulers, elements, and zodiacal correspondences follow Agrippa,{' '}
        <em>De Geomantia</em> (1533), transmitted from the Arabic <em>ʿilm al-raml</em> tradition.
      </div>
    </div>
  );
}
