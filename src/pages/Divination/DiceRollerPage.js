import React, { useState, useCallback, useMemo } from 'react';
import { rollD4, rollD6, rollD8, rollD12, rollD20 } from '../../games/shared/diceEngine';
import { D6Display, D4Display, D8Display, D12Display, D20Display } from '../../games/shared/DiceDisplay';
import { reduceToDigit, NUMBER_MEANINGS } from '../../profile/numerologyEngine';

const DICE = [
  { key: 'd4', label: 'D4', solid: 'Tetrahedron', roll: rollD4, maxCount: 1 },
  { key: 'd6', label: 'D6', solid: 'Cube', roll: rollD6, maxCount: 2 },
  { key: 'd8', label: 'D8', solid: 'Octahedron', roll: rollD8, maxCount: 1 },
  { key: 'd12', label: 'D12', solid: 'Dodecahedron', roll: rollD12, maxCount: 1 },
  { key: 'd20', label: 'D20', solid: 'Icosahedron', roll: rollD20, maxCount: 1 },
];

const DISPLAY_MAP = { d4: D4Display, d6: D6Display, d8: D8Display, d12: D12Display, d20: D20Display };

export default function DiceRollerPage() {
  // counts: 0 = off, 1 = one die, 2 = two dice (d6 only)
  const [counts, setCounts] = useState({ d4: 0, d6: 1, d8: 0, d12: 0, d20: 0 });
  const [results, setResults] = useState({});
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);

  const cycleDie = useCallback((key, maxCount) => {
    setCounts(prev => ({ ...prev, [key]: (prev[key] + 1) % (maxCount + 1) }));
  }, []);

  // Build flat list: [{key, label, roll, instanceId}, ...]
  const activeDice = useMemo(() => {
    const list = [];
    DICE.forEach(d => {
      const n = counts[d.key] || 0;
      for (let i = 0; i < n; i++) {
        list.push({
          ...d,
          instanceId: n > 1 ? `${d.key}-${i + 1}` : d.key,
          instanceLabel: n > 1 ? `${d.label} #${i + 1}` : d.label,
        });
      }
    });
    return list;
  }, [counts]);

  const hasAny = activeDice.length > 0;

  const handleRoll = useCallback(() => {
    if (!hasAny) return;
    setRolling(true);

    const flickerInterval = setInterval(() => {
      const flicker = {};
      activeDice.forEach(d => { flicker[d.instanceId] = d.roll(); });
      setResults(flicker);
    }, 80);

    setTimeout(() => {
      clearInterval(flickerInterval);
      const final = {};
      activeDice.forEach(d => { final[d.instanceId] = d.roll(); });
      setResults(final);
      setRolling(false);

      const total = activeDice.reduce((sum, d) => sum + final[d.instanceId], 0);
      const parts = activeDice.map(d => `${d.label.replace(' ', '')}:${final[d.instanceId]}`).join(' ');
      const display = activeDice.length === 1 ? String(final[activeDice[0].instanceId]) : `${parts} = ${total}`;
      setHistory(prev => [display, ...prev].slice(0, 20));
    }, 500);
  }, [activeDice, hasAny]);

  const total = hasAny ? activeDice.reduce((sum, d) => sum + (results[d.instanceId] || 0), 0) : 0;
  const hasResults = Object.keys(results).length > 0;
  const reduced = hasResults && total > 0 ? reduceToDigit(total) : null;
  const meaning = reduced ? NUMBER_MEANINGS[reduced] : null;

  return (
    <div className="divination-dice">
      <div className="divination-dice-selector">
        {DICE.map(d => {
          const n = counts[d.key];
          return (
            <button
              key={d.key}
              className={`divination-dice-selector-btn${n > 0 ? ' active' : ''}`}
              onClick={() => cycleDie(d.key, d.maxCount)}
            >
              {d.maxCount > 1 && n > 0 ? `${n}${d.label}` : d.label}
              <span className="dice-solid-name">{d.solid}</span>
              {d.maxCount > 1 && (
                <span className="dice-count-pips">
                  {Array.from({ length: d.maxCount }, (_, i) => (
                    <span key={i} className={`dice-count-pip${i < n ? ' filled' : ''}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="divination-dice-display">
        {!hasAny && (
          <div className="divination-dice-result" style={{ opacity: 0.2, fontSize: '1.2rem' }}>Select dice to roll</div>
        )}
        {hasAny && !hasResults && (
          <div className="divination-dice-result" style={{ opacity: 0.2 }}>?</div>
        )}
        {hasAny && hasResults && (
          <div className="divination-dice-tray">
            {activeDice.map(d => {
              const Comp = DISPLAY_MAP[d.key];
              const val = results[d.instanceId] || 1;
              return (
                <div key={d.instanceId} className="divination-dice-tray-item">
                  <Comp value={val} rolling={rolling} />
                  <span className="divination-dice-tray-label">{d.instanceLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasAny && hasResults && activeDice.length > 1 && (
        <div className={`divination-dice-total${rolling ? ' rolling' : ''}`}>
          Total: {total}
        </div>
      )}

      <button className="divination-roll-btn" onClick={handleRoll} disabled={rolling || !hasAny}>
        {rolling ? 'Rolling...' : 'Roll'}
      </button>

      {meaning && !rolling && (
        <div className="divination-dice-numerology">
          <div className="divination-dice-numerology-number">{reduced}</div>
          {total !== reduced && (
            <div className="divination-dice-numerology-reduction">
              {total} &rarr; {reduced}
            </div>
          )}
          <div className="divination-dice-numerology-meaning">{meaning}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="divination-dice-history">
          {history.map((val, i) => (
            <div key={i} className="divination-dice-history-item">{val}</div>
          ))}
        </div>
      )}

      <div className="divination-oracle-source">
        Pythagorean digit reduction. Number symbolism from the{' '}
        <em>Theologumena Arithmeticae</em> (attr. Iamblichus, c. 300 CE,
        after Nicomachus of Gerasa). Master numbers (11, 22, 33) are a modern
        addition (Balliett, c. 1900).
      </div>
    </div>
  );
}
