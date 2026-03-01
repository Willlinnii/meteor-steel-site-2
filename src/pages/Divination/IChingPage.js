import React, { useState, useCallback } from 'react';
import {
  HEXAGRAMS, TRIGRAMS, lookupHexagram,
  tossLine, tossToLine, isChanging, changedLine,
} from '../../data/ichingData';

/** Render a single hexagram line (yang = solid, yin = broken). */
function HexLine({ yang, changing, revealed }) {
  if (!revealed) return <div className="iching-line empty" />;
  return (
    <div className={`iching-line${yang ? ' yang' : ' yin'}${changing ? ' changing' : ''}`}>
      {yang ? (
        <div className="iching-line-solid" />
      ) : (
        <div className="iching-line-broken">
          <span /><span />
        </div>
      )}
      {changing && <span className="iching-line-mark">{yang ? '○' : '×'}</span>}
    </div>
  );
}

function HexagramDisplay({ lines, changingFlags, label }) {
  if (!lines) return null;
  const hex = lookupHexagram(lines);
  if (!hex) return null;
  const lower = TRIGRAMS.find(t => t.name === hex.lo);
  const upper = TRIGRAMS.find(t => t.name === hex.up);
  return (
    <div className="iching-hexagram-block">
      {label && <div className="iching-hex-label">{label}</div>}
      <div className="iching-hex-lines">
        {[...lines].reverse().map((l, i) => {
          const lineIdx = 5 - i;
          return (
            <HexLine
              key={lineIdx}
              yang={l === 1}
              changing={changingFlags ? changingFlags[lineIdx] : false}
              revealed
            />
          );
        })}
      </div>
      <div className="iching-hex-name">
        {hex.n}. {hex.name} — {hex.ch}
      </div>
      {upper && lower && (
        <div className="iching-hex-trigrams">
          {upper.symbol} {upper.name} over {lower.symbol} {lower.name}
        </div>
      )}
      <div className="iching-hex-judgment">{hex.judgment}</div>
    </div>
  );
}

export default function IChingPage() {
  const [tosses, setTosses] = useState(null); // [{coins, sum}, ...] × 6
  const [revealed, setRevealed] = useState(0); // how many lines revealed (0-6)
  const [casting, setCasting] = useState(false);
  const [history, setHistory] = useState([]);

  const handleCast = useCallback(() => {
    setCasting(true);
    setRevealed(0);
    setTosses(null);

    // Generate all 6 tosses up front
    const allTosses = Array.from({ length: 6 }, () => tossLine());
    setTosses(allTosses);

    // Staggered reveal: one line every 350ms
    for (let i = 0; i < 6; i++) {
      setTimeout(() => setRevealed(i + 1), 350 * (i + 1));
    }
    setTimeout(() => {
      setCasting(false);
      const primary = allTosses.map(t => tossToLine(t.sum));
      const hex = lookupHexagram(primary);
      if (hex) setHistory(prev => [`${hex.n}. ${hex.name}`, ...prev].slice(0, 20));
    }, 350 * 6 + 200);
  }, []);

  const primaryLines = tosses ? tosses.map(t => tossToLine(t.sum)) : null;
  const changingFlags = tosses ? tosses.map(t => isChanging(t.sum)) : null;
  const hasChanging = changingFlags ? changingFlags.some(Boolean) : false;
  const changedLines = tosses ? tosses.map(t => changedLine(t.sum)) : null;

  const allRevealed = revealed >= 6 && !casting;

  return (
    <div className="divination-oracle divination-iching">
      {/* Coin results */}
      {tosses && (
        <div className="iching-coins-panel">
          {tosses.map((t, i) => (
            <div key={i} className={`iching-coin-row${i < revealed ? ' visible' : ''}`}>
              <span className="iching-coin-line-num">{i + 1}</span>
              {t.coins.map((c, j) => (
                <span key={j} className={`iching-coin${c === 3 ? ' heads' : ' tails'}`}>
                  {c === 3 ? 'H' : 'T'}
                </span>
              ))}
              <span className="iching-coin-sum">= {t.sum}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hexagram display */}
      {allRevealed && primaryLines && (
        <div className="iching-reading">
          <HexagramDisplay
            lines={primaryLines}
            changingFlags={changingFlags}
            label="Primary Hexagram"
          />
          {hasChanging && (
            <HexagramDisplay
              lines={changedLines}
              changingFlags={null}
              label="Relating Hexagram"
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {!tosses && (
        <div className="divination-oracle-tray">
          <div className="divination-oracle-empty">
            Three coins, six lines — cast to build a hexagram
          </div>
        </div>
      )}

      <button className="divination-roll-btn" onClick={handleCast} disabled={casting}>
        {casting ? 'Casting...' : 'Cast Coins'}
      </button>

      {history.length > 0 && (
        <div className="divination-oracle-history">
          {history.map((val, i) => (
            <div key={i} className="divination-oracle-history-item">{val}</div>
          ))}
        </div>
      )}
    </div>
  );
}
