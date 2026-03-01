import React, { useState, useCallback } from 'react';
import { COWRIE_OUTCOMES } from '../../data/cowrieData';

/** Single cowrie shell — oval that shows open (slit) or closed (dome). */
function Shell({ open, casting }) {
  return (
    <div className={`divination-cowrie-shell${open ? ' open' : ''}${casting ? ' casting' : ''}`}>
      <div className="divination-cowrie-body">
        {open && <div className="divination-cowrie-slit" />}
      </div>
      <span className="divination-cowrie-label">{open ? 'Open' : 'Closed'}</span>
    </div>
  );
}

export default function CowrieShellsPage() {
  const [shells, setShells] = useState(null);
  const [casting, setCasting] = useState(false);
  const [history, setHistory] = useState([]);

  const handleCast = useCallback(() => {
    setCasting(true);
    const flickerInterval = setInterval(() => {
      setShells([0,0,0,0].map(() => (Math.random() < 0.5 ? 1 : 0)));
    }, 80);
    setTimeout(() => {
      clearInterval(flickerInterval);
      const final = [0,0,0,0].map(() => (Math.random() < 0.5 ? 1 : 0));
      setShells(final);
      setCasting(false);
      const count = final.reduce((s, v) => s + v, 0);
      setHistory(prev => [COWRIE_OUTCOMES[count].name, ...prev].slice(0, 20));
    }, 600);
  }, []);

  const openCount = shells ? shells.reduce((s, v) => s + v, 0) : null;
  const outcome = openCount !== null ? COWRIE_OUTCOMES[openCount] : null;

  return (
    <div className="divination-oracle divination-cowrie">
      <div className="divination-oracle-tray">
        {shells ? (
          shells.map((s, i) => <Shell key={i} open={s === 1} casting={casting} />)
        ) : (
          <div className="divination-oracle-empty">Four cowrie shells</div>
        )}
      </div>

      <button className="divination-roll-btn" onClick={handleCast} disabled={casting}>
        {casting ? 'Casting...' : 'Cast Shells'}
      </button>

      {outcome && !casting && (
        <div className="divination-oracle-reading">
          <div className="divination-oracle-title">
            {outcome.name} — {outcome.verdict}
          </div>
          <div className="divination-oracle-count">{openCount} of 4 open</div>
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
        Obi divination. Names and verdicts from the Yoruba / If&#225; tradition.
      </div>
    </div>
  );
}
