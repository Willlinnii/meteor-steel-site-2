import React, { useState, useCallback } from 'react';
import { STICK_COUNTS } from '../../data/throwingSticksData';

/** Single stick — tall narrow shape, flat or round top. */
function Stick({ round, casting }) {
  return (
    <div className={`divination-stick${round ? ' round' : ' flat'}${casting ? ' casting' : ''}`}>
      <div className="divination-stick-body" />
      <span className="divination-stick-label">{round ? 'Round' : 'Flat'}</span>
    </div>
  );
}

export default function ThrowingSticksPage() {
  const [sticks, setSticks] = useState(null);
  const [casting, setCasting] = useState(false);
  const [history, setHistory] = useState([]);

  const handleCast = useCallback(() => {
    setCasting(true);
    const flickerInterval = setInterval(() => {
      setSticks([0,0,0,0].map(() => (Math.random() < 0.5 ? 1 : 0)));
    }, 80);
    setTimeout(() => {
      clearInterval(flickerInterval);
      const final = [0,0,0,0].map(() => (Math.random() < 0.5 ? 1 : 0));
      setSticks(final);
      setCasting(false);
      const count = final.reduce((s, v) => s + v, 0);
      setHistory(prev => [count, ...prev].slice(0, 20));
    }, 600);
  }, []);

  const roundCount = sticks ? sticks.reduce((s, v) => s + v, 0) : null;
  const outcome = roundCount !== null ? STICK_COUNTS[roundCount] : null;

  return (
    <div className="divination-oracle divination-sticks">
      <div className="divination-oracle-tray">
        {sticks ? (
          sticks.map((s, i) => <Stick key={i} round={s === 1} casting={casting} />)
        ) : (
          <div className="divination-oracle-empty">Four casting sticks</div>
        )}
      </div>

      <button className="divination-roll-btn" onClick={handleCast} disabled={casting}>
        {casting ? 'Throwing...' : 'Throw Sticks'}
      </button>

      {outcome && !casting && (
        <div className="divination-oracle-reading">
          <div className="divination-oracle-title">{outcome.label}</div>
          <div className="divination-oracle-text">{outcome.note}</div>
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
        Egyptian casting sticks. Movement values from Senet
        (Kendall 1978, Piccione 1980). 0 marked = 5 (bonus throw).
      </div>
    </div>
  );
}
