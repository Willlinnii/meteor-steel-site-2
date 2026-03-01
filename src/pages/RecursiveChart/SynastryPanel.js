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
  detectRetrogrades,
  detectVoidOfCourseMoon,
  computeLunarNodes,
  computeFieldTopology,
  lonToSiderealSign,
} from '../../astrology/recursiveEngine';
import {
  analyzePositions,
  aggregateDignities,
  detectMutualReceptions,
  detectAspectPatterns,
  analyzeSynastryAspects,
  findSynastryPatterns,
} from '../../astrology/chartAnalysis';
import {
  narrateSynastryAspect,
  narrateRecursiveSynastry,
  narrateSynastrySynopsis,
  narrateMutualReception,
  narrateLunarNodes,
  narrateFieldInfluence,
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
        <SynastryResults
          result={synastryResult}
          natalChart={natalChart}
          chart2={chart2}
          transitDate={transitDate}
        />
      )}
    </div>
  );
}

/* ── Collapsible section helper ── */
function CollapsibleCard({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rc-transit-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{open ? '▼' : '▶'}</span>
        {title}
      </h4>
      {open && <div onClick={e => e.stopPropagation()} style={{ cursor: 'default', marginTop: 8 }}>{children}</div>}
    </div>
  );
}

function SynastryResults({ result, natalChart, chart2, transitDate }) {
  const { synastry, recursive, analysis, patterns, synopsis } = result;
  const [showSidereal, setShowSidereal] = useState(false);

  // ── Derived data for new sections ──
  const pos1 = natalChart?.planets || {};
  const pos2 = chart2?.planets || chart2?.chart?.planets || {};

  const bd1 = natalChart?.birthData;
  const bd2 = chart2?.birthData || chart2?.chart?.birthData;
  const date1 = useMemo(() =>
    bd1 ? new Date(bd1.year, (bd1.month || 1) - 1, bd1.day || 1) : new Date(),
    [bd1]
  );
  const date2 = useMemo(() =>
    bd2 ? new Date(bd2.year, (bd2.month || 1) - 1, bd2.day || 1) : new Date(),
    [bd2]
  );

  // a. Elemental & Modality balance
  const analysis1 = useMemo(() => analyzePositions(pos1), [pos1]);
  const analysis2 = useMemo(() => analyzePositions(pos2), [pos2]);

  // b. Dignity
  const dignities1 = useMemo(() => aggregateDignities(pos1), [pos1]);
  const dignities2 = useMemo(() => aggregateDignities(pos2), [pos2]);
  const mutualReceptions = useMemo(() => {
    const combined = { ...pos1 };
    for (const [k, v] of Object.entries(pos2)) {
      combined[`P2_${k}`] = v;
    }
    return detectMutualReceptions(combined);
  }, [pos1, pos2]);
  const receptionNarrative = useMemo(() => narrateMutualReception(mutualReceptions), [mutualReceptions]);

  // c. Retrogrades
  const retro1 = useMemo(() => detectRetrogrades(date1), [date1]);
  const retro2 = useMemo(() => detectRetrogrades(date2), [date2]);
  const voc1 = useMemo(() => detectVoidOfCourseMoon(date1), [date1]);
  const voc2 = useMemo(() => detectVoidOfCourseMoon(date2), [date2]);

  // d. Aspect patterns on cross-aspects
  const aspectPatterns = useMemo(() => detectAspectPatterns(synastry.crossAspects), [synastry.crossAspects]);

  // e. Lunar nodes
  const nodes1 = useMemo(() => computeLunarNodes(date1), [date1]);
  const nodes2 = useMemo(() => computeLunarNodes(date2), [date2]);
  const nodesNarrative1 = useMemo(() => narrateLunarNodes(nodes1, 'personal'), [nodes1]);
  const nodesNarrative2 = useMemo(() => narrateLunarNodes(nodes2, 'personal'), [nodes2]);

  // f. EM field
  const fieldTopo1 = useMemo(() => computeFieldTopology('Earth', date1), [date1]);
  const fieldTopo2 = useMemo(() => computeFieldTopology('Earth', date2), [date2]);

  // g. Sidereal positions
  const sidereal1 = useMemo(() => {
    const result = {};
    for (const [name, data] of Object.entries(pos1)) {
      if (data?.longitude != null) {
        result[name] = lonToSiderealSign(data.longitude, date1);
      }
    }
    return result;
  }, [pos1, date1]);
  const sidereal2 = useMemo(() => {
    const result = {};
    for (const [name, data] of Object.entries(pos2)) {
      if (data?.longitude != null) {
        result[name] = lonToSiderealSign(data.longitude, date2);
      }
    }
    return result;
  }, [pos2, date2]);

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

      {/* ──── NEW SECTIONS ──── */}

      {/* a. Elemental & Modality Balance */}
      <CollapsibleCard title="Elemental & Modality Balance">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            <ElementModDisplay analysis={analysis1} />
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            <ElementModDisplay analysis={analysis2} />
          </div>
        </div>
        {analysis1.dominantElement && analysis2.dominantElement && (
          <p className="rc-narrative" style={{ marginTop: 8 }}>
            {analysis1.dominantElement === analysis2.dominantElement
              ? `Both charts emphasize ${analysis1.dominantElement} — a shared elemental language that creates natural understanding.`
              : `Complementary elements: Person 1 leads with ${analysis1.dominantElement}, Person 2 with ${analysis2.dominantElement}. ${getElementPairNote(analysis1.dominantElement, analysis2.dominantElement)}`
            }
          </p>
        )}
      </CollapsibleCard>

      {/* b. Dignity Comparison */}
      <CollapsibleCard title="Dignity Comparison">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            <DignityDisplay dignities={dignities1} />
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            <DignityDisplay dignities={dignities2} />
          </div>
        </div>
        {mutualReceptions.length > 0 && (
          <>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem', marginTop: 12 }}>Cross-Chart Mutual Receptions</h4>
            <p className="rc-narrative">{receptionNarrative}</p>
          </>
        )}
      </CollapsibleCard>

      {/* c. Retrograde & Void-of-Course */}
      <CollapsibleCard title="Retrograde & Void-of-Course">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            <RetroDisplay retrogrades={retro1} voc={voc1} />
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            <RetroDisplay retrogrades={retro2} voc={voc2} />
          </div>
        </div>
      </CollapsibleCard>

      {/* d. Aspect Patterns */}
      {(aspectPatterns.grandTrines?.length > 0 || aspectPatterns.tSquares?.length > 0 || aspectPatterns.yods?.length > 0) && (
        <CollapsibleCard title="Cross-Chart Aspect Patterns">
          {aspectPatterns.grandTrines?.length > 0 && (
            <>
              <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Grand Trines</h4>
              {aspectPatterns.grandTrines.map((gt, i) => (
                <div key={i} className="rc-transit-card" style={{ margin: '4px 0' }}>
                  <p className="rc-narrative">
                    {gt.planets?.join(' — ') || `Triangle ${i + 1}`} — a flowing circuit of ease spanning both charts.
                  </p>
                </div>
              ))}
            </>
          )}
          {aspectPatterns.tSquares?.length > 0 && (
            <>
              <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>T-Squares</h4>
              {aspectPatterns.tSquares.map((ts, i) => (
                <div key={i} className="rc-transit-card" style={{ margin: '4px 0' }}>
                  <p className="rc-narrative">
                    {ts.planets?.join(' — ') || `T-Square ${i + 1}`} — dynamic tension that drives growth in the relationship.
                  </p>
                </div>
              ))}
            </>
          )}
          {aspectPatterns.yods?.length > 0 && (
            <>
              <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Yods (Fingers of Fate)</h4>
              {aspectPatterns.yods.map((y, i) => (
                <div key={i} className="rc-transit-card" style={{ margin: '4px 0' }}>
                  <p className="rc-narrative">
                    {y.planets?.join(' — ') || `Yod ${i + 1}`} — a fated configuration pointing toward shared purpose.
                  </p>
                </div>
              ))}
            </>
          )}
        </CollapsibleCard>
      )}

      {/* e. Lunar Nodes */}
      <CollapsibleCard title="Lunar Nodes (Karmic Axis)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            {nodes1 && (
              <>
                <p className="rc-narrative" style={{ fontSize: '0.8rem' }}>
                  North Node: {nodes1.northNode?.sign} {nodes1.northNode?.degree != null ? `${Math.round(nodes1.northNode.degree)}°` : ''}
                </p>
                <p className="rc-narrative" style={{ fontSize: '0.8rem' }}>
                  South Node: {nodes1.southNode?.sign} {nodes1.southNode?.degree != null ? `${Math.round(nodes1.southNode.degree)}°` : ''}
                </p>
                {nodesNarrative1 && <p className="rc-narrative">{nodesNarrative1}</p>}
              </>
            )}
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            {nodes2 && (
              <>
                <p className="rc-narrative" style={{ fontSize: '0.8rem' }}>
                  North Node: {nodes2.northNode?.sign} {nodes2.northNode?.degree != null ? `${Math.round(nodes2.northNode.degree)}°` : ''}
                </p>
                <p className="rc-narrative" style={{ fontSize: '0.8rem' }}>
                  South Node: {nodes2.southNode?.sign} {nodes2.southNode?.degree != null ? `${Math.round(nodes2.southNode.degree)}°` : ''}
                </p>
                {nodesNarrative2 && <p className="rc-narrative">{nodesNarrative2}</p>}
              </>
            )}
          </div>
        </div>
      </CollapsibleCard>

      {/* f. Electromagnetic Field Interaction */}
      <CollapsibleCard title="Electromagnetic Field Interaction">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            <FieldDisplay fieldTopo={fieldTopo1} date={date1} crossAspects={synastry.crossAspects} label="1" />
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            <FieldDisplay fieldTopo={fieldTopo2} date={date2} crossAspects={synastry.crossAspects} label="2" />
          </div>
        </div>
      </CollapsibleCard>

      {/* g. Sidereal (Vedic) Perspective Toggle */}
      <CollapsibleCard title="Sidereal (Vedic) Perspective">
        <p className="rc-narrative" style={{ marginBottom: 8, opacity: 0.7 }}>
          Western astrology uses the tropical zodiac (tied to equinoxes). Vedic astrology uses the sidereal zodiac (tied to fixed stars). The ~24° difference often shifts sign placements.
        </p>
        <button
          className="rc-synastry-compute-btn"
          style={{ marginBottom: 8, fontSize: '0.75rem', padding: '4px 12px' }}
          onClick={(e) => { e.stopPropagation(); setShowSidereal(s => !s); }}
        >
          {showSidereal ? 'Show Tropical' : 'Show Sidereal'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 1</h4>
            <SiderealDisplay
              tropicalPos={pos1}
              siderealPos={sidereal1}
              showSidereal={showSidereal}
            />
          </div>
          <div>
            <h4 className="recursive-reading-subtitle" style={{ fontSize: '0.8rem' }}>Person 2</h4>
            <SiderealDisplay
              tropicalPos={pos2}
              siderealPos={sidereal2}
              showSidereal={showSidereal}
            />
          </div>
        </div>
      </CollapsibleCard>

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

/* ── Helpers ── */

const ELEMENT_PAIR_NOTES = {
  'fire-water': 'Fire and water create steam — passionate but volatile.',
  'fire-earth': 'Fire and earth: vision meets follow-through, if neither smothers the other.',
  'fire-air': 'Fire and air feed each other — ideas ignite quickly between you.',
  'earth-water': 'Earth and water nurture growth — a grounding, fertile combination.',
  'earth-air': 'Earth and air balance the practical with the conceptual.',
  'air-water': 'Air and water: thought and feeling in dialogue — rich but sometimes misty.',
};

function getElementPairNote(el1, el2) {
  const key = [el1, el2].sort().join('-');
  return ELEMENT_PAIR_NOTES[key] || 'Different elemental emphases bring variety to the connection.';
}

/* ── Sub-components for new sections ── */

function ElementModDisplay({ analysis }) {
  if (!analysis) return null;
  const elements = analysis.elements || {};
  const modalities = analysis.modalities || {};
  return (
    <div style={{ fontSize: '0.8rem' }}>
      <div style={{ marginBottom: 4 }}>
        {['fire', 'earth', 'air', 'water'].map(el => (
          <span key={el} style={{ marginRight: 8 }}>
            <span style={{ textTransform: 'capitalize' }}>{el}</span>: <strong>{elements[el] || 0}</strong>
          </span>
        ))}
      </div>
      <div>
        {['cardinal', 'fixed', 'mutable'].map(mod => (
          <span key={mod} style={{ marginRight: 8 }}>
            <span style={{ textTransform: 'capitalize' }}>{mod}</span>: <strong>{modalities[mod] || 0}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function DignityDisplay({ dignities }) {
  if (!dignities) return null;
  return (
    <div style={{ fontSize: '0.8rem' }}>
      {dignities.dignified?.length > 0 && (
        <p style={{ margin: '2px 0' }}>Dignified: {dignities.dignified.join(', ')}</p>
      )}
      {dignities.debilitated?.length > 0 && (
        <p style={{ margin: '2px 0' }}>Debilitated: {dignities.debilitated.join(', ')}</p>
      )}
      {dignities.summary && <p className="rc-narrative">{dignities.summary}</p>}
    </div>
  );
}

function RetroDisplay({ retrogrades, voc }) {
  const retroPlanets = retrogrades
    ? Object.entries(retrogrades).filter(([, v]) => v?.retrograde).map(([k]) => k)
    : [];
  return (
    <div style={{ fontSize: '0.8rem' }}>
      {retroPlanets.length > 0 ? (
        <p style={{ margin: '2px 0' }}>Retrograde: {retroPlanets.join(', ')}</p>
      ) : (
        <p style={{ margin: '2px 0', opacity: 0.6 }}>No retrogrades</p>
      )}
      {voc && (
        <p style={{ margin: '2px 0' }}>
          Moon void-of-course: {voc.isVoid ? 'Yes' : 'No'}
        </p>
      )}
    </div>
  );
}

function FieldDisplay({ fieldTopo, date, crossAspects, label }) {
  if (!fieldTopo || !Array.isArray(fieldTopo) || fieldTopo.length === 0) {
    return <p className="rc-narrative" style={{ fontSize: '0.8rem', opacity: 0.6 }}>No field data</p>;
  }
  const key = fieldTopo.slice(0, 3);
  return (
    <div style={{ fontSize: '0.8rem' }}>
      {key.map((f, i) => {
        const narrative = narrateFieldInfluence(f.body, f, crossAspects, null);
        return (
          <div key={i} style={{ marginBottom: 4 }}>
            <span style={{ color: PLANET_COLORS[f.body] }}>
              {PLANET_GLYPHS[f.body] || f.body}
            </span>
            {' '}{f.fieldType} ({(f.fieldStrength || 0).toFixed(1)})
            {narrative && <p className="rc-narrative" style={{ margin: '2px 0' }}>{narrative}</p>}
          </div>
        );
      })}
    </div>
  );
}

function SiderealDisplay({ tropicalPos, siderealPos, showSidereal }) {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  return (
    <div style={{ fontSize: '0.8rem' }}>
      {planets.map(p => {
        const trop = tropicalPos[p];
        const sid = siderealPos[p];
        if (!trop) return null;
        const tropSign = trop.sign || '?';
        const sidSign = sid?.sign || '?';
        const shifted = tropSign !== sidSign;
        return (
          <div key={p} style={{ marginBottom: 2 }}>
            <span style={{ color: PLANET_COLORS[p] }}>
              {PLANET_GLYPHS[p] || p}
            </span>
            {' '}
            {showSidereal ? (
              <span>
                {sidSign}{shifted && <span style={{ opacity: 0.5 }}> (tropical: {tropSign})</span>}
              </span>
            ) : (
              <span>
                {tropSign}{shifted && <span style={{ opacity: 0.5 }}> (sidereal: {sidSign})</span>}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
