import React, { useState, useMemo } from 'react';
import {
  PERSPECTIVE_THEMES,
  PLANET_GLYPHS,
  PLANET_COLORS,
  HOUSE_MEANINGS,
} from '../../data/recursiveRules';
import {
  computeSynastry,
  computeRecursiveSynastry,
} from '../../astrology/recursiveEngine';
import {
  analyzeSynastryAspects,
  findSynastryPatterns,
} from '../../astrology/chartAnalysis';
import {
  narrateSynastryAspect,
  narrateRecursiveSynastry,
  narrateSynastrySynopsis,
} from '../../astrology/narrativeBridge';

/**
 * SynastryPanel — dedicated reading panel for comparing two charts.
 *
 * Person 1 = the user's natal chart (from profile).
 * Person 2 = transient data entered in this panel (React state only, not stored).
 */
export default function SynastryPanel({ natalChart, transitDate }) {
  const [chart2Input, setChart2Input] = useState({
    year: '', month: '', day: '', hour: '', minute: '',
  });
  const [chart2, setChart2] = useState(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);

  // Compute chart2 via existing API endpoint
  const handleCompute = async () => {
    const { year, month, day, hour, minute } = chart2Input;
    if (!year || !month || !day) {
      setError('Please enter at least year, month, and day.');
      return;
    }
    setComputing(true);
    setError(null);

    try {
      const resp = await fetch('/api/celestial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'natal',
          birthData: {
            year: +year,
            month: +month,
            day: +day,
            hour: hour ? +hour : 12,
            minute: minute ? +minute : 0,
          },
        }),
      });

      if (!resp.ok) throw new Error('Failed to compute chart');
      const data = await resp.json();
      setChart2(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setComputing(false);
    }
  };

  // Synastry computation
  const synastryResult = useMemo(() => {
    if (!natalChart || !chart2) return null;
    try {
      const synastry = computeSynastry(natalChart, chart2);
      const recursive = computeRecursiveSynastry(natalChart, chart2, transitDate);
      const analysis = analyzeSynastryAspects(synastry.crossAspects);
      const patterns = findSynastryPatterns(synastry.crossAspects);
      const synopsis = narrateSynastrySynopsis(synastry, analysis, patterns);
      return { synastry, recursive, analysis, patterns, synopsis };
    } catch (err) {
      console.error('Synastry computation error:', err);
      return null;
    }
  }, [natalChart, chart2, transitDate]);

  return (
    <div className="rc-synastry-panel">
      <h3 className="recursive-reading-title">Synastry</h3>
      <p className="recursive-reading-text" style={{ opacity: 0.7 }}>
        Compare two birth charts. Person 1 is your chart. Enter Person 2 below.
      </p>

      {/* Person 2 input form */}
      <div className="rc-synastry-form">
        <div className="rc-synastry-inputs">
          <input
            type="number" placeholder="Year" value={chart2Input.year}
            onChange={e => setChart2Input(prev => ({ ...prev, year: e.target.value }))}
            className="rc-synastry-input"
          />
          <input
            type="number" placeholder="Month" min="1" max="12" value={chart2Input.month}
            onChange={e => setChart2Input(prev => ({ ...prev, month: e.target.value }))}
            className="rc-synastry-input rc-synastry-input-sm"
          />
          <input
            type="number" placeholder="Day" min="1" max="31" value={chart2Input.day}
            onChange={e => setChart2Input(prev => ({ ...prev, day: e.target.value }))}
            className="rc-synastry-input rc-synastry-input-sm"
          />
          <input
            type="number" placeholder="Hour" min="0" max="23" value={chart2Input.hour}
            onChange={e => setChart2Input(prev => ({ ...prev, hour: e.target.value }))}
            className="rc-synastry-input rc-synastry-input-sm"
          />
          <input
            type="number" placeholder="Min" min="0" max="59" value={chart2Input.minute}
            onChange={e => setChart2Input(prev => ({ ...prev, minute: e.target.value }))}
            className="rc-synastry-input rc-synastry-input-sm"
          />
        </div>
        <button
          className="rc-synastry-compute-btn"
          onClick={handleCompute}
          disabled={computing}
        >
          {computing ? 'Computing...' : 'Compare Charts'}
        </button>
        {error && <p className="rc-synastry-error">{error}</p>}
      </div>

      {/* Results */}
      {synastryResult && (
        <SynastryResults result={synastryResult} />
      )}
    </div>
  );
}

function SynastryResults({ result }) {
  const { synastry, recursive, analysis, patterns, synopsis } = result;

  return (
    <div className="rc-synastry-results">
      {/* Synopsis */}
      {synopsis && (
        <div className="rc-synopsis">
          <h4 className="rc-synopsis-label">Synastry Synopsis</h4>
          <p className="rc-synopsis-text">{synopsis}</p>
        </div>
      )}

      {/* Double whammies */}
      {patterns.length > 0 && (
        <>
          <h4 className="recursive-reading-subtitle">Double Whammies</h4>
          {patterns.map((dw, i) => (
            <div key={i} className="rc-transit-card">
              <div className="rc-transit-header">
                <span style={{ color: PLANET_COLORS[dw.planet1] }}>
                  {PLANET_GLYPHS[dw.planet1] || dw.planet1}
                </span>
                <span className="rc-transit-aspect">
                  {dw.aspect1} / {dw.aspect2}
                </span>
                <span style={{ color: PLANET_COLORS[dw.planet2] }}>
                  {PLANET_GLYPHS[dw.planet2] || dw.planet2}
                </span>
              </div>
              <p className="rc-narrative">
                Mutual aspect between {dw.planet1} and {dw.planet2} — the connection is felt from both sides.
              </p>
            </div>
          ))}
        </>
      )}

      {/* Cross-aspects */}
      <h4 className="recursive-reading-subtitle">
        Cross-Aspects ({synastry.crossAspects.length})
      </h4>
      <div className="rc-synastry-aspects">
        {synastry.crossAspects.slice(0, 15).map((a, i) => {
          const narrative = narrateSynastryAspect(a);
          return (
            <div key={i} className="rc-transit-card">
              <div className="rc-transit-header">
                <span style={{ color: PLANET_COLORS[a.planet1] }}>
                  {PLANET_GLYPHS[a.planet1] || a.planet1}
                </span>
                <span className="rc-transit-aspect">{a.aspect}</span>
                <span style={{ color: PLANET_COLORS[a.planet2] }}>
                  {PLANET_GLYPHS[a.planet2] || a.planet2}
                </span>
                <span className="rc-transit-orb">
                  ({a.orb}&deg;{a.exact ? ' exact' : ''})
                </span>
              </div>
              {narrative && <p className="rc-narrative">{narrative}</p>}
            </div>
          );
        })}
        {synastry.crossAspects.length > 15 && (
          <p className="recursive-reading-text" style={{ opacity: 0.5 }}>
            ...and {synastry.crossAspects.length - 15} more
          </p>
        )}
      </div>

      {/* House overlays */}
      {Object.keys(synastry.houseOverlays1).length > 0 && (
        <>
          <h4 className="recursive-reading-subtitle">
            Person 2's Planets in Your Houses
          </h4>
          <div className="rc-synastry-overlays">
            {Object.entries(synastry.houseOverlays1).map(([planet, house]) => {
              const meaning = HOUSE_MEANINGS[house];
              return (
                <div key={planet} className="rc-prog-badge">
                  <span style={{ color: PLANET_COLORS[planet] }}>
                    {PLANET_GLYPHS[planet] || planet}
                  </span>
                  <span className="rc-prog-label">House {house}</span>
                  {meaning && <span className="rc-prog-value">{meaning.name}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recursive perspective — how each planet sees the relationship */}
      {recursive?.perspectives && (
        <>
          <h4 className="recursive-reading-subtitle">Recursive Perspective</h4>
          <p className="recursive-reading-text" style={{ opacity: 0.6 }}>
            How each planet sees the relationship from its own vantage point.
          </p>
          {['Sun', 'Moon', 'Venus', 'Mars', 'Mercury', 'Jupiter', 'Saturn'].map(planet => {
            const persp = recursive.perspectives[planet];
            if (!persp) return null;
            const theme = PERSPECTIVE_THEMES[planet];
            const narrative = narrateRecursiveSynastry(planet, persp);
            return (
              <div key={planet} className="recursive-perspective-card">
                <div className="recursive-perspective-card-header">
                  <span className="recursive-perspective-card-symbol" style={{ color: theme?.color }}>
                    {theme?.symbol || ''}
                  </span>
                  <span className="recursive-perspective-card-name" style={{ color: theme?.color }}>
                    {planet} — {theme?.label || planet}
                  </span>
                </div>
                {narrative && <p className="rc-narrative">{narrative}</p>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
