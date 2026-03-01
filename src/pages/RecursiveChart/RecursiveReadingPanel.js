import React from 'react';
import {
  PERSPECTIVE_THEMES,
  PERSPECTIVE_DESCRIPTIONS,
  ASPECT_MEANINGS,
  ASPECT_COLORS,
  PLANET_GLYPHS,
  PLANET_COLORS,
  READING_SECTIONS,
  WEATHER_READING_SECTIONS,
  EM_READING_SECTION,
  EM_FIELD_MEANINGS,
  WEATHER_DESCRIPTIONS,
  ZODIAC_FRAME_DESCRIPTIONS,
  HOUSE_MEANINGS,
  TRANSIT_ACTIVATION_MEANINGS,
  PROGRESSION_MEANINGS,
  getSolarCycleRule,
} from '../../data/recursiveRules';
import { EM_INTERPRETATIONS, PLANETARY_PHYSICS } from '../../data/planetaryPhysics';
import { lonToSiderealSign, getLahiriAyanamsa, computeShiftAnalysis, computeSecondaryProgressions } from '../../astrology/recursiveEngine';
import {
  generateSynopsis, analyzePositions, findNotableAspects, aggregateDignities,
  detectAspectPatterns, computeTransitAspects, findCrossPerspectiveResonance,
  analyzeHouses, computePartOfFortune, detectMutualReceptions,
  computeProgressedAspects, detectProgressedIngresses,
} from '../../astrology/chartAnalysis';
import { getDignity } from '../../data/planetCharacters';
import {
  narratePosition,
  narrateAspect,
  narrateShift,
  narrateSynopsis,
  narratePerspective,
  narrateSectionIntro,
  narrateNatalPosition,
  narrateNatalAspect,
  narrateNatalSynopsis,
  narrateHousePlacement,
  narrateAngles,
  narrateLunarNodes,
  narratePartOfFortune,
  narrateMutualReception,
  narrateTransitActivation,
  narrateDeepPerspective,
  narrateProgression,
  narrateProgressedAspect,
} from '../../astrology/narrativeBridge';

/** Render position rows with optional sidereal conversion and narrative text. */
function PositionRows({ positions, selectedPlanet, zodiacFrame, date, narratives, retrogrades }) {
  if (!positions) return null;

  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));

  if (!rows.length) return null;

  const displayRow = (r) => {
    if (zodiacFrame === 'sidereal' && date && r.longitude != null) {
      const sid = lonToSiderealSign(r.longitude, date);
      return { ...r, sign: sid.sign, degree: sid.degree };
    }
    return r;
  };

  return (
    <div className="recursive-positions-grid">
      {rows.map(r => {
        const d = displayRow(r);
        const narr = narratives?.[d.name];
        const retro = retrogrades?.[d.name];
        return (
          <React.Fragment key={d.name}>
            <div
              className={`recursive-position-row${selectedPlanet === d.name ? ' selected' : ''}`}
            >
              <span className="recursive-pos-symbol" style={{ color: PLANET_COLORS[d.name] || 'var(--accent-gold)' }}>
                {PLANET_GLYPHS[d.name] || ''}
              </span>
              <span className="recursive-pos-name">
                {d.name}
                {retro?.retrograde && <span className="rc-retro-badge">Rx</span>}
                {retro?.station && !retro.retrograde && <span className="rc-station-badge">S</span>}
              </span>
              <span className="recursive-pos-sign">{d.sign}</span>
              <span className="recursive-pos-degree">
                {typeof d.degree === 'number' ? d.degree.toFixed(1) + '°' : ''}
              </span>
            </div>
            {narr && <div className="rc-narrative">{narr}</div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Element colors for balance bars ──────────────────────────────────────────
const ELEMENT_COLORS = { fire: '#d06040', earth: '#908070', air: '#a0b8c0', water: '#4a7fb5' };
const MODALITY_COLORS = { cardinal: '#c9a961', fixed: '#8b9dc3', mutable: '#7fb892' };

/** Horizontal stacked bar showing element or modality balance. */
function BalanceBar({ counts, colors, label }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  return (
    <div className="rc-balance-bar-wrap">
      {label && <span className="rc-balance-label">{label}</span>}
      <div className="rc-balance-bar">
        {Object.entries(counts).map(([key, val]) => (
          val > 0 ? (
            <div
              key={key}
              className="rc-balance-segment"
              style={{
                width: `${(val / total) * 100}%`,
                background: colors[key] || '#888',
              }}
              title={`${key}: ${val}`}
            >
              <span className="rc-balance-count">{val}</span>
            </div>
          ) : null
        ))}
      </div>
      <div className="rc-balance-legend">
        {Object.entries(counts).map(([key, val]) => (
          val > 0 ? (
            <span key={key} className="rc-balance-legend-item" style={{ color: colors[key] }}>
              {key} {val}
            </span>
          ) : null
        ))}
      </div>
    </div>
  );
}

/** Element & Modality balance display. */
function ElementBalance({ positions }) {
  if (!positions) return null;
  const analysis = analyzePositions(positions);
  return (
    <div className="rc-element-balance">
      <BalanceBar counts={analysis.elements} colors={ELEMENT_COLORS} label="Elements" />
      <BalanceBar counts={analysis.modalities} colors={MODALITY_COLORS} label="Modality" />
      <p className="rc-balance-summary">
        Dominant: {analysis.dominantElement} ({analysis.dominantModality})
      </p>
    </div>
  );
}

/** Lunar phase indicator — small icon + phase name. */
function LunarPhaseIndicator({ lunarPhase }) {
  if (!lunarPhase || lunarPhase.phase === 'Unknown') return null;
  // SVG moon phases: filled circle variants
  const phaseIcon = lunarPhase.illumination > 90 ? '\u25CF'   // Full
    : lunarPhase.illumination < 10 ? '\u25CB'                  // New
    : lunarPhase.waxing ? '\u25D1' : '\u25D0';                 // Quarter variants
  return (
    <div className="rc-lunar-phase">
      <span className="rc-lunar-icon">{phaseIcon}</span>
      <span className="rc-lunar-name">{lunarPhase.phase}</span>
      <span className="rc-lunar-pct">{lunarPhase.illumination}%</span>
    </div>
  );
}

/** Dignity tally — shows dignified and debilitated planets. */
function DignityTally({ positions }) {
  if (!positions) return null;
  const d = aggregateDignities(positions);
  if (!d.dignified.length && !d.debilitated.length) return null;
  return (
    <p className="rc-dignity-tally">{d.summary}</p>
  );
}

/** Aspect Summary — tension/flow/fusion groups with tightest aspect. */
function AspectSummary({ aspects }) {
  const { tensions, flows, fusions, tightest } = findNotableAspects(aspects);
  if (!tensions.length && !flows.length && !fusions.length) return null;
  return (
    <div className="rc-aspect-summary">
      <div className="rc-aspect-summary-counts">
        {fusions.length > 0 && (
          <span className="rc-aspect-tag" style={{ color: ASPECT_COLORS.Conjunction }}>
            {fusions.length} fusion{fusions.length !== 1 ? 's' : ''}
          </span>
        )}
        {flows.length > 0 && (
          <span className="rc-aspect-tag" style={{ color: ASPECT_COLORS.Trine }}>
            {flows.length} flow{flows.length !== 1 ? 's' : ''}
          </span>
        )}
        {tensions.length > 0 && (
          <span className="rc-aspect-tag" style={{ color: ASPECT_COLORS.Square }}>
            {tensions.length} tension{tensions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {tightest && (
        <p className="rc-aspect-tightest">
          Tightest: {PLANET_GLYPHS[tightest.planet1] || tightest.planet1}{' '}
          {tightest.aspect}{' '}
          {PLANET_GLYPHS[tightest.planet2] || tightest.planet2}{' '}
          ({tightest.orb}&deg;)
        </p>
      )}
    </div>
  );
}

/** Aspect pattern display — Grand Trine, T-Square, Yod. */
function AspectPatterns({ aspects }) {
  if (!aspects || !aspects.length) return null;
  const { grandTrines, tSquares, yods } = detectAspectPatterns(aspects);
  if (!grandTrines.length && !tSquares.length && !yods.length) return null;
  return (
    <div className="rc-aspect-patterns">
      {grandTrines.map((gt, i) => (
        <div key={`gt-${i}`} className="rc-pattern-card rc-pattern-trine">
          <span className="rc-pattern-label">Grand Trine</span>
          <span className="rc-pattern-planets">{gt.planets.join(' — ')}</span>
        </div>
      ))}
      {tSquares.map((ts, i) => (
        <div key={`ts-${i}`} className="rc-pattern-card rc-pattern-square">
          <span className="rc-pattern-label">T-Square</span>
          <span className="rc-pattern-planets">{ts.planets.join(' — ')}</span>
          <span className="rc-pattern-note">apex: {ts.apex}</span>
        </div>
      ))}
      {yods.map((y, i) => (
        <div key={`yod-${i}`} className="rc-pattern-card rc-pattern-yod">
          <span className="rc-pattern-label">Yod</span>
          <span className="rc-pattern-planets">{y.planets.join(' — ')}</span>
          <span className="rc-pattern-note">apex: {y.apex}</span>
        </div>
      ))}
    </div>
  );
}

/** Transit-to-natal aspect list. */
function TransitAspectList({ transitPositions, natalPositions }) {
  const transitAspects = computeTransitAspects(transitPositions, natalPositions);
  if (!transitAspects.length) return null;
  return (
    <div className="rc-transit-aspects">
      <h4 className="recursive-reading-subtitle">Transit-to-Natal Aspects</h4>
      <ul className="recursive-aspect-list">
        {transitAspects.map((a, i) => (
          <li key={i} className={`recursive-aspect-item${a.exact ? ' rc-exact' : ''}`}>
            <span
              className="recursive-aspect-dot"
              style={{ background: ASPECT_COLORS[a.aspect] || '#888' }}
            />
            <span>
              Transit {PLANET_GLYPHS[a.transitPlanet] || a.transitPlanet}{' '}
              {a.aspect}{' '}
              natal {PLANET_GLYPHS[a.natalPlanet] || a.natalPlanet}{' '}
              ({a.orb}&deg;{a.exact ? ' — exact' : ''})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cross-perspective resonance map. */
function ResonanceMap({ perspectives }) {
  const { agreements, disagreements } = findCrossPerspectiveResonance(perspectives);
  if (!agreements.length && !disagreements.length) return null;
  return (
    <div className="rc-resonance-map">
      {agreements.length > 0 && (
        <div className="rc-resonance-group">
          <h5 className="rc-resonance-heading">Unanimous</h5>
          {agreements.map(a => (
            <p key={a.target} className="rc-resonance-item rc-resonance-agree">
              {PLANET_GLYPHS[a.target] || ''} {a.target} in {a.sign} from all perspectives
            </p>
          ))}
        </div>
      )}
      {disagreements.length > 0 && (
        <div className="rc-resonance-group">
          <h5 className="rc-resonance-heading">Contested</h5>
          {disagreements.map(d => {
            const signGroups = {};
            d.sightings.forEach(s => {
              if (!signGroups[s.sign]) signGroups[s.sign] = [];
              signGroups[s.sign].push(s.observer);
            });
            return (
              <p key={d.target} className="rc-resonance-item rc-resonance-disagree">
                {PLANET_GLYPHS[d.target] || ''} {d.target}:{' '}
                {Object.entries(signGroups).map(([sign, obs]) =>
                  `${sign} from ${obs.join(', ')}`
                ).join(' — ')}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Render shift analysis — what moved between two sets of positions. */
function ShiftAnalysis({ shifts, perspectiveKey, narratives }) {
  if (!shifts || !shifts.length) return null;

  const shifted = shifts.filter(s => s.shifted);
  const stable = shifts.filter(s => !s.shifted);

  return (
    <div className="recursive-shift-list">
      {shifted.map(s => {
        const narr = narratives?.[s.planet];
        return (
          <React.Fragment key={s.planet}>
            <div className="recursive-shift-row shifted">
              <span className="recursive-shift-planet" style={{ color: PLANET_COLORS[s.planet] }}>
                {PLANET_GLYPHS[s.planet] || ''}
              </span>
              <span className="recursive-shift-signs">
                {s.fromSign} <span className="recursive-shift-arrow">&rarr;</span> {s.toSign}
              </span>
              <span className="recursive-shift-delta">{s.degreeDelta}&deg;</span>
            </div>
            {narr && <div className="rc-narrative">{narr}</div>}
          </React.Fragment>
        );
      })}
      {stable.map(s => (
        <div key={s.planet} className="recursive-shift-row stable">
          <span className="recursive-shift-planet" style={{ color: PLANET_COLORS[s.planet] }}>
            {PLANET_GLYPHS[s.planet] || ''}
          </span>
          <span className="recursive-shift-signs">{s.fromSign}</span>
          <span className="recursive-shift-delta">{s.degreeDelta}&deg;</span>
        </div>
      ))}
    </div>
  );
}

/** Render a list of aspects. */
function AspectList({ aspects, observerKey, narratives }) {
  if (!aspects || !aspects.length) return <p className="recursive-reading-text">No major aspects.</p>;

  return (
    <ul className="recursive-aspect-list">
      {aspects.map((a, i) => {
        const meaning = ASPECT_MEANINGS[a.aspect];
        const target = a.planet1 === observerKey ? a.planet2 : a.planet1;
        let nuanceText = null;
        if (meaning && observerKey && meaning.observerNuance && meaning.observerNuance[observerKey]) {
          nuanceText = meaning.observerNuance[observerKey].replace('{target}', target);
        } else if (meaning) {
          nuanceText = meaning.fromObserver
            .replace('{observer}', observerKey || a.planet1)
            .replace('{target}', target);
        }

        const narr = narratives?.[i];

        return (
          <li key={i} className="recursive-aspect-item">
            <span
              className="recursive-aspect-dot"
              style={{ background: ASPECT_COLORS[a.aspect] || '#888' }}
            />
            <span>
              {PLANET_GLYPHS[a.planet1] || a.planet1} {a.aspect} {PLANET_GLYPHS[a.planet2] || a.planet2}
              {' '}({a.orb}&deg; orb)
              {nuanceText && <> — <em>{nuanceText}</em></>}
              {narr && <div className="rc-narrative">{narr}</div>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Field type tag colors ──────────────────────────────────────────────────

const FIELD_TYPE_STYLES = {
  dipole: { bg: 'rgba(201,169,97,0.15)', color: '#c9a961', label: 'Dipole' },
  none: { bg: 'rgba(139,157,195,0.08)', color: 'rgba(139,157,195,0.5)', label: 'None' },
  residual: { bg: 'rgba(208,96,64,0.12)', color: '#d08050', label: 'Residual' },
  induced: { bg: 'rgba(74,155,217,0.12)', color: '#4a9bd9', label: 'Induced' },
};

function strengthLabel(strength) {
  if (strength >= 5000) return 'Very Strong';
  if (strength >= 100) return 'Strong';
  if (strength >= 0.1) return 'Moderate';
  if (strength > 0) return 'Weak';
  return 'None';
}

/** EM field section. */
function FieldSection({ fieldData }) {
  if (!fieldData || !fieldData.length) return null;

  return (
    <div className="recursive-field-section">
      <h4 className="recursive-reading-subtitle">Electromagnetic Fields</h4>
      <div className="recursive-field-grid">
        {fieldData.map(f => {
          const style = FIELD_TYPE_STYLES[f.fieldType] || FIELD_TYPE_STYLES.none;
          const physics = PLANETARY_PHYSICS[f.body];
          const interpretation = EM_INTERPRETATIONS[f.body];

          return (
            <div key={f.body} className="recursive-field-row">
              <div className="recursive-field-row-header">
                <span
                  className="recursive-field-planet"
                  style={{ color: PLANET_COLORS[f.body] }}
                >
                  {PLANET_GLYPHS[f.body] || ''} {f.body}
                </span>
                <span
                  className="rc-field-tag"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
                <span className="recursive-field-strength">
                  {strengthLabel(f.fieldStrength)}
                </span>
              </div>
              {physics?.magneticField?.notes && (
                <p className="recursive-field-note">{physics.magneticField.notes}</p>
              )}
              {interpretation && (
                <p className="recursive-field-interp">{interpretation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Zodiac frame info panel — shows when sidereal is active. */
function ZodiacFrameInfo({ zodiacFrame, date }) {
  if (zodiacFrame !== 'sidereal' || !date) return null;

  const ayanamsa = getLahiriAyanamsa(date);

  return (
    <div className="rc-zodiac-info">
      <h4 className="recursive-reading-subtitle">
        {ZODIAC_FRAME_DESCRIPTIONS.sidereal.title}
      </h4>
      <p className="recursive-reading-text">
        {ZODIAC_FRAME_DESCRIPTIONS.sidereal.description}
      </p>
      <p className="recursive-reading-text">
        <em>{ZODIAC_FRAME_DESCRIPTIONS.ayanamsa}</em>
      </p>
      <p className="recursive-reading-text" style={{ opacity: 0.7, fontSize: '0.8rem' }}>
        Current ayanamsa: {ayanamsa.toFixed(2)}°
      </p>
    </div>
  );
}

/** Synopsis card. */
function Synopsis({ text, narrativeText }) {
  if (!text && !narrativeText) return null;
  return (
    <div className="rc-synopsis">
      <h4 className="rc-synopsis-label">Synopsis</h4>
      {narrativeText && <p className="rc-synopsis-text">{narrativeText}</p>}
      {text && narrativeText && text !== narrativeText && (
        <p className="rc-synopsis-text" style={{ opacity: 0.6, fontSize: '0.85rem' }}>{text}</p>
      )}
      {text && !narrativeText && <p className="rc-synopsis-text">{text}</p>}
    </div>
  );
}

/** Birth chart header — shows birth date, city, ascendant, Chinese pillar. */
function BirthHeader({ natalChart }) {
  if (!natalChart?.birthData) return null;
  const { year, month, day, hour, minute, city } = natalChart.birthData;
  if (!year || !month || !day) return null;

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[(month - 1)] || '';
  let dateStr = `${monthName} ${day}, ${year}`;
  if (hour != null && minute != null) {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const m = String(minute).padStart(2, '0');
    dateStr += ` at ${h}:${m} ${ampm}`;
  }
  if (city) dateStr += ` — ${city}`;

  const ascendant = natalChart.ascendant;
  const chinese = natalChart.chinese;

  return (
    <div className="rc-birth-header">
      <h4 className="rc-birth-label">Birth Chart</h4>
      <p className="rc-birth-date">{dateStr}</p>
      {ascendant?.sign && (
        <p className="rc-birth-rising">
          Rising: {ascendant.sign} {typeof ascendant.degree === 'number' ? `${ascendant.degree.toFixed(1)}°` : ''}
        </p>
      )}
      {chinese?.pillar && (
        <p className="rc-birth-chinese">{chinese.pillar}</p>
      )}
    </div>
  );
}

/** Weather reading — geocentric or heliocentric current sky. */
function WeatherReading({ weatherData, perspective, selectedPlanet, emFieldVisible, fieldData, zodiacFrame, date, retrogrades, lunarPhase }) {
  if (!weatherData) return null;

  const isHelio = perspective === 'heliocentric';
  const desc = isHelio ? WEATHER_DESCRIPTIONS.heliocentric : WEATHER_DESCRIPTIONS.geocentric;
  const positions = isHelio ? weatherData.heliocentric.planets : weatherData.geocentric.planets;
  const aspects = isHelio ? weatherData.heliocentric.aspects : weatherData.geocentric.aspects;
  const theme = PERSPECTIVE_THEMES[perspective];
  const frame = 'weather';

  // Position narratives
  const posNarratives = {};
  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));
  for (const r of rows) {
    const n = narratePosition(r, frame);
    if (n.text) posNarratives[r.name] = n.text;
  }

  // Aspect narratives
  const aspectNarr = (aspects || []).map(a =>
    narrateAspect(a, positions, frame).text
  );

  return (
    <>
      {/* Weather header — shows for geocentric/heliocentric */}
      {(perspective === 'geocentric' || perspective === 'heliocentric' || perspective === 'reading') && (
        <>
          <h3 className="recursive-reading-title">{desc.title}</h3>
          <p className="recursive-reading-text">{desc.description}</p>
        </>
      )}

      {/* Planet perspective header */}
      {theme && perspective !== 'geocentric' && perspective !== 'heliocentric' && perspective !== 'reading' && (
        <>
          <h3 className="recursive-reading-title" style={{ color: theme.color }}>
            {theme.symbol} {perspective}, {theme.label}
          </h3>
          <p className="recursive-reading-text"><em>{theme.theme}</em></p>
        </>
      )}

      <ZodiacFrameInfo zodiacFrame={zodiacFrame} date={date} />

      <LunarPhaseIndicator lunarPhase={lunarPhase} />

      <h4 className="recursive-reading-subtitle">Current Positions</h4>
      <PositionRows
        positions={positions}
        selectedPlanet={selectedPlanet}
        zodiacFrame={zodiacFrame}
        date={date}
        narratives={posNarratives}
        retrogrades={retrogrades}
      />
      <ElementBalance positions={positions} />
      <DignityTally positions={positions} />

      {!isHelio && weatherData.lunarNodes && (
        <>
          <h4 className="recursive-reading-subtitle">Lunar Nodes</h4>
          <NodalAxis nodes={weatherData.lunarNodes} frame="weather" />
        </>
      )}

      {emFieldVisible && <FieldSection fieldData={fieldData} />}

      <h4 className="recursive-reading-subtitle">Current Aspects</h4>
      <AspectList
        aspects={aspects}
        observerKey={isHelio ? 'Sun' : (theme ? perspective : undefined)}
        narratives={aspectNarr}
      />
      <AspectSummary aspects={aspects} />
      <AspectPatterns aspects={aspects} />
    </>
  );
}

/** Planet perspective weather reading. */
function PlanetWeatherReading({ planetKey, weatherData, selectedPlanet, emFieldVisible, fieldData, zodiacFrame, date }) {
  const theme = PERSPECTIVE_THEMES[planetKey];
  const perspective = weatherData?.perspectives?.[planetKey];
  if (!theme || !perspective) return null;

  const frame = 'weather';
  const geoPositions = weatherData?.geocentric?.planets;

  // Narrative perspective
  const perspNarr = narratePerspective(planetKey, perspective, geoPositions, frame);

  // Position narratives
  const posNarratives = {};
  const rows = Array.isArray(perspective.positions)
    ? perspective.positions
    : Object.entries(perspective.positions || {}).map(([name, d]) => ({ name, ...d }));
  for (const r of rows) {
    const n = narratePosition(r, frame);
    if (n.text) posNarratives[r.name] = n.text;
  }

  // Aspect narratives
  const aspectNarr = (perspective.aspects || []).map(a =>
    narrateAspect(a, perspective.positions || geoPositions, frame).text
  );

  return (
    <>
      <h3 className="recursive-reading-title" style={{ color: theme.color }}>
        {theme.symbol} {planetKey}, {theme.label}
      </h3>
      <p className="recursive-reading-text"><em>{theme.theme}</em></p>
      {perspNarr.intro && <p className="rc-narrative">{perspNarr.intro}</p>}
      {perspNarr.observations && <p className="rc-narrative">{perspNarr.observations}</p>}

      <ZodiacFrameInfo zodiacFrame={zodiacFrame} date={date} />

      <h4 className="recursive-reading-subtitle">What {planetKey} sees now</h4>
      <PositionRows
        positions={perspective.positions}
        selectedPlanet={selectedPlanet}
        zodiacFrame={zodiacFrame}
        date={date}
        narratives={posNarratives}
      />

      {emFieldVisible && <FieldSection fieldData={fieldData} />}

      <h4 className="recursive-reading-subtitle">
        {planetKey}'s Aspects — Current Carried Experience
      </h4>
      <AspectList aspects={perspective.aspects} observerKey={planetKey} narratives={aspectNarr} />
    </>
  );
}

/** Birth chart view — standalone natal-first view for personal mode default layer. */
/** House grid — 12 houses with occupants. Geocentric + personal mode + birth time required. */
function HouseGrid({ positions, houses, ascendant, midheaven }) {
  if (!houses || !positions) return null;
  const analysis = analyzeHouses(positions, houses, ascendant, midheaven);
  return (
    <div className="rc-house-grid">
      {houses.map(h => {
        const planets = analysis.housePlanets[h.house] || [];
        const meaning = HOUSE_MEANINGS[h.house];
        const isAngular = [1, 4, 7, 10].includes(h.house);
        return (
          <div key={h.house} className={`rc-house-cell${isAngular ? ' rc-house-angular' : ''}`}>
            <div className="rc-house-number">{h.house}</div>
            <div className="rc-house-sign">{h.sign}</div>
            {meaning && <div className="rc-house-name">{meaning.name}</div>}
            {planets.length > 0 && (
              <div className="rc-house-planets">
                {planets.map(p => (
                  <span key={p} className="rc-house-planet" style={{ color: PLANET_COLORS[p] || '#c9a961' }}>
                    {PLANET_GLYPHS[p] || p[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Angles display — ASC/MC/DSC/IC with narrative. */
function AnglesDisplay({ ascendant, midheaven }) {
  if (!ascendant && !midheaven) return null;
  const text = narrateAngles(ascendant, midheaven);
  return (
    <div className="rc-angles-display">
      <div className="rc-angles-row">
        {ascendant && (
          <span className="rc-angle-badge">ASC {ascendant.degree}° {ascendant.sign}</span>
        )}
        {midheaven && (
          <span className="rc-angle-badge">MC {midheaven.degree}° {midheaven.sign}</span>
        )}
      </div>
      {text && <p className="rc-narrative">{text}</p>}
    </div>
  );
}

/** Nodal axis display — works in all modes. */
function NodalAxis({ nodes, frame }) {
  if (!nodes) return null;
  const text = narrateLunarNodes(nodes, frame);
  return (
    <div className="rc-nodal-axis">
      <div className="rc-nodal-row">
        <span className="rc-node-badge rc-node-north">☊ NN {nodes.northNode.degree}° {nodes.northNode.sign}</span>
        <span className="rc-nodal-separator">—</span>
        <span className="rc-node-badge rc-node-south">☋ SN {nodes.southNode.degree}° {nodes.southNode.sign}</span>
      </div>
      {text && <p className="rc-narrative">{text}</p>}
    </div>
  );
}

/** Part of Fortune display. */
function PartOfFortuneDisplay({ pof }) {
  if (!pof) return null;
  const text = narratePartOfFortune(pof);
  return (
    <div className="rc-pof-display">
      <span className="rc-pof-badge">⊕ Part of Fortune {pof.degree}° {pof.sign}</span>
      {text && <p className="rc-narrative">{text}</p>}
    </div>
  );
}

/** Mutual reception display. */
function MutualReceptionDisplay({ receptions }) {
  if (!receptions || receptions.length === 0) return null;
  const text = narrateMutualReception(receptions);
  return (
    <div className="rc-mutual-reception">
      <div className="rc-mr-badges">
        {receptions.map((r, i) => (
          <span key={i} className="rc-mr-badge">
            {PLANET_GLYPHS[r.planet1] || r.planet1[0]} ↔ {PLANET_GLYPHS[r.planet2] || r.planet2[0]}
          </span>
        ))}
      </div>
      {text && <p className="rc-narrative">{text}</p>}
    </div>
  );
}

/** Transit Spotlight — highlights 1-3 most significant current transits. */
function TransitSpotlight({ transitPositions, natalPositions, natalChart }) {
  if (!transitPositions || !natalPositions) return null;

  const SLOW_PLANETS = ['Saturn', 'Jupiter', 'Mars'];
  const transitAspects = computeTransitAspects(transitPositions, natalPositions);
  if (!transitAspects.length) return null;

  // Prioritize: slow planets first, tightest orb
  const scored = transitAspects.map(a => {
    const slowIdx = SLOW_PLANETS.indexOf(a.transitPlanet);
    const slowScore = slowIdx >= 0 ? (3 - slowIdx) * 10 : 0;
    return { ...a, score: slowScore + (10 - a.orb) };
  }).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);

  return (
    <div className="rc-transit-spotlight">
      <h4 className="recursive-reading-subtitle">Transit Spotlight</h4>
      {top.map((t, i) => {
        const key = `${t.transitPlanet}-${t.natalPlanet}`;
        const meaning = TRANSIT_ACTIVATION_MEANINGS[key] || TRANSIT_ACTIVATION_MEANINGS[`${t.natalPlanet}-${t.transitPlanet}`] || '';
        const narrative = narrateTransitActivation(t, transitPositions, natalPositions, natalChart);
        return (
          <div key={i} className="rc-transit-card">
            <div className="rc-transit-header">
              <span style={{ color: PLANET_COLORS[t.transitPlanet] }}>
                {PLANET_GLYPHS[t.transitPlanet] || t.transitPlanet}
              </span>
              <span className="rc-transit-aspect">{t.aspect}</span>
              <span style={{ color: PLANET_COLORS[t.natalPlanet] }}>
                {PLANET_GLYPHS[t.natalPlanet] || t.natalPlanet}
              </span>
              <span className="rc-transit-orb">({t.orb}°{t.exact ? ' exact' : ''})</span>
            </div>
            {meaning && <p className="rc-narrative">{meaning}</p>}
            {narrative && <p className="rc-narrative">{narrative}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Progression section — secondary progressions for current date (personal mode only). */
function ProgressionSection({ natalChart, date, zodiacFrame }) {
  if (!natalChart?.birthData) return null;

  const progression = computeSecondaryProgressions(natalChart, date);
  if (!progression) return null;

  const natalGeoPositions = natalChart.planets || null;
  const progressedAspects = computeProgressedAspects(progression.positions, natalGeoPositions);
  const ingresses = detectProgressedIngresses(progression.positions, natalGeoPositions);
  const narrative = narrateProgression(progression, natalChart, progressedAspects, ingresses);

  // Progressed Moon phase meaning
  const moonPhaseMeaning = progression.lunarPhase?.phase
    ? PROGRESSION_MEANINGS.moonPhases[progression.lunarPhase.phase] || ''
    : '';

  // Aspect meanings from PROGRESSION_MEANINGS
  const getProgressedAspectMeaning = (aspect) => {
    const key = `${aspect.progressedPlanet}-${aspect.natalPlanet}`;
    return PROGRESSION_MEANINGS.aspects[key] || '';
  };

  return (
    <div className="rc-progression-section">
      <h4 className="recursive-reading-subtitle">Secondary Progressions</h4>
      <p className="recursive-reading-text" style={{ opacity: 0.7, fontStyle: 'italic' }}>
        {PROGRESSION_MEANINGS.intro}
      </p>

      {narrative && <p className="rc-narrative">{narrative}</p>}

      {/* Progressed Ascendant */}
      {progression.progressedAscendant && (
        <div className="rc-prog-badge">
          <span className="rc-prog-label">Progressed ASC</span>
          <span className="rc-prog-value">
            {progression.progressedAscendant.sign} {progression.progressedAscendant.degree.toFixed(1)}&deg;
          </span>
        </div>
      )}

      {/* Progressed lunar phase */}
      {progression.lunarPhase?.phase && (
        <div className="rc-prog-badge">
          <span className="rc-prog-label">Progressed Moon Phase</span>
          <span className="rc-prog-value">{progression.lunarPhase.phase}</span>
          {moonPhaseMeaning && <p className="rc-narrative" style={{ marginTop: '0.3rem' }}>{moonPhaseMeaning}</p>}
        </div>
      )}

      {/* Progressed nodes */}
      {progression.nodes?.northNode && (
        <div className="rc-prog-badge">
          <span className="rc-prog-label">Progressed North Node</span>
          <span className="rc-prog-value">
            {progression.nodes.northNode.sign} {progression.nodes.northNode.degree.toFixed(1)}&deg;
          </span>
        </div>
      )}

      {/* Ingresses */}
      {ingresses.length > 0 && (
        <>
          <h5 className="recursive-reading-subtitle" style={{ fontSize: '0.85rem' }}>Sign Changes Since Birth</h5>
          {ingresses.map((ig, i) => (
            <div key={i} className="rc-prog-ingress">
              <span style={{ color: PLANET_COLORS[ig.planet] }}>
                {PLANET_GLYPHS[ig.planet] || ig.planet}
              </span>
              <span>{ig.natalSign} &rarr; {ig.progressedSign}</span>
              {ig.planet === 'Sun' && <p className="rc-narrative" style={{ marginTop: '0.2rem' }}>{PROGRESSION_MEANINGS.sunIngress}</p>}
              {ig.planet === 'Moon' && <p className="rc-narrative" style={{ marginTop: '0.2rem' }}>{PROGRESSION_MEANINGS.moonIngress}</p>}
            </div>
          ))}
        </>
      )}

      {/* Progressed aspects to natal */}
      {progressedAspects.length > 0 && (
        <>
          <h5 className="recursive-reading-subtitle" style={{ fontSize: '0.85rem' }}>Progressed Aspects to Natal</h5>
          {progressedAspects.slice(0, 8).map((a, i) => {
            const meaning = getProgressedAspectMeaning(a);
            const narrText = narrateProgressedAspect(a, progression.positions, natalGeoPositions);
            return (
              <div key={i} className="rc-transit-card">
                <div className="rc-transit-header">
                  <span style={{ color: PLANET_COLORS[a.progressedPlanet] }}>
                    {PLANET_GLYPHS[a.progressedPlanet] || a.progressedPlanet}
                  </span>
                  <span className="rc-transit-aspect">{a.aspect}</span>
                  <span style={{ color: PLANET_COLORS[a.natalPlanet] }}>
                    {PLANET_GLYPHS[a.natalPlanet] || a.natalPlanet}
                  </span>
                  <span className="rc-transit-orb">({a.orb}&deg;{a.exact ? ' exact' : ''})</span>
                </div>
                {meaning && <p className="rc-narrative">{meaning}</p>}
                {narrText && <p className="rc-narrative">{narrText}</p>}
              </div>
            );
          })}
        </>
      )}

      {/* Progressed positions */}
      <h5 className="recursive-reading-subtitle" style={{ fontSize: '0.85rem' }}>Progressed Positions</h5>
      <PositionRows
        positions={progression.positions}
        zodiacFrame={zodiacFrame}
        date={progression.progressedDate}
      />
    </div>
  );
}

function BirthChartView({ data, selectedPlanet, zodiacFrame, date, natalChart, weatherData }) {
  if (!data) return null;

  const { geocentric, heliocentric, perspectives, shifts, birthSolarCycle } = data;
  const birthDate = data.birthDate || null;
  const weatherGeoPositions = weatherData?.geocentric?.planets || null;

  // Natal synopsis
  const narrNatalSynopsis = narrateNatalSynopsis(data, natalChart);

  // Natal position narratives
  const natalNarratives = {};
  const natalRows = Array.isArray(geocentric.planets)
    ? geocentric.planets
    : Object.entries(geocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of natalRows) {
    const n = narrateNatalPosition(r, natalChart);
    if (n.text) natalNarratives[r.name] = n.text;
  }

  // Natal aspect narratives
  const natalAspectNarr = (geocentric.aspects || []).map(a =>
    narrateNatalAspect(a, geocentric.planets).text
  );

  // Helio position narratives
  const helioNarratives = {};
  const helioRows = Array.isArray(heliocentric.planets)
    ? heliocentric.planets
    : Object.entries(heliocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of helioRows) {
    const n = narratePosition(r, 'personal');
    if (n.text) helioNarratives[r.name] = n.text;
  }

  // Shift narratives
  const shiftNarratives = {};
  if (shifts?.heliocentric) {
    for (const s of shifts.heliocentric) {
      const n = narrateShift(s, 'personal');
      if (n.text && n.dramatic) shiftNarratives[s.planet] = n.text;
    }
  }

  return (
    <>
      <BirthHeader natalChart={natalChart} />

      <Synopsis narrativeText={narrNatalSynopsis.text} />

      {/* Transit Spotlight — most significant current transits to natal chart */}
      {data.transitDate && (
        <TransitSpotlight
          transitPositions={weatherGeoPositions}
          natalPositions={geocentric.planets}
          natalChart={natalChart}
        />
      )}

      <h4 className="recursive-reading-subtitle">Natal Positions</h4>
      <PositionRows
        positions={geocentric.planets}
        selectedPlanet={selectedPlanet}
        zodiacFrame={zodiacFrame}
        date={birthDate || date}
        narratives={natalNarratives}
      />
      <ElementBalance positions={geocentric.planets} />
      <DignityTally positions={geocentric.planets} />

      {/* Houses, Angles, Nodes, PoF, Mutual Reception — Phase 1 */}
      {data.ascendant && !data.timeMissing && (
        <>
          <h4 className="recursive-reading-subtitle">Houses & Angles</h4>
          <AnglesDisplay ascendant={data.ascendant} midheaven={data.midheaven} />
          <HouseGrid
            positions={geocentric.planets}
            houses={data.houses}
            ascendant={data.ascendant}
            midheaven={data.midheaven}
          />
        </>
      )}

      {data.birthLunarNodes && (
        <>
          <h4 className="recursive-reading-subtitle">Lunar Nodes</h4>
          <NodalAxis nodes={data.birthLunarNodes} frame="personal" />
        </>
      )}

      {data.ascendant && !data.timeMissing && (() => {
        const sunPos = natalRows.find(r => r.name === 'Sun');
        const moonPos = natalRows.find(r => r.name === 'Moon');
        const pof = computePartOfFortune(data.ascendant, sunPos, moonPos);
        const receptions = detectMutualReceptions(geocentric.planets);
        return (
          <>
            {pof && (
              <>
                <h4 className="recursive-reading-subtitle">Part of Fortune</h4>
                <PartOfFortuneDisplay pof={pof} />
              </>
            )}
            {receptions.length > 0 && (
              <>
                <h4 className="recursive-reading-subtitle">Mutual Receptions</h4>
                <MutualReceptionDisplay receptions={receptions} />
              </>
            )}
          </>
        );
      })()}

      {geocentric.aspects && geocentric.aspects.length > 0 && (
        <>
          <h4 className="recursive-reading-subtitle">Natal Aspects</h4>
          <AspectList aspects={geocentric.aspects} narratives={natalAspectNarr} />
          <AspectSummary aspects={geocentric.aspects} />
          <AspectPatterns aspects={geocentric.aspects} />
        </>
      )}

      <h4 className="recursive-reading-subtitle">Heliocentric at Birth</h4>
      <PositionRows
        positions={heliocentric.planets}
        selectedPlanet={selectedPlanet}
        zodiacFrame={zodiacFrame}
        date={birthDate || date}
        narratives={helioNarratives}
      />

      {shifts?.heliocentric?.length > 0 && (
        <>
          <h4 className="recursive-reading-subtitle">Geo → Helio Natal Shifts</h4>
          <ShiftAnalysis shifts={shifts.heliocentric} perspectiveKey="heliocentric" narratives={shiftNarratives} />
        </>
      )}

      {/* Natal Carried Experience — what each planet saw at birth */}
      {perspectives && (
        <>
          <h4 className="recursive-reading-subtitle">Carried Experience at Birth</h4>
          {['Sun', 'Moon', 'Mars', 'Venus', 'Mercury', 'Jupiter', 'Saturn'].map(planet => {
            const persp = perspectives[planet];
            const theme = PERSPECTIVE_THEMES[planet];
            if (!persp || !theme) return null;
            const perspNarr = narratePerspective(planet, persp, geocentric.planets, 'personal');
            const perspAspectNarr = (persp.aspects || []).map(a =>
              narrateAspect(a, geocentric.planets, 'personal').text
            );
            return (
              <div key={planet} className="recursive-perspective-card">
                <div className="recursive-perspective-card-header">
                  <span className="recursive-perspective-card-symbol" style={{ color: theme.color }}>
                    {theme.symbol}
                  </span>
                  <span className="recursive-perspective-card-name" style={{ color: theme.color }}>
                    {planet} — {theme.label}
                  </span>
                </div>
                <p className="recursive-perspective-card-theme">{theme.theme}</p>
                {perspNarr.intro && <p className="rc-narrative">{perspNarr.intro}</p>}
                {perspNarr.observations && <p className="rc-narrative">{perspNarr.observations}</p>}
                <AspectList aspects={persp.aspects} observerKey={planet} narratives={perspAspectNarr} />
                {shifts?.[planet] && <ShiftAnalysis shifts={shifts[planet]} perspectiveKey={planet} />}
              </div>
            );
          })}
        </>
      )}

      {birthSolarCycle && (() => {
        const rule = getSolarCycleRule(birthSolarCycle.phase, birthSolarCycle.ascending);
        return (
          <>
            <h4 className="recursive-reading-subtitle">Solar Cycle at Birth</h4>
            <p className="recursive-reading-text">
              <em>Cycle {birthSolarCycle.cycleNumber} — {rule.phase}</em>
            </p>
            <p className="recursive-reading-text">{rule.meaning}</p>
          </>
        );
      })()}
    </>
  );
}

/** Personal overlay — appears below weather when mode is personal. */
function PersonalOverlay({ recursiveData, weatherData, selectedPlanet, zodiacFrame, date }) {
  if (!recursiveData) return null;

  const { geocentric, shifts } = recursiveData;

  return (
    <>
      <div className="rc-personal-separator">
        <span>Personal Layer — Birth Chart Overlay</span>
      </div>

      <h4 className="recursive-reading-subtitle">Natal Positions</h4>
      <PositionRows
        positions={geocentric.planets}
        selectedPlanet={selectedPlanet}
        zodiacFrame={zodiacFrame}
        date={date}
      />

      {shifts?.heliocentric?.length > 0 && (
        <>
          <h4 className="recursive-reading-subtitle">Natal-to-Current Shift</h4>
          <ShiftAnalysis shifts={shifts.heliocentric} perspectiveKey="heliocentric" />
        </>
      )}

      {recursiveData.birthSolarCycle && recursiveData.solarCycle && (() => {
        const birthRule = getSolarCycleRule(recursiveData.birthSolarCycle.phase, recursiveData.birthSolarCycle.ascending);
        const currentRule = getSolarCycleRule(recursiveData.solarCycle.phase, recursiveData.solarCycle.ascending);
        return (
          <>
            <h4 className="recursive-reading-subtitle">Solar Cycle: Birth vs Now</h4>
            <p className="recursive-reading-text">
              <em>At birth:</em> Cycle {recursiveData.birthSolarCycle.cycleNumber} — {birthRule.phase}
            </p>
            <p className="recursive-reading-text">
              <em>Now:</em> Cycle {recursiveData.solarCycle.cycleNumber} — {currentRule.phase}
            </p>
          </>
        );
      })()}
    </>
  );
}

/** Weather full reading — walks through all perspectives for the current sky. */
function WeatherFullReading({ weatherData, selectedPlanet, emFieldVisible, fieldData, zodiacFrame, date }) {
  const { geocentric, heliocentric, perspectives, solarCycle } = weatherData;
  const geoShifts = computeShiftAnalysis(geocentric.planets, heliocentric.planets);
  const synopsisText = generateSynopsis(weatherData);
  const frame = 'weather';

  // Narrative synopsis
  const narrSynopsis = narrateSynopsis(weatherData, null, frame);

  // Position narratives for geocentric
  const geoNarratives = {};
  const geoRows = Array.isArray(geocentric.planets)
    ? geocentric.planets
    : Object.entries(geocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of geoRows) {
    const n = narratePosition(r, frame);
    if (n.text) geoNarratives[r.name] = n.text;
  }

  // Position narratives for heliocentric
  const helioNarratives = {};
  const helioRows = Array.isArray(heliocentric.planets)
    ? heliocentric.planets
    : Object.entries(heliocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of helioRows) {
    const n = narratePosition(r, frame);
    if (n.text) helioNarratives[r.name] = n.text;
  }

  // Aspect narratives for geocentric
  const geoAspectNarr = (geocentric.aspects || []).map(a =>
    narrateAspect(a, geocentric.planets, frame).text
  );

  // Shift narratives
  const shiftNarratives = {};
  for (const s of geoShifts) {
    const n = narrateShift(s, frame);
    if (n.text && n.dramatic) shiftNarratives[s.planet] = n.text;
  }

  // Section intros
  const sectionNarr = {};
  for (const key of ['geocentric', 'departure', 'perspectives', 'integration', 'solarCycle']) {
    const text = narrateSectionIntro(key, weatherData, frame);
    if (text) sectionNarr[key] = text;
  }

  return (
    <>
      <h3 className="recursive-reading-title">
        {PERSPECTIVE_DESCRIPTIONS.reading.title}
      </h3>
      <p className="recursive-reading-text">
        The complete journey through today's sky — from surface to center and back.
      </p>

      <Synopsis text={synopsisText} narrativeText={narrSynopsis.text} />

      <ZodiacFrameInfo zodiacFrame={zodiacFrame} date={date} />

      {/* I. The Shared Sky */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{WEATHER_READING_SECTIONS.geocentric.title}</h4>
        <p className="recursive-section-intro">{WEATHER_READING_SECTIONS.geocentric.intro}</p>
        {sectionNarr.geocentric && <p className="rc-narrative">{sectionNarr.geocentric}</p>}
        <PositionRows positions={geocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={date} narratives={geoNarratives} retrogrades={weatherData.retrogrades} />
        <ElementBalance positions={geocentric.planets} />
        <DignityTally positions={geocentric.planets} />
        <AspectList aspects={geocentric.aspects} narratives={geoAspectNarr} />
        <AspectSummary aspects={geocentric.aspects} />
        <AspectPatterns aspects={geocentric.aspects} />
      </div>

      {/* II. The Deeper Structure */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{WEATHER_READING_SECTIONS.departure.title}</h4>
        <p className="recursive-section-intro">{WEATHER_READING_SECTIONS.departure.intro}</p>
        {sectionNarr.departure && <p className="rc-narrative">{sectionNarr.departure}</p>}
        <PositionRows positions={heliocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={date} narratives={helioNarratives} />
        {geoShifts.length > 0 && (
          <>
            <h4 className="recursive-reading-subtitle">Geo → Helio Shifts</h4>
            <ShiftAnalysis shifts={geoShifts} perspectiveKey="heliocentric" narratives={shiftNarratives} />
          </>
        )}
        <AspectList aspects={heliocentric.aspects} observerKey="Sun" />
      </div>

      {/* III. The Carried Experience */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{WEATHER_READING_SECTIONS.perspectives.title}</h4>
        <p className="recursive-section-intro">{WEATHER_READING_SECTIONS.perspectives.intro}</p>
        {sectionNarr.perspectives && <p className="rc-narrative">{sectionNarr.perspectives}</p>}
        {['Sun', 'Moon', 'Mars', 'Venus', 'Mercury', 'Jupiter', 'Saturn'].map(planet => {
          const persp = perspectives[planet];
          const theme = PERSPECTIVE_THEMES[planet];
          if (!persp || !theme) return null;
          const perspNarr = narratePerspective(planet, persp, geocentric.planets, frame);
          const perspAspectNarr = (persp.aspects || []).map(a =>
            narrateAspect(a, persp.positions || geocentric.planets, frame).text
          );
          return (
            <div key={planet} className="recursive-perspective-card">
              <div className="recursive-perspective-card-header">
                <span
                  className="recursive-perspective-card-symbol"
                  style={{ color: theme.color }}
                >
                  {theme.symbol}
                </span>
                <span
                  className="recursive-perspective-card-name"
                  style={{ color: theme.color }}
                >
                  {planet} — {theme.label}
                </span>
              </div>
              <p className="recursive-perspective-card-theme">{theme.theme}</p>
              {perspNarr.intro && <p className="rc-narrative">{perspNarr.intro}</p>}
              {perspNarr.observations && <p className="rc-narrative">{perspNarr.observations}</p>}
              <PositionRows positions={persp.positions} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={date} />
              <AspectList aspects={persp.aspects} observerKey={planet} narratives={perspAspectNarr} />
            </div>
          );
        })}
      </div>

      {/* IV. The Web */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{WEATHER_READING_SECTIONS.integration.title}</h4>
        <p className="recursive-section-intro">{WEATHER_READING_SECTIONS.integration.intro}</p>
        {sectionNarr.integration && <p className="rc-narrative">{sectionNarr.integration}</p>}
        <ResonanceMap perspectives={perspectives} />
      </div>

      {/* V. The Container */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{WEATHER_READING_SECTIONS.solarCycle.title}</h4>
        <p className="recursive-section-intro">{WEATHER_READING_SECTIONS.solarCycle.intro}</p>
        {sectionNarr.solarCycle && <p className="rc-narrative">{sectionNarr.solarCycle}</p>}
        {solarCycle && (() => {
          const rule = getSolarCycleRule(solarCycle.phase, solarCycle.ascending);
          return (
            <>
              <p className="recursive-reading-text">
                <em>Cycle {solarCycle.cycleNumber} — {rule.phase}</em>
              </p>
              <p className="recursive-reading-text">{rule.meaning}</p>
            </>
          );
        })()}
      </div>

      {/* VI. The Magnetic Architecture (when EM is on) */}
      {emFieldVisible && fieldData && (
        <div className="recursive-reading-section">
          <h4 className="recursive-section-header">{EM_READING_SECTION.title}</h4>
          <p className="recursive-section-intro">{EM_READING_SECTION.intro}</p>
          <FieldSection fieldData={fieldData} />
        </div>
      )}
    </>
  );
}

/** Full reading — walks through all perspectives in monomyth order (personal mode only). */
function FullReading({ data, selectedPlanet, emFieldVisible, fieldData, zodiacFrame, date, weatherData, natalChart }) {
  const { geocentric, heliocentric, perspectives, shifts, solarCycle } = data;
  const synopsisText = generateSynopsis(weatherData, data);
  const frame = 'personal';

  // Birth date for sidereal conversion on natal positions
  const birthDate = data.birthDate || null;

  // Natal synopsis (birth-chart-specific centerpiece)
  const narrNatalSynopsis = narrateNatalSynopsis(data, natalChart);

  // Weather synopsis as secondary "today's sky" section
  const narrWeatherSynopsis = narrateSynopsis(weatherData, data, frame);

  // Position narratives for natal geocentric — use natal-specific narrative
  const natalNarratives = {};
  const natalRows = Array.isArray(geocentric.planets)
    ? geocentric.planets
    : Object.entries(geocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of natalRows) {
    const n = narrateNatalPosition(r, natalChart);
    if (n.text) natalNarratives[r.name] = n.text;
  }

  // Natal aspect narratives
  const natalAspectNarr = (geocentric.aspects || []).map(a =>
    narrateNatalAspect(a, geocentric.planets).text
  );

  // Position narratives for heliocentric — natal-framed
  const helioNarratives = {};
  const helioRows = Array.isArray(heliocentric.planets)
    ? heliocentric.planets
    : Object.entries(heliocentric.planets).map(([name, d]) => ({ name, ...d }));
  for (const r of helioRows) {
    const n = narratePosition(r, frame);
    if (n.text) helioNarratives[r.name] = n.text;
  }

  // Shift narratives — natal-framed
  const shiftNarratives = {};
  if (shifts?.heliocentric) {
    for (const s of shifts.heliocentric) {
      const n = narrateShift(s, frame);
      if (n.text && n.dramatic) shiftNarratives[s.planet] = n.text;
    }
  }

  // Section intros
  const sectionNarr = {};
  if (weatherData) {
    for (const key of ['geocentric', 'departure', 'perspectives', 'integration', 'solarCycle']) {
      const text = narrateSectionIntro(key, weatherData, frame);
      if (text) sectionNarr[key] = text;
    }
  }

  // Build transit-natal sign matches for overlay
  const transitMatches = {};
  if (weatherData?.geocentric?.planets) {
    const natalMap = Array.isArray(geocentric.planets)
      ? Object.fromEntries(geocentric.planets.map(p => [p.name, p]))
      : geocentric.planets;
    const transitMap = weatherData.geocentric.planets;
    for (const [planet, transit] of Object.entries(transitMap)) {
      const natal = natalMap[planet];
      if (natal && natal.sign === transit.sign) {
        transitMatches[planet] = transit.sign;
      }
    }
  }

  // Transit position narratives (weather frame)
  const transitNarratives = {};
  if (weatherData?.geocentric?.planets) {
    const transitRows = Array.isArray(weatherData.geocentric.planets)
      ? weatherData.geocentric.planets
      : Object.entries(weatherData.geocentric.planets).map(([name, d]) => ({ name, ...d }));
    for (const r of transitRows) {
      const n = narratePosition(r, 'weather');
      if (n.text) transitNarratives[r.name] = n.text;
    }
  }

  return (
    <>
      <h3 className="recursive-reading-title">
        {PERSPECTIVE_DESCRIPTIONS.reading.title}
      </h3>
      <p className="recursive-reading-text">
        {PERSPECTIVE_DESCRIPTIONS.reading.description}
      </p>

      {/* Birth chart header */}
      <BirthHeader natalChart={natalChart} />

      {/* Natal synopsis — birth-chart-specific centerpiece */}
      <Synopsis text={synopsisText} narrativeText={narrNatalSynopsis.text} />

      {/* Today's sky synopsis — secondary */}
      {narrWeatherSynopsis.text && (
        <div className="rc-synopsis" style={{ opacity: 0.75 }}>
          <h4 className="rc-synopsis-label">Today's Sky</h4>
          <p className="rc-synopsis-text">{narrWeatherSynopsis.text}</p>
        </div>
      )}

      <ZodiacFrameInfo zodiacFrame={zodiacFrame} date={date} />

      {/* I. Ordinary World — Natal positions with birth-specific narrative */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{READING_SECTIONS.geocentric.title}</h4>
        <p className="recursive-section-intro">{READING_SECTIONS.geocentric.intro}</p>
        {sectionNarr.geocentric && <p className="rc-narrative">{sectionNarr.geocentric}</p>}
        <PositionRows positions={geocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={birthDate || date} narratives={natalNarratives} />
        <ElementBalance positions={geocentric.planets} />
        <DignityTally positions={geocentric.planets} />

        {/* Natal aspects */}
        {geocentric.aspects && geocentric.aspects.length > 0 && (
          <>
            <h4 className="recursive-reading-subtitle">Natal Aspects</h4>
            <AspectList aspects={geocentric.aspects} narratives={natalAspectNarr} />
            <AspectSummary aspects={geocentric.aspects} />
            <AspectPatterns aspects={geocentric.aspects} />
          </>
        )}

        {/* Transit overlay */}
        {weatherData?.geocentric?.planets && (
          <>
            <div className="rc-transit-separator">
              <span>Current Transits</span>
            </div>
            <PositionRows positions={weatherData.geocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={date} narratives={transitNarratives} />
            {Object.keys(transitMatches).length > 0 && (
              <p className="rc-transit-match">
                Transit {Object.keys(transitMatches).join(', ')} activating natal territory
              </p>
            )}
            <TransitAspectList transitPositions={weatherData.geocentric.planets} natalPositions={geocentric.planets} />
          </>
        )}
      </div>

      {/* II. Departure — natal shift from geo to helio */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{READING_SECTIONS.departure.title}</h4>
        <p className="recursive-section-intro">{READING_SECTIONS.departure.intro}</p>
        {sectionNarr.departure && <p className="rc-narrative">{sectionNarr.departure}</p>}
        <PositionRows positions={heliocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={birthDate || date} narratives={helioNarratives} />
        {shifts?.heliocentric?.length > 0 && (
          <ShiftAnalysis shifts={shifts.heliocentric} perspectiveKey="heliocentric" narratives={shiftNarratives} />
        )}
        <AspectList aspects={heliocentric.aspects} />

        {/* Current heliocentric transit overlay */}
        {weatherData?.heliocentric?.planets && (
          <>
            <div className="rc-transit-separator">
              <span>Current Heliocentric</span>
            </div>
            <PositionRows positions={weatherData.heliocentric.planets} selectedPlanet={selectedPlanet} zodiacFrame={zodiacFrame} date={date} />
          </>
        )}
      </div>

      {/* III. Carried Experience */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{READING_SECTIONS.perspectives.title}</h4>
        <p className="recursive-section-intro">{READING_SECTIONS.perspectives.intro}</p>
        {sectionNarr.perspectives && <p className="rc-narrative">{sectionNarr.perspectives}</p>}
        {['Sun', 'Moon', 'Mars', 'Venus', 'Mercury', 'Jupiter', 'Saturn'].map(planet => {
          const persp = perspectives[planet];
          const theme = PERSPECTIVE_THEMES[planet];
          if (!persp || !theme) return null;
          const transitPersp = weatherData?.perspectives?.[planet];
          const perspNarr = narratePerspective(planet, persp, geocentric.planets, frame);
          const perspAspectNarr = (persp.aspects || []).map(a =>
            narrateAspect(a, geocentric.planets, frame).text
          );
          return (
            <div key={planet} className="recursive-perspective-card">
              <div className="recursive-perspective-card-header">
                <span
                  className="recursive-perspective-card-symbol"
                  style={{ color: theme.color }}
                >
                  {theme.symbol}
                </span>
                <span
                  className="recursive-perspective-card-name"
                  style={{ color: theme.color }}
                >
                  {planet} — {theme.label}
                </span>
              </div>
              <p className="recursive-perspective-card-theme">{theme.theme}</p>
              {perspNarr.intro && <p className="rc-narrative">{perspNarr.intro}</p>}
              {perspNarr.observations && <p className="rc-narrative">{perspNarr.observations}</p>}
              <AspectList aspects={persp.aspects} observerKey={planet} narratives={perspAspectNarr} />
              {shifts?.[planet] && <ShiftAnalysis shifts={shifts[planet]} perspectiveKey={planet} />}
              {transitPersp && (
                <>
                  <div className="rc-transit-separator">
                    <span>Current Transit Aspects</span>
                  </div>
                  <AspectList aspects={transitPersp.aspects} observerKey={planet} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* IV. Integration */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{READING_SECTIONS.integration.title}</h4>
        <p className="recursive-section-intro">{READING_SECTIONS.integration.intro}</p>
        {sectionNarr.integration && <p className="rc-narrative">{sectionNarr.integration}</p>}
        <ResonanceMap perspectives={perspectives} />
      </div>

      {/* V. Solar Cycle */}
      <div className="recursive-reading-section">
        <h4 className="recursive-section-header">{READING_SECTIONS.solarCycle.title}</h4>
        <p className="recursive-section-intro">{READING_SECTIONS.solarCycle.intro}</p>
        {sectionNarr.solarCycle && <p className="rc-narrative">{sectionNarr.solarCycle}</p>}
        {solarCycle && (() => {
          const rule = getSolarCycleRule(solarCycle.phase, solarCycle.ascending);
          return (
            <>
              <p className="recursive-reading-text">
                <em>Cycle {solarCycle.cycleNumber} — {rule.phase}</em>
              </p>
              <p className="recursive-reading-text">{rule.meaning}</p>
            </>
          );
        })()}
      </div>

      {/* VI. The Magnetic Architecture (when EM is on) */}
      {emFieldVisible && fieldData && (
        <div className="recursive-reading-section">
          <h4 className="recursive-section-header">{EM_READING_SECTION.title}</h4>
          <p className="recursive-section-intro">{EM_READING_SECTION.intro}</p>
          <FieldSection fieldData={fieldData} />
        </div>
      )}
    </>
  );
}

export default function RecursiveReadingPanel({
  perspective, data, weatherData, selectedPlanet,
  emFieldVisible, fieldData, mode, zodiacFrame, date, natalChart,
  personalLayer, onLayerChange, retrogrades, lunarPhase,
}) {
  const hasPersonalData = mode === 'personal' && data;
  const showBirthLayer = hasPersonalData && personalLayer === 'birth' && perspective !== 'reading';

  return (
    <div className="recursive-reading">
      {/* Layer toggle — personal mode, non-reading perspective */}
      {mode === 'personal' && perspective !== 'reading' && hasPersonalData && (
        <div className="rc-layer-toggle">
          <button
            className={`rc-layer-btn${personalLayer === 'birth' ? ' active' : ''}`}
            onClick={() => onLayerChange('birth')}
          >
            Birth Chart
          </button>
          <button
            className={`rc-layer-btn${personalLayer === 'transits' ? ' active' : ''}`}
            onClick={() => onLayerChange('transits')}
          >
            Today's Sky
          </button>
          <button
            className={`rc-layer-btn${personalLayer === 'progressed' ? ' active' : ''}`}
            onClick={() => onLayerChange('progressed')}
          >
            Progressions
          </button>
        </div>
      )}

      {/* Full reading — personal mode with birth data */}
      {perspective === 'reading' && hasPersonalData && (
        <FullReading
          data={data}
          weatherData={weatherData}
          selectedPlanet={selectedPlanet}
          emFieldVisible={emFieldVisible}
          fieldData={fieldData}
          zodiacFrame={zodiacFrame}
          date={date}
          natalChart={natalChart}
        />
      )}

      {/* Full weather reading — no birth data */}
      {perspective === 'reading' && !hasPersonalData && weatherData && (
        <WeatherFullReading
          weatherData={weatherData}
          selectedPlanet={selectedPlanet}
          emFieldVisible={emFieldVisible}
          fieldData={fieldData}
          zodiacFrame={zodiacFrame}
          date={date}
        />
      )}

      {/* Birth chart layer — personal mode default */}
      {showBirthLayer && (
        <BirthChartView
          data={data}
          selectedPlanet={selectedPlanet}
          zodiacFrame={zodiacFrame}
          date={date}
          natalChart={natalChart}
          weatherData={weatherData}
        />
      )}

      {/* Progressions layer — personal mode only */}
      {hasPersonalData && personalLayer === 'progressed' && perspective !== 'reading' && (
        <ProgressionSection
          natalChart={natalChart}
          date={date}
          zodiacFrame={zodiacFrame}
        />
      )}

      {/* Weather views — when not in birth layer of personal mode */}
      {perspective !== 'reading' && !showBirthLayer && (
        <>
          {/* Geocentric / heliocentric weather */}
          {(perspective === 'geocentric' || perspective === 'heliocentric') && weatherData && (
            <WeatherReading
              weatherData={weatherData}
              perspective={perspective}
              selectedPlanet={selectedPlanet}
              emFieldVisible={emFieldVisible}
              fieldData={fieldData}
              zodiacFrame={zodiacFrame}
              date={date}
              retrogrades={retrogrades}
              lunarPhase={lunarPhase}
            />
          )}

          {/* Planet perspective */}
          {PERSPECTIVE_THEMES[perspective] && weatherData && (
            <PlanetWeatherReading
              planetKey={perspective}
              weatherData={weatherData}
              selectedPlanet={selectedPlanet}
              emFieldVisible={emFieldVisible}
              fieldData={fieldData}
              zodiacFrame={zodiacFrame}
              date={date}
            />
          )}

          {/* Personal overlay — transits layer */}
          {hasPersonalData && (
            <PersonalOverlay
              recursiveData={data}
              weatherData={weatherData}
              selectedPlanet={selectedPlanet}
              zodiacFrame={zodiacFrame}
              date={date}
            />
          )}
        </>
      )}
    </div>
  );
}
