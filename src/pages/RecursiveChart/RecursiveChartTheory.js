import React, { useEffect } from 'react';

// ── Part I: Theory ───────────────────────────────────────────────────────────

const THEORY = [
  {
    heading: 'Working With, Not Against',
    text: 'Astrology has multiple paradigms that traditionally compete: Western tropical, Vedic sidereal, heliocentric, planet-centric. Each claims its frame is the correct one. This page doesn\u2019t pick a side. It treats each paradigm as a relative frame \u2014 a coordinate system that describes a real layer of the same sky.'
  },
  {
    heading: 'Real Positions',
    text: 'Everything computed here uses actual astronomical data via the astronomy-engine library. Planet-centric positions use real heliocentric vectors. The ayanamsa is real axial precession. The solar cycle is real magnetic physics. This isn\u2019t symbolic \u2014 it\u2019s the actual sky, computed from the same ephemeris data used in observatory software.'
  },
  {
    heading: 'The Recursive Perspective',
    text: 'The key structural move: every planet has its own chart. Mars sees the solar system from its orbit. What Venus \u201Ccarries\u201D from its vantage point shapes how Venus shows up in yours. Each planet\u2019s chart contains every other planet, forming a recursive network of mutual perspective. The chart isn\u2019t flat \u2014 it\u2019s a web of awareness.'
  },
  {
    heading: 'Integrating the Frames',
    text: 'Tropical tracks seasons (Earth\u2019s tilt) \u2014 the body\u2019s experience. Sidereal tracks fixed stars \u2014 the cosmic backdrop. Geocentric is the ego\u2019s sky. Heliocentric is the system\u2019s deeper structure. The interpretive layer maps the real geometric shifts between these frames back to the archetypal vocabulary of astrology. When a planet changes signs between geocentric and heliocentric views, that\u2019s a real positional fact with interpretive implications.'
  },
];

// ── Part II: The Rules ───────────────────────────────────────────────────────

const RULES = [
  {
    heading: 'The Seven Bodies',
    text: 'The system uses the seven classical bodies visible to the naked eye. Each one functions as both a position in the chart and an observer with its own perspective.',
    list: [
      '\u2609 Sun \u2014 The Center. Sees identity, purpose, vitality. Its perspective is the heliocentric view.',
      '\u263D Moon \u2014 The Mirror. Sees feeling, security, memory. Reflects what it receives from every other body.',
      '\u263F Mercury \u2014 The Messenger. Sees communication, connection, pattern. Close to the Sun, it maps the web of relationships.',
      '\u2640 Venus \u2014 The Harmonizer. Sees harmony, beauty, attraction. Every other planet is either a source of draw or a disruption of balance.',
      '\u2642 Mars \u2014 The Initiator. Sees action, conflict, assertion. First planet beyond Earth\u2019s orbit \u2014 everything is a challenge or a territory.',
      '\u2643 Jupiter \u2014 The Expander. Sees expansion, meaning, generosity. From its great orbit, the inner planets are rapid local concerns.',
      '\u2644 Saturn \u2014 The Keeper. Sees structure, time, limitation. At the edge of the visible system, nothing escapes Saturn\u2019s question: will this last?',
    ],
  },
  {
    heading: 'The Five Aspects',
    text: 'Aspects are angular relationships between two planets. The system recognizes five, each with an orb \u2014 a tolerance range within which the aspect is considered active.',
    list: [
      'Conjunction (0\u00B0, \u00B18\u00B0) \u2014 Fusion. Two energies merge and become indistinguishable. Intensification.',
      'Sextile (60\u00B0, \u00B16\u00B0) \u2014 Opportunity. A gentle opening. A door that responds when approached.',
      'Square (90\u00B0, \u00B18\u00B0) \u2014 Tension. Friction that demands action. Forced growth. Cannot be ignored.',
      'Trine (120\u00B0, \u00B18\u00B0) \u2014 Flow. Natural resonance. Energies harmonize without effort.',
      'Opposition (180\u00B0, \u00B18\u00B0) \u2014 Polarity. The mirror. Awareness through contrast. What is projected outward.',
    ],
  },
  {
    heading: 'Aspect Coloring by Observer',
    text: 'When aspects are shown from a specific planet\u2019s perspective, the meaning shifts. A conjunction with the Sun is \u201Cabsorbed into identity.\u201D A conjunction with Saturn is \u201Cload-bearing, non-negotiable.\u201D A square with Mars is \u201Ca collision of drives\u201D; a square with Venus is \u201Cbeauty requiring struggle.\u201D The same geometric fact reads differently depending on who\u2019s looking. This is why the recursive perspective matters \u2014 the aspects don\u2019t just exist, they\u2019re experienced.',
  },
  {
    heading: 'The Twelve Signs',
    text: 'The zodiac divides the ecliptic into twelve 30\u00B0 arcs. Each sign belongs to one element and one modality, forming a 4\u00D73 grid that organizes the entire system.',
    list: [
      'Fire (initiative, expression): Aries, Leo, Sagittarius',
      'Earth (structure, materiality): Taurus, Virgo, Capricorn',
      'Air (connection, thought): Gemini, Libra, Aquarius',
      'Water (feeling, intuition): Cancer, Scorpio, Pisces',
    ],
  },
  {
    heading: 'The Three Modalities',
    text: 'Each sign also carries a modality \u2014 its relationship to change.',
    list: [
      'Cardinal (initiation): Aries, Cancer, Libra, Capricorn \u2014 the season starters, the thresholds.',
      'Fixed (persistence): Taurus, Leo, Scorpio, Aquarius \u2014 the season holders, the consolidators.',
      'Mutable (adaptation): Gemini, Virgo, Sagittarius, Pisces \u2014 the season turners, the translators.',
    ],
  },
  {
    heading: 'Stelliums & Clusters',
    text: 'When three or more planets occupy the same sign, that\u2019s a stellium \u2014 a concentration of energy. Two planets in the same sign form a cluster. The synopsis highlights these because they reveal where the sky\u2019s weight falls. A stellium in a fire sign colors the entire chart toward initiative; a water stellium toward feeling. The dominant element and modality shape the overall tone of any day or birth chart.',
  },
  {
    heading: 'The Shift',
    text: 'When you switch from geocentric to heliocentric \u2014 or to any planet\u2019s perspective \u2014 some planets change signs. This is a real positional fact: the same body occupies different zodiacal territory depending on where you stand. The shift analysis tracks which planets moved and by how much. Planets that hold their sign across frames are structurally stable. Planets that shift are perspective-dependent \u2014 what they mean changes with the observer.',
  },
  {
    heading: 'Tropical vs. Sidereal',
    text: 'These are two coordinate systems for the same sky. Tropical anchors 0\u00B0 Aries to the vernal equinox \u2014 it tracks seasons, the body\u2019s experience of Earth\u2019s tilt. Sidereal anchors to the fixed stars \u2014 the actual constellations behind the planets. Due to axial precession, they\u2019ve drifted ~24\u00B0 apart (the ayanamsa), growing by ~1\u00B0 every 72 years. Your tropical Sun sign and sidereal Sun sign may differ. Neither is wrong. They\u2019re two valid measurements of the same position.',
  },
  {
    heading: 'The Solar Cycle',
    text: 'The Sun\u2019s magnetic field operates on an ~11-year cycle. Activity builds from solar minimum through ascending phase to solar maximum, where the magnetic poles flip \u2014 the north-south polarity literally reverses. Then activity descends through the new polarity back toward the next minimum. The system tracks four phases:',
    list: [
      'Solar Minimum \u2014 The quiet between cycles. Seeds of the next cycle form in the deep. Latent power.',
      'Ascending \u2014 Activity building. Expanding influence, intensifying field. The Sun gathers force.',
      'Solar Maximum \u2014 Polarity flip. The old field dissolves; the new one hasn\u2019t fully formed. A transformation point.',
      'Descending \u2014 Activity quieting. The new polarity consolidates. Integration of what the maximum revealed.',
    ],
  },
  {
    heading: 'The Magnetic Architecture',
    text: 'Every body in the solar system has a relationship to magnetism. The EM layer shows this real physical structure. There are four types of magnetic field:',
    list: [
      'Dipole \u2014 A coherent magnetic identity generated from within. The body sustains its own boundary against the solar wind. Earth, Jupiter, Saturn, the Sun, and (barely) Mercury have these.',
      'Induced \u2014 A field borrowed from the solar wind. Not generated, but shaped by contact. Venus has this \u2014 what looks like protection is borrowed time.',
      'Residual \u2014 Ghost of a former field, frozen in ancient rock. The dynamo has died, but the crust remembers. Mars carries this.',
      'None \u2014 No magnetic shield. The solar wind meets the surface directly. The Moon has no active field \u2014 it remembers what it can no longer sustain.',
    ],
  },
  {
    heading: 'The Sun\u2019s Field',
    text: 'The Sun\u2019s magnetic field is the container for the entire system. Its dipole (1 Gauss at the surface) generates the heliosphere \u2014 the magnetic bubble that encloses all the planets and shields them from interstellar space. The Sun is the only body whose field truly resets: at solar maximum, the poles flip, the heliosphere reorganizes, and every planet\u2019s relationship to the solar wind changes. The ~25-day rotation wraps the outward-flowing solar wind into the Parker spiral \u2014 the magnetic structure that connects the Sun to every orbit. When the cycle flips, the polarity of that connection reverses. The chart tracks this: if you\u2019re past solar maximum, the Sun\u2019s dipole is drawn flipped.',
  },
  {
    heading: 'The Planetary Fields',
    text: 'Each body\u2019s relationship to magnetism is distinct and physically real.',
    list: [
      'Jupiter \u2014 20,000\u00D7 Earth\u2019s field strength (10,000 Gauss). Carries its own magnetic kingdom. Radiation belts, volcanic moon interactions. The strongest field in the system after the Sun.',
      'Saturn \u2014 ~600\u00D7 Earth. Its dipole is almost perfectly aligned with its rotation axis (0.8\u00B0 tilt) \u2014 an unsolved problem in planetary science. Unnervingly orderly.',
      'Earth \u2014 The geodynamo archetype. 0.5 Gauss, 11.5\u00B0 dipole tilt. Has reversed hundreds of times. The magnetic field that makes life on the surface possible.',
      'Mercury \u2014 Barely there (0.003 Gauss), but real. Shouldn\u2019t exist given its slow 59-day rotation, but the dynamo persists. A whisper of a shield.',
      'Venus \u2014 No intrinsic field at all. Its induced magnetosphere exists only as long as the solar wind provides pressure. Retrograde rotation (177\u00B0 tilt) \u2014 it spins backward.',
      'Mars \u2014 Dynamo died billions of years ago. The atmosphere was stripped. Residual crustal anomalies in the southern hemisphere hold the shape of what was lost.',
      'Moon \u2014 Had a field ~3.5 billion years ago. Ghost imprints of the dead dynamo remain in the rock. Remembers what it can no longer sustain.',
    ],
  },
];

// ── Part III: The Reading ────────────────────────────────────────────────────

const READING = [
  {
    heading: 'The Monomyth Walk',
    text: 'The full reading maps the recursive journey to the hero\u2019s journey \u2014 the monomyth structure that appears across cultures. Each section of the reading corresponds to a stage:',
    list: [
      'I. The Ordinary World (geocentric) \u2014 The surface chart. What the body sees.',
      'II. The Departure (heliocentric) \u2014 Leaving the ego\u2019s sky for the center\u2019s perspective. The planets rearrange.',
      'III. The Carried Experience (planet perspectives) \u2014 Each planet\u2019s inner view. The recursive depth.',
      'IV. The Integration (the web) \u2014 All perspectives held simultaneously. No single correct view.',
      'V. The Container (solar cycle) \u2014 The largest rhythm the chart inhabits.',
      'VI. The Magnetic Architecture (EM fields) \u2014 The invisible physical structure beneath the geometry.',
    ],
  },
  {
    heading: 'The Synopsis',
    text: 'The synopsis at the top of every full reading is a quick capture of the day\u2019s arc. It\u2019s generated from the data, not from AI: where the planets concentrate, which element dominates, how many signs shift between frames, and what the tightest aspect is. In personal mode, it notes where current transits activate natal territory. It\u2019s meant to be read in a single breath \u2014 the essence before the detail.',
  },
  {
    heading: 'Weather vs. Personal',
    text: 'Weather mode shows the current sky \u2014 the celestial weather everyone walks through today. No birth data assumed. Personal mode overlays your birth chart and shows current transits alongside natal positions, highlighting where the sky today activates your chart. Both modes offer the full reading; only the personal mode adds the natal layer and transit connections.',
  },
  {
    heading: 'How to Read This Page',
    text: 'Start with the geocentric view \u2014 the shared sky. Then toggle to heliocentric and notice what shifts. Click individual planet buttons to see the system from each orbit. Toggle sidereal to see the same positions against the fixed stars. Turn on EM to see the magnetic architecture. When you\u2019re ready, click \u221E for the full reading \u2014 the walk through all perspectives in sequence. Each layer builds on the others. Same sky, deeper resolution.',
  },
];

export default function RecursiveChartTheory({ onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const renderSection = (s, i) => (
    <div key={i} className="rc-theory-section">
      <h3 className="rc-theory-heading">{s.heading}</h3>
      <p className="rc-theory-text">{s.text}</p>
      {s.list && (
        <ul className="rc-theory-list">
          {s.list.map((item, j) => (
            <li key={j} className="rc-theory-list-item">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="rc-theory-overlay" onClick={onClose}>
      <div className="rc-theory-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rc-theory-close" onClick={onClose}>{'\u2715'}</button>
        <h2 className="rc-theory-title">The Recursive Chart</h2>
        <p className="rc-theory-subtitle">The rules of the system</p>

        <div className="rc-theory-part-label">Theory</div>
        {THEORY.map(renderSection)}

        <div className="rc-theory-part-label">The Rules</div>
        {RULES.map(renderSection)}

        <div className="rc-theory-part-label">The Reading</div>
        {READING.map(renderSection)}
      </div>
    </div>
  );
}
