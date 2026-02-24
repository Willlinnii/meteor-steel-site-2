import React from 'react';
import MetalContentTabs from './MetalContentTabs';
import CultureSelector from './CultureSelector';
import DeityCard from './DeityCard';
import TextBlock from './TextBlock';
import DevelopmentPanel from '../DevelopmentPanel';
import TarotCardContent from './TarotCardContent';
import PersonaChatPanel from '../PersonaChatPanel';
import SolarMagneticField from './SolarMagneticField';
import PerspectiveTabContent from './PerspectiveTabContent';
import { useStoryForge } from '../../App';

const HINDU_GEMS = {
  Sun: 'Ruby', Moon: 'Pearl', Mars: 'Red Coral', Mercury: 'Emerald',
  Jupiter: 'Yellow Sapphire', Venus: 'Diamond', Saturn: 'Blue Sapphire',
};

function OverviewTab({ data }) {
  if (!data) return <p className="chrono-empty">Select a planet to begin.</p>;
  const m = data.core;
  const gem = HINDU_GEMS[m.planet];
  return (
    <div className="tab-content">
      {m.combinedFigure && (
        <blockquote className="combined-figure">
          <TextBlock text={m.combinedFigure} />
        </blockquote>
      )}
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Day</span><span className="ov-value">{m.day}</span></div>
        <div className="overview-item"><span className="ov-label">Sin</span><span className="ov-value">{m.sin}</span></div>
        <div className="overview-item"><span className="ov-label">Virtue</span><span className="ov-value">{m.virtue}</span></div>
        {gem && <div className="overview-item"><span className="ov-label">Stone</span><span className="ov-value">{gem}</span></div>}
      </div>
      {m.planet === 'Sun' && <SolarMagneticField />}
      {m.deities && (
        <div className="quick-deities">
          <h4>Deities Across Cultures</h4>
          {Object.entries(m.deities).map(([culture, d]) => (
            <div key={culture} className="quick-deity">
              <span className="qd-culture">{culture}:</span>{' '}
              <strong>{d.name}</strong> — {d.description}
            </div>
          ))}
        </div>
      )}
      {m.philosophies && (
        <div className="philosophies">
          <h4>Philosophical Traditions</h4>
          {Object.entries(m.philosophies).filter(([, v]) => v).map(([key, p]) => (
            <div key={key} className="philosophy-item">
              <span className="phil-key">{key}:</span>{' '}
              {p.sin && <span>{p.sin} → </span>}
              {p.virtue && <span>{p.virtue}</span>}
              {p.vice && <span>{p.vice} → </span>}
              {p.counter && <span>{p.counter}</span>}
              {p.affliction && <span>{p.affliction}</span>}
              {p.principle && <span>{p.principle}</span>}
              {p.pillar && <span>{p.pillar}</span>}
              {p.excess && <span>{p.excess} → {p.virtue}</span>}
              {p.description && <span className="phil-desc"> — {p.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEITY_CULTURE_ALIASES = {
  Vedic: ['hindu', 'indian', 'vedic'],
  Islamic: ['islamic', 'arabic', 'persian'],
  Medieval: ['medieval', 'christian'],
  Babylonian: ['babylonian', 'sumerian', 'mesopotamian'],
};

function DeitiesTab({ data, activeCulture }) {
  const deityList = data?.deities?.deities || [];
  const planet = data?.core?.planet;
  const deityData = PLANET_DEITIES[planet];
  const aliases = DEITY_CULTURE_ALIASES[activeCulture] || [activeCulture.toLowerCase()];
  const filtered = activeCulture
    ? deityList.filter(d => d.culture && aliases.some(a => d.culture.toLowerCase().includes(a)))
    : deityList;

  if (!deityList.length && !deityData) return <p className="chrono-empty">No deity data available.</p>;

  return (
    <div className="tab-content">
      {deityData && (
        <>
          {['vala', 'navagraha', 'norseGod', 'sephira'].map(key => {
            const entry = deityData[key];
            if (!entry) return null;
            const labels = { vala: 'Vala', navagraha: 'Navagraha', norseGod: 'Norse', sephira: 'Sephira' };
            return (
              <div className="body-section" key={key}>
                <h5>{labels[key]}</h5>
                <p>{entry.text}</p>
                <p className="body-meta self-source">{entry.source}</p>
              </div>
            );
          })}
        </>
      )}
      {filtered.length === 0 && deityList.length > 0 && <p className="chrono-empty">No deities found for this culture.</p>}
      {filtered.map((d, i) => (
        <DeityCard key={`${d.name}-${i}`} deity={d} />
      ))}
    </div>
  );
}

function SinsTab({ data }) {
  const a = data?.archetype;
  const m = data?.modern;
  const artists = data?.artists;
  const t = data?.theology;
  const s = data?.stories;
  const sinName = data?.core?.sin;
  const virtueName = data?.core?.virtue;
  const planet = data?.core?.planet;
  const pos = data?._bodyPosition;
  const chakra = pos ? pos.chakra : PLANET_CHAKRA_DETAILS[planet];
  const sinData = PLANET_SINS[planet];
  if (!a && !m && !artists && !t && !s && !sinData) return <p className="chrono-empty">No sin/virtue data available.</p>;

  const artistFields = [
    ['bosch', 'Hieronymus Bosch'],
    ['dali', 'Salvador Dalí'],
    ['bruegel', 'Pieter Bruegel'],
    ['cadmus', 'Paul Cadmus'],
    ['blake', 'William Blake'],
  ];

  return (
    <div className="tab-content">
      {sinName && <h4 className="archetype-name">{sinName}</h4>}
      {virtueName && <p className="sin-virtue-pair">Virtue: {virtueName}</p>}
      {sinData && (
        <>
          {['hermeticVice', 'descentFunction', 'neoplatonist', 'danteTriple'].map(key => {
            const entry = sinData[key];
            if (!entry) return null;
            const labels = { hermeticVice: 'Hermetic Vice', descentFunction: 'Function in Descent', neoplatonist: 'Neoplatonist Imbalance', danteTriple: 'Dante — Paradise / Purgatory / Hell' };
            return (
              <div className="body-section" key={key}>
                <h5>{labels[key]}</h5>
                <p>{entry.text}</p>
                <p className="body-meta self-source">{entry.source}</p>
              </div>
            );
          })}
        </>
      )}
      {chakra && (
        <div className="archetype-section sin-chakra-context">
          <h5>{chakra.label} Chakra ({chakra.sanskrit})</h5>
          <p>{pos ? pos.description : chakra.description}</p>
        </div>
      )}
      {a && (
        <>
          <div className="archetype-section">
            <h5>Shadow &mdash; {a.archetype}</h5>
            <p>{a.shadow}</p>
          </div>
          <div className="archetype-section">
            <h5>Light</h5>
            <p>{a.light}</p>
          </div>
        </>
      )}
      {m?.modernLife && (
        <div className="modern-section">
          <h5>Modern Life</h5>
          {m.modernLife.sin && <p><strong>Sin:</strong> {m.modernLife.sin}</p>}
          {m.modernLife.virtue && <p><strong>Virtue:</strong> {m.modernLife.virtue}</p>}
        </div>
      )}
      {m?.political && (
        <div className="modern-section">
          <h5>Political</h5>
          {m.political.sin && <p><strong>Sin:</strong> {m.political.sin}</p>}
          {m.political.virtue && <p><strong>Virtue:</strong> {m.political.virtue}</p>}
        </div>
      )}
      {m?.planetBlockage && (
        <div className="modern-section">
          <h5>Planetary Blockage</h5>
          {m.planetBlockage.attributes && <p className="attr-list">{m.planetBlockage.attributes.join(' · ')}</p>}
          {m.planetBlockage.description && <p>{m.planetBlockage.description}</p>}
        </div>
      )}
      {artists && (
        <div className="modern-section">
          <h5>Artists' Depictions</h5>
          {artistFields.map(([key, label]) => artists[key] ? (
            <div key={key} className="artist-section">
              <h5>{label}</h5>
              <p>{artists[key]}</p>
            </div>
          ) : null)}
        </div>
      )}
      {m?.films && m.films.length > 0 && (
        <div className="modern-section">
          <h5>Films</h5>
          <ul className="film-list">
            {m.films.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
      {s && (
        <div className="modern-section">
          <h5>Literary Depictions</h5>
          {[
            ['castleOfPerseverance', 'The Castle of Perseverance'],
            ['faerieQueene', 'The Faerie Queene'],
            ['danteInferno', "Dante's Inferno"],
            ['canterburyTales', 'Canterbury Tales'],
            ['drFaustus', 'Doctor Faustus'],
            ['decameron', 'The Decameron'],
            ['arthurian', 'Arthurian Legend'],
            ['weillBallet', 'Weill Ballet'],
            ['seven', 'Se7en'],
            ['devilsAdvocate', "The Devil's Advocate"],
            ['shazam', 'Shazam!'],
          ].map(([key, label]) => s[key] ? (
            <div key={key} className="story-section">
              <h5>{label}</h5>
              <p>{s[key]}</p>
            </div>
          ) : null)}
        </div>
      )}
      {t && (
        <>
          {t.desertFathers && <div className="theology-section"><h5>Desert Fathers</h5><p>{t.desertFathers}</p></div>}
          {t.cassian && <div className="theology-section"><h5>John Cassian</h5><p>{t.cassian}</p></div>}
          {t.popeGregory && <div className="theology-section"><h5>Pope Gregory</h5><p>{t.popeGregory}</p></div>}
          {t.aquinas && <div className="theology-section"><h5>Thomas Aquinas</h5><p>{t.aquinas}</p></div>}
          {t.aquinasVirtue && <div className="theology-section"><h5>Aquinas — Virtue</h5><p>{t.aquinasVirtue}</p></div>}
        </>
      )}
    </div>
  );
}

function DayTab({ data }) {
  const m = data?.modern;
  const core = data?.core;
  const planet = data?.core?.planet;
  const dayData = PLANET_DAY[planet];
  if (!m && !core && !dayData) return <p className="chrono-empty">No day data available.</p>;

  return (
    <div className="tab-content">
      {core && (
        <div className="modern-section">
          <h4>{core.day} — {core.planet}</h4>
        </div>
      )}
      {dayData && (
        <>
          {['etymology', 'planetaryHour', 'hebrewCreation', 'islamicDay'].map(key => {
            const entry = dayData[key];
            if (!entry) return null;
            const labels = { etymology: 'Etymology', planetaryHour: 'Planetary Hour', hebrewCreation: 'Hebrew Creation', islamicDay: 'Islamic Day' };
            return (
              <div className="body-section" key={key}>
                <h5>{labels[key]}</h5>
                <p>{entry.text}</p>
                <p className="body-meta self-source">{entry.source}</p>
              </div>
            );
          })}
        </>
      )}
      {m?.planetPositive && (
        <div className="modern-section">
          <h5>Planetary Positive</h5>
          {m.planetPositive.attributes && <p className="attr-list">{m.planetPositive.attributes.join(' · ')}</p>}
          {m.planetPositive.description && <p>{m.planetPositive.description}</p>}
        </div>
      )}
      {m?.planetConnection && (
        <div className="modern-section">
          <h5>Planet Connection</h5>
          <p>{m.planetConnection}</p>
        </div>
      )}
    </div>
  );
}

const PLANET_GLANDS = {
  Sun:     { gland: 'Pineal',                  hormones: 'Melatonin, DMT' },
  Moon:    { gland: 'Pituitary',               hormones: 'Oxytocin, Endorphins, Regulatory Hormones' },
  Mercury: { gland: 'Thyroid & Parathyroid',   hormones: 'Thyroxine, Triiodothyronine, Calcitonin' },
  Venus:   { gland: 'Thymus',                  hormones: 'Thymosin' },
  Mars:    { gland: 'Pancreas',                hormones: 'Insulin, Glucagon' },
  Jupiter: { gland: 'Gonads (Ovaries/Testes)', hormones: 'Estrogen, Progesterone, Testosterone' },
  Saturn:  { gland: 'Adrenal',                 hormones: 'Adrenaline (Epinephrine), Cortisol' },
};

const PLANET_CHAKRA_DETAILS = {
  Saturn: {
    label: 'Root',
    sanskrit: 'Muladhara',
    location: 'Base of spine',
    theme: 'Survival, safety, grounding, belonging',
    element: 'Earth',
    sin: 'Sloth',
    description: 'The Root Chakra, grounding us to the earth and our basic survival instincts, when affected by Sloth, linked to Saturn, the god of time and discipline, reflects a lack of motivation and discipline. Saturn\'s slow, enduring energy, when negative, can lead to inertia, preventing the establishment of a stable foundation for physical and spiritual growth.',
  },
  Venus: {
    label: 'Sacral',
    sanskrit: 'Svadhishthana',
    location: 'Lower abdomen / pelvis',
    theme: 'Emotion, pleasure, sexuality, creativity',
    element: 'Water',
    sin: 'Lust',
    description: 'The Sacral Chakra, related to creativity and emotional life, when distorted by Lust, associated with Venus, the goddess of love and beauty, highlights the misuse of creative and sexual energies. Venus\' allure underscores the temptation to succumb to physical desires, which can disrupt emotional balance and creative expression.',
  },
  Jupiter: {
    label: 'Solar Plexus',
    sanskrit: 'Manipura',
    location: 'Upper abdomen',
    theme: 'Power, will, identity, confidence',
    element: 'Fire',
    sin: 'Gluttony',
    description: 'The Solar Plexus Chakra, associated with personal power and self-worth, when imbalanced by Gluttony, connected to Jupiter, the king of gods, emphasizes excess and indulgence. Jupiter\'s expansive influence can lead to an overemphasis on power and consumption, overshadowing self-discipline and inner strength.',
  },
  Mercury: {
    label: 'Heart',
    sanskrit: 'Anahata',
    location: 'Center of chest',
    theme: 'Love, compassion, connection',
    element: 'Air',
    sin: 'Greed',
    description: 'The Heart Chakra, the center of love and empathy, when influenced by Greed, linked to Mercury, the messenger and god of commerce, suggests how a desire for material wealth and accumulation can harden the heart. Mercury\'s association with trade and wealth highlights the risk of valuing possessions over connections, undermining the openness and generosity of the Anahata.',
  },
  Mars: {
    label: 'Throat',
    sanskrit: 'Vishuddha',
    location: 'Throat',
    theme: 'Expression, truth, communication',
    element: 'Ether / Space',
    sin: 'Wrath',
    description: 'The Throat Chakra governs communication, and when impacted by Wrath, associated with Mars, the god of war, it emphasizes how anger can disrupt our ability to communicate effectively. Mars\' aggressive energy can lead to destructive speech and hinder compassionate listening, reflecting the need for control over our words and emotions.',
  },
  Moon: {
    label: 'Third Eye',
    sanskrit: 'Ajna',
    location: 'Between eyebrows',
    theme: 'Insight, intuition, imagination',
    element: 'Mind / Light',
    sin: 'Envy',
    description: 'The Third Eye Chakra, connected to intuition and insight, when influenced by Envy, associated with the Moon, reflects how jealousy clouds our perception and distorts reality. The Moon, with its phases and changes, symbolizes the fluctuating nature of desire and envy, affecting our ability to see clearly and understand deeper truths.',
  },
  Sun: {
    label: 'Crown',
    sanskrit: 'Sahasrara',
    location: 'Top of head',
    theme: 'Unity, transcendence, meaning',
    element: 'Consciousness',
    sin: 'Pride',
    description: 'The Crown Chakra, linked to the Sun, symbolizes our connection to the divine and universal consciousness. The Sun, representing vitality, ego, and self, when associated with Pride, highlights how an inflated sense of self-importance can sever spiritual connections. Pride, as the most severe sin according to Christian tradition, aligns with the Crown Chakra\'s role as the spiritual pinnacle, reminding us that detachment from ego is essential for true enlightenment.',
  },
};

const PLANET_SELF = {
  Sun: {
    soul: { text: 'Vitative Soul — life and consciousness; the spark of individual awareness', source: 'Manly P. Hall' },
    vehicle: { text: 'Ego / Spiritual Self (Steiner); Buddhic Body / Intuition (Leadbeater); Desire Body / Kama (Blavatsky)', source: 'Steiner, Leadbeater, Blavatsky' },
    consciousness: { text: 'Waking consciousness and self-awareness', source: 'Steiner' },
    vice: { text: 'Presumption, egoism, vanity, self-glory — the false center of radiant pride', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Transparent center and balance — radiance without self-worship', source: 'Neoplatonist' },
    temperament: { text: 'Balanced', source: 'Kepler' },
    imbalance: { text: 'Pride, selfhood, and idolatry — spiritual blindness', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Buddhic / Intuitional — love, wisdom, unity consciousness, direct knowing', source: 'Leadbeater' },
    sense: { text: 'Intuition and direct knowing', source: 'Leadbeater' },
  },
  Moon: {
    soul: { text: 'Vegetative Soul — generation and instinct; the power of reproduction and bodily growth', source: 'Manly P. Hall' },
    vehicle: { text: 'Astral Body (Steiner); Adi / Divine Spark (Leadbeater); Universal Spirit / Atman (Blavatsky)', source: 'Steiner, Leadbeater, Blavatsky' },
    consciousness: { text: 'Dream consciousness — picture consciousness, the threshold between sleep and waking', source: 'Steiner' },
    vice: { text: 'Increase and decrease — attachment to change, flux, illusion, growth and loss', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Receptivity, patience, and the courage to feel', source: 'Neoplatonist' },
    temperament: { text: 'Phlegmatic (variable — reflects the Moon\'s phases)', source: 'Kepler' },
    imbalance: { text: 'Inconsistency, illusion, mood swings, hysteria — shadows, mirrors, and reflection', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Adi / Divine — unmanifest source', source: 'Leadbeater' },
    sense: { text: 'Psychic sensitivity, dream perception', source: 'Leadbeater' },
  },
  Mars: {
    soul: { text: 'Impulsive Soul — courage and spiritedness; the capacity for action, aggression, and will', source: 'Manly P. Hall' },
    vehicle: { text: 'Mental Body / Lower Mind (Leadbeater); Astral Body / Astral Double (Blavatsky)', source: 'Leadbeater, Blavatsky' },
    consciousness: { text: 'Mental — thought, reason, imagination, and ideas', source: 'Leadbeater' },
    vice: { text: 'Rashness, anger, violence — unrefined assertiveness', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Nobility, strength with gentleness, discernment for the good', source: 'Neoplatonist' },
    temperament: { text: 'Choleric — vigorous, assertive, ambitious, intense', source: 'Kepler' },
    imbalance: { text: 'Anger, violence, impatience, fever, inflammation', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Mental / Lower Causal — thought, reason, imagination', source: 'Leadbeater' },
    sense: { text: 'Telepathy — thought-form and symbolic perception', source: 'Leadbeater' },
  },
  Mercury: {
    soul: { text: 'Intellectual Soul — speech and communication; the faculty of language, analysis, and exchange', source: 'Manly P. Hall' },
    vehicle: { text: 'Atmic Body / Spiritual Will (Leadbeater); Human Soul / Manas (Blavatsky)', source: 'Leadbeater, Blavatsky' },
    consciousness: { text: 'Spiritual will — universal purpose and cosmic intelligence', source: 'Leadbeater, Blavatsky' },
    vice: { text: 'Deceit, cunning, intellectual pride — misuse of mind or false cleverness', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Humility — the messenger who serves rather than manipulates', source: 'Neoplatonist' },
    temperament: { text: 'Sanguine — flickering mind, changeable, clever, cheerful, social', source: 'Kepler' },
    imbalance: { text: 'Restlessness, duplicity, nervousness, instability', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Atmic / Spiritual — universal purpose', source: 'Leadbeater' },
    sense: { text: 'Spiritual vision — seeing through directly, sensing purpose', source: 'Leadbeater' },
  },
  Jupiter: {
    soul: { text: 'Reasonable Soul — judgment and governance; the power to order, administer, and rule wisely', source: 'Manly P. Hall' },
    vehicle: { text: 'Spirit Self / Manas (Steiner); Astral Body / Emotional Vehicle (Leadbeater); Life Essence / Prana (Blavatsky)', source: 'Steiner, Leadbeater, Blavatsky' },
    consciousness: { text: 'Conscious imagination — psychic and visionary', source: 'Steiner' },
    vice: { text: 'Evil purpose, ambition, manipulation — hunger to rule, corrupted moral order', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Ruling through listening — expansion held by wisdom', source: 'Neoplatonist' },
    temperament: { text: 'Sanguine — majestic and noble', source: 'Kepler' },
    imbalance: { text: 'Pride, hubris, tyranny, inflation, overindulgence, overgrowth', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Astral / Emotional — desires, dreams, personal attachments', source: 'Leadbeater' },
    sense: { text: 'Astral clairvoyance — emotion sensing, aura perception', source: 'Leadbeater' },
  },
  Venus: {
    soul: { text: 'Amative Soul — love and attraction; the power to desire, unite, and create through relationship', source: 'Manly P. Hall' },
    vehicle: { text: 'Life Spirit / Buddhi (Steiner); Monadic (Leadbeater); Spiritual Soul (Blavatsky)', source: 'Steiner, Leadbeater, Blavatsky' },
    consciousness: { text: 'Conscious inspiration — archetypal causes and pure will', source: 'Steiner' },
    vice: { text: 'Desire, sensuality, craving, lust — the soul\'s binding to pleasure', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Beauty that sees truth — attraction in service of the real', source: 'Neoplatonist' },
    temperament: { text: 'Phlegmatic — gentle, calm, balanced, reliable, steady', source: 'Kepler' },
    imbalance: { text: 'Attachment, lust, sensual excess, emotional weakness', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Monadic — archetypal causes and pure will', source: 'Leadbeater' },
    sense: { text: 'Aesthetic perception — feeling beauty as truth', source: 'Leadbeater' },
  },
  Saturn: {
    soul: { text: 'Contemplative Soul — reason and intellect; the power of contemplation and abstract thought', source: 'Manly P. Hall' },
    vehicle: { text: 'Physical Body / Earthly Matter (Steiner); Physical Body / Etheric Vehicle (Leadbeater); Body (Blavatsky)', source: 'Steiner, Leadbeater, Blavatsky' },
    consciousness: { text: 'Trance — deep unconsciousness, mineral consciousness', source: 'Steiner' },
    vice: { text: 'Falsehood, spiritual blindness — the final veil, root of forgetfulness', source: 'Corpus Hermeticum, Paracelsus' },
    virtue: { text: 'Limitation as clarity — discipline that reveals what is essential', source: 'Neoplatonist' },
    temperament: { text: 'Melancholic — introspective, slow, deep, heavy and distinct', source: 'Kepler' },
    imbalance: { text: 'Melancholy, fear, withdrawal, asceticism, withdrawal of joy', source: 'Neoplatonist, Paracelsus' },
    plane: { text: 'Physical / Dense — sensory experience and incarnation', source: 'Leadbeater' },
    sense: { text: 'Physical senses — the body itself as instrument', source: 'Leadbeater' },
  },
};

const PLANET_METAL = {
  Sun: {
    alchemicalStage: { text: 'Conjunction (Coniunctio) — the sacred marriage of conscious and unconscious, union of opposites', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Heart — vitality, center, illumination', source: 'Paracelsus' },
    element: { text: 'Fire — central source of light and life', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Ruby (Manikya)', source: 'Vedic' },
    liberalArt: { text: 'Arithmetic — the science of number', source: 'Golden Dawn' },
    musicalInterval: { text: 'Balanced — the central tone from which all intervals are measured', source: 'Kepler' },
  },
  Moon: {
    alchemicalStage: { text: 'Coagulation (Philosopher\'s Stone) — final solidification of perfected substance, the completed Stone', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Brain — rhythm, cycles, imagination, reflection', source: 'Paracelsus' },
    element: { text: 'Water — tidal, cyclical, reflective', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Pearl (Moti)', source: 'Vedic' },
    liberalArt: { text: 'Grammar — the foundation of language', source: 'Golden Dawn' },
    musicalInterval: { text: 'Variable — reflects the Moon\'s phases', source: 'Kepler' },
  },
  Mars: {
    alchemicalStage: { text: 'Separation (Separatio) — extracting the essential, cutting, dissecting, sorting what matters from what does not', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Gallbladder / Blood — strength, fire, courage, action', source: 'Paracelsus' },
    element: { text: 'Fire — assertive, forceful, vigorous', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Red Coral (Moonga)', source: 'Vedic' },
    liberalArt: { text: 'Music — harmony born of tension', source: 'Golden Dawn' },
    musicalInterval: { text: 'Perfect fifth (3:2)', source: 'Kepler' },
    platonicSolid: { text: 'Tetrahedron — simplest solid, pure fire', source: 'Kepler' },
  },
  Mercury: {
    alchemicalStage: { text: 'Distillation (Distillatio) — purifying and elevating essence through vapor, repeated cycles of refining', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Lungs — breath, exchange, thought', source: 'Paracelsus' },
    element: { text: 'Air — fleet, changeable, communicative', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Emerald (Panna)', source: 'Vedic' },
    liberalArt: { text: 'Logic / Dialectic — the discipline of reasoning', source: 'Golden Dawn' },
    musicalInterval: { text: 'Major tenth (12:5)', source: 'Kepler' },
    platonicSolid: { text: 'Octahedron — dual of the cube, airy and quick', source: 'Kepler' },
  },
  Jupiter: {
    alchemicalStage: { text: 'Dissolution (Albedo / Whitening) — liquefaction, the unconscious floods in, old structures wash away', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Liver — expansion, generosity, assimilation, growth', source: 'Paracelsus' },
    element: { text: 'Air and Fire — expansive, warm, generous', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Yellow Sapphire (Pukhraj)', source: 'Vedic' },
    liberalArt: { text: 'Geometry — knowledge of spatial form', source: 'Golden Dawn' },
    musicalInterval: { text: 'Minor third (6:5)', source: 'Kepler' },
    platonicSolid: { text: 'Cube — stable, solid, foundational', source: 'Kepler' },
  },
  Venus: {
    alchemicalStage: { text: 'Fermentation (Putrefaction and Rebirth) — old self decays so new can grow, the soul awakening', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Kidneys — harmony, fertility, sensuality, bonding, pleasure', source: 'Paracelsus' },
    element: { text: 'Water — gentle, harmonious, near-perfect circular orbit', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Diamond (Heera)', source: 'Vedic' },
    liberalArt: { text: 'Rhetoric — the art of persuasion and beauty in speech', source: 'Golden Dawn' },
    musicalInterval: { text: 'Minor semitone (25:24) — the smallest, most delicate interval', source: 'Kepler' },
    platonicSolid: { text: 'Icosahedron — twenty faces, most sphere-like of solids', source: 'Kepler' },
  },
  Saturn: {
    alchemicalStage: { text: 'Calcination (Nigredo / Blackening) — smelting to prima materia, burning away ego, attachments, false structures to ash', source: 'Golden Dawn, Rosicrucian' },
    organ: { text: 'Spleen — structure, contraction, boundary, melancholy', source: 'Paracelsus' },
    element: { text: 'Earth — slow, heavy, dense, enduring', source: 'Paracelsus, Kepler' },
    gemstone: { text: 'Blue Sapphire (Neelam)', source: 'Vedic' },
    liberalArt: { text: 'Astronomy — contemplation of celestial order', source: 'Golden Dawn' },
    musicalInterval: { text: 'Major third (5:4)', source: 'Kepler' },
  },
};

const PLANET_PLANET = {
  Sun: {
    sephira: { text: 'Tiphareth (Beauty) — divine compassion, harmony, the heart of the Tree of Life', source: 'Kabbalah' },
    angel: { text: 'Michael', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Surya — the Sun god, father of Manu. Soul, authority, vitality, truth, the king.', source: 'Vedic' },
    arabicName: { text: 'Shams', source: 'Al-Farabi' },
    elvishName: { text: 'Anar — vessel carrying the last golden fruit of Laurelin across the sky, guided by the Maia Arien', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Asgard — realm of the Aesir gods. Divine order above: law, prophecy, cosmic motion.', source: 'Norse' },
    dante: { text: 'Fourth Heaven — the great theologians. Twin rings of light. Purgatory: Pride, bent double under crushing stones. Hell: Violence (three rings).', source: 'Dante' },
    loka: { text: 'Satya-loka (Brahma-loka) — the plane of truth, Brahma\'s realm', source: 'Vedic' },
  },
  Moon: {
    sephira: { text: 'Yesod (Foundation) — creative energy, fertility, sexuality, emotions, dreams', source: 'Kabbalah' },
    angel: { text: 'Gabriel', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Chandra / Soma — the Moon god. Mind, emotions, intuition, nurturing, the queen.', source: 'Vedic' },
    arabicName: { text: 'Qamar', source: 'Al-Farabi' },
    elvishName: { text: 'Ithil (Rána) — the vessel carrying the last silver flower of Telperion', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Midgard — realm of humanity. Mortality, meaning, and struggle.', source: 'Norse' },
    dante: { text: 'First Heaven — souls who broke sacred vows, deficient in constancy. Purgatory: Envy, eyes sewn shut. Hell: Heresy, entombed in flaming sepulchres.', source: 'Dante' },
    loka: { text: 'Tapo-loka — the plane of austerity and tapas', source: 'Vedic' },
  },
  Mars: {
    sephira: { text: 'Geburah (Severity) — judgment, discipline, the power to purify', source: 'Kabbalah' },
    angel: { text: 'Samael', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Mangala / Kartikeya (son of Shiva) — courage, war, energy, action, the warrior.', source: 'Vedic' },
    arabicName: { text: 'Mirrikh', source: 'Al-Farabi' },
    elvishName: { text: 'Carnil — the red star', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Jotunheim — realm of the giants. Opposition, chaos, challenge, elemental land.', source: 'Norse' },
    dante: { text: 'Fifth Heaven — warriors of faith, souls forming a luminous cross. Purgatory: Wrath, blinded by acrid smoke. Hell: Wrath and Sullenness in the river Styx.', source: 'Dante' },
    loka: { text: 'Jana-loka — the plane of the mind-born sons of Brahma', source: 'Vedic' },
  },
  Mercury: {
    sephira: { text: 'Hod (Splendor) — intellectual clarity, analytical precision, the glory of the mind', source: 'Kabbalah' },
    angel: { text: 'Raphael', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Budha (son of Chandra and Tara) — intellect, communication, trade, adaptability, the messenger.', source: 'Vedic' },
    arabicName: { text: '\'Utarid', source: 'Al-Farabi' },
    elvishName: { text: 'Elemmírë', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Alfheim — realm of the light elves. Beauty, grace, spiritual brightness, ethereal vision.', source: 'Norse' },
    dante: { text: 'Second Heaven — souls who did good for fame rather than God. Purgatory: Avarice, bound face-down to earth. Hell: Avarice and Prodigality, pushing great weights in circles.', source: 'Dante' },
    loka: { text: 'Mahar-loka — the plane of great saints and sages', source: 'Vedic' },
  },
  Jupiter: {
    sephira: { text: 'Chesed (Mercy) — love, compassion, expansion, overflowing grace', source: 'Kabbalah' },
    angel: { text: 'Zadkiel', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Brihaspati — guru of the Devas. Wisdom, expansion, teaching, dharma, the priest-sage.', source: 'Vedic' },
    arabicName: { text: 'Mushtari', source: 'Al-Farabi' },
    elvishName: { text: 'Alcarinquë — the glorious star', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Svartalfheim — realm of the dwarves. Master smiths beneath the surface, shaping reality.', source: 'Norse' },
    dante: { text: 'Sixth Heaven — the just rulers. Souls spell DILIGITE IUSTITIAM and form an eagle. Purgatory: Gluttony, starving before unreachable fruit. Hell: Gluttony, lying in freezing filth.', source: 'Dante' },
    loka: { text: 'Svar-loka — the celestial plane, heaven of the gods', source: 'Vedic' },
  },
  Venus: {
    sephira: { text: 'Netzach (Victory) — majesty, endurance of feeling, artistic force, creative perseverance', source: 'Kabbalah' },
    angel: { text: 'Anael', source: 'John Dee, Golden Dawn' },
    navagraha: { text: 'Shukra Acharya — guru of the Asuras. Beauty, pleasure, love, art, material wealth, the poet.', source: 'Vedic' },
    arabicName: { text: 'Zuhrah', source: 'Al-Farabi' },
    elvishName: { text: 'Eärendil (Gil-Estel) — the Star of Hope, bearing the Silmaril across the sky', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Vanaheim — realm of the Vanir gods. Fertile, peaceful, regenerative, sensual, foresight.', source: 'Norse' },
    dante: { text: 'Third Heaven — souls whose love was excessive but redirected toward God. Purgatory: Lust, walking through refining fire. Hell: Lust, swept in eternal storm.', source: 'Dante' },
    loka: { text: 'Bhuvar-loka — the atmospheric plane, the astral realm', source: 'Vedic' },
  },
  Saturn: {
    sephira: { text: 'Binah (Understanding) — receptive comprehension, the cosmic divine womb', source: 'Kabbalah' },
    angel: { text: 'Cassiel', source: 'John Dee, Golden Dawn, Kabbalah' },
    navagraha: { text: 'Shani Deva (son of Surya and Chhaya) — discipline, karma, suffering, endurance, the taskmaster.', source: 'Vedic' },
    arabicName: { text: 'Zuhal', source: 'Al-Farabi' },
    elvishName: { text: 'Lumbar', source: 'Tolkien (Morgoth\'s Ring)' },
    realm: { text: 'Helheim — realm of the dead. Quiet dissolution, stillness, the forgotten dead, silence.', source: 'Norse' },
    dante: { text: 'Seventh Heaven — the contemplatives. A golden ladder rises beyond sight. Purgatory: Sloth, running ceaselessly. Hell: Limbo, sighing in darkness without hope.', source: 'Dante' },
    loka: { text: 'Bhu-loka — the Earth plane, the physical world', source: 'Vedic' },
  },
};

const PLANET_SINS = {
  Sun: {
    hermeticVice: { text: 'Presumption, egoism, vanity, self-glory — the false center of radiant pride', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'The false center of radiant pride — the soul mistakes its own light for the source', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Fourth Heaven, the theologians in twin rings of light. Purgatory: First Terrace — Pride (Superbia), bent double under crushing stones. Hell: Seventh Circle — Violence in three rings (against others, self, God/nature).', source: 'Dante' },
    neoplatonist: { text: 'Pride, selfhood, and idolatry — the imbalance is mistaking the reflector for the light', source: 'Neoplatonist' },
  },
  Moon: {
    hermeticVice: { text: 'Increase and decrease — attachment to change, flux, illusion, growth and loss', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'The soul\'s entry into time cycles — bound to waxing and waning, the illusion that change is loss', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: First Heaven — souls who broke sacred vows, deficient in constancy of faith. Purgatory: Second Terrace — Envy (Invidia), eyes sewn shut with iron wire. Hell: Sixth Circle — Heresy, entombed in flaming sepulchres.', source: 'Dante' },
    neoplatonist: { text: 'Inconsistency, illusion, dreams, shadows, mirrors, and reflection — the soul loses itself in its own images', source: 'Neoplatonist' },
  },
  Mars: {
    hermeticVice: { text: 'Rashness, anger, violence — impulse and will without wisdom', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'Unrefined assertiveness — the soul acquires the power to act but not yet the discernment to act well', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Fifth Heaven — warriors of faith forming a luminous cross. Purgatory: Third Terrace — Wrath (Ira), blinded by acrid smoke. Hell: Fifth Circle — Wrath and Sullenness, fighting on the Styx, sullen gurgling beneath.', source: 'Dante' },
    neoplatonist: { text: 'Anger, violence, and impatience — the virtue of courage corrupted into aggression', source: 'Neoplatonist' },
  },
  Mercury: {
    hermeticVice: { text: 'Deceit, cunning, intellectual pride, and trickery', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'Misuse of mind or false cleverness — the intellect turned to manipulation rather than communication', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Second Heaven — souls who did good for fame and honor rather than God alone. Purgatory: Fifth Terrace — Avarice (Avaritia), bound face-down to the earth. Hell: Fourth Circle — Avarice and Prodigality, pushing great weights in endless circles.', source: 'Dante' },
    neoplatonist: { text: 'Restlessness, duplicity, and cleverness without depth — the messenger corrupted into the con artist', source: 'Neoplatonist' },
  },
  Jupiter: {
    hermeticVice: { text: 'Evil purpose, ambition, manipulation, and hunger to rule', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'Corrupted moral order — the soul acquires the power to govern but bends it toward domination', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Sixth Heaven — the just rulers. Souls spell DILIGITE IUSTITIAM and form an eagle of justice. Purgatory: Sixth Terrace — Gluttony (Gula), starving before unreachable fruit trees. Hell: Third Circle — Gluttony, lying in freezing rain, gnawed by Cerberus.', source: 'Dante' },
    neoplatonist: { text: 'Pride, hubris, tyranny, and inflation — expansion without the wisdom to hold it', source: 'Neoplatonist' },
  },
  Venus: {
    hermeticVice: { text: 'Desire, sensuality, craving, and lust', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'The soul\'s binary binding to pleasure — attraction becomes attachment, beauty becomes possession', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Third Heaven — souls whose love was excessive but redirected toward God. Purgatory: Seventh Terrace — Lust (Luxuria), walking through refining fire. Hell: Second Circle — Lust, swept in an eternal storm, never at rest.', source: 'Dante' },
    neoplatonist: { text: 'Attachment, lust, and pleasure at the expense of truth — beauty that forgets what it is reflecting', source: 'Neoplatonist' },
  },
  Saturn: {
    hermeticVice: { text: 'Falsehood, spiritual blindness, and ultimate illusion', source: 'Corpus Hermeticum' },
    descentFunction: { text: 'The final veil, root of forgetfulness — the soul forgets its origin entirely upon entering matter', source: 'Corpus Hermeticum, Paracelsus' },
    danteTriple: { text: 'Paradise: Seventh Heaven — the contemplatives. A golden ladder rises beyond sight. Purgatory: Fourth Terrace — Sloth (Acedia), running ceaselessly. The hinge sin: Saturn/Saturday/Sabbath at the exact center of purgation. Hell: First Circle — Limbo, sighing in darkness without hope.', source: 'Dante' },
    neoplatonist: { text: 'Melancholy, asceticism, and withdrawal of joy — limitation that forgets it serves a purpose', source: 'Neoplatonist' },
  },
};

const PLANET_DEITIES = {
  Sun: {
    vala: { text: 'Arda — the created world itself. Not a Vala but the physical realization of the Great Music. Anar (the Sun) carries the last golden fruit of Laurelin.', source: 'Tolkien' },
    navagraha: { text: 'Surya Deva — the Sun god, father of Manu. Soul, authority, vitality, truth, the king.', source: 'Vedic' },
    norseGod: { text: 'Sol / Sunna — radiant sovereign, timekeeper of fate. Presence, not dominance.', source: 'Norse' },
    sephira: { text: 'Tiphareth (Beauty) — divine compassion, harmony, the heart of the Tree of Life. Angel: Michael.', source: 'Kabbalah' },
  },
  Moon: {
    vala: { text: 'Nienna — Lady of Mercy. She mourns for every wound Arda has suffered. Her grief turns to wisdom. She taught Gandalf pity.', source: 'Tolkien' },
    navagraha: { text: 'Chandra / Soma — the Moon god. Mind, emotions, intuition, nurturing, the queen.', source: 'Vedic' },
    norseGod: { text: 'Mani — mortal cycles, the passage of time, the changing phases.', source: 'Norse' },
    sephira: { text: 'Yesod (Foundation) — creative energy, fertility, sexuality, emotions, dreams. Angel: Gabriel.', source: 'Kabbalah' },
  },
  Mars: {
    vala: { text: 'Tulkas (Astaldo, the Valiant) — greatest in strength and deeds of prowess. Laughs in sport and war, needs no weapon, wrestled Melkor to the ground.', source: 'Tolkien' },
    navagraha: { text: 'Mangala / Kartikeya (son of Shiva) — courage, war, energy, action, the warrior.', source: 'Vedic' },
    norseGod: { text: 'Tyr — warrior of integrity. Courage, defense of truth, not rage. He sacrificed his hand to bind Fenrir.', source: 'Norse' },
    sephira: { text: 'Geburah (Severity) — judgment, discipline, the power to purify. Angel: Samael.', source: 'Kabbalah' },
  },
  Mercury: {
    vala: { text: 'Lórien (Irmo) — Master of Visions and Dreams. Dwells in the gardens of Lórien where the weary come for rest. Gandalf dwelt long in his gardens.', source: 'Tolkien' },
    navagraha: { text: 'Budha (son of Chandra and Tara) — intellect, communication, trade, adaptability, the messenger.', source: 'Vedic' },
    norseGod: { text: 'Odin / Woden — hidden knowledge, wisdom, travel between worlds, the psychopomp. Wednesday bears his name.', source: 'Norse' },
    sephira: { text: 'Hod (Splendor) — intellectual clarity, analytical precision, the glory of the mind. Angel: Raphael.', source: 'Kabbalah' },
  },
  Jupiter: {
    vala: { text: 'Manwë (Súlimo, Elder King) — greatest in authority among the Valar, dearest to Eru. Lord of winds, dwelling on Taniquetil. Eagles are his servants.', source: 'Tolkien' },
    navagraha: { text: 'Brihaspati — guru of the Devas. Wisdom, expansion, teaching, dharma, the priest-sage.', source: 'Vedic' },
    norseGod: { text: 'Thor — champion, thunder, fertility. Benevolent cosmic protector. Thursday bears his name.', source: 'Norse' },
    sephira: { text: 'Chesed (Mercy) — love, compassion, expansion, overflowing grace. Angel: Zadkiel.', source: 'Kabbalah' },
  },
  Venus: {
    vala: { text: 'Varda (Elentári, Queen of the Stars) — she kindled the great stars before the Elves awoke, so their first sight was starlight. Most revered by the Elves.', source: 'Tolkien' },
    navagraha: { text: 'Shukra Acharya — guru of the Asuras. Beauty, pleasure, love, art, material wealth, the poet.', source: 'Vedic' },
    norseGod: { text: 'Freya — beauty, depth, sensuality. Lover, seer, weeper of golden tears. Friday bears her name.', source: 'Norse' },
    sephira: { text: 'Netzach (Victory) — majesty, endurance of feeling, artistic force, creative perseverance. Angel: Anael.', source: 'Kabbalah' },
  },
  Saturn: {
    vala: { text: 'Aulë (The Smith) — maker of the substance of Arda. Wrought the mountains and metals, taught the Noldor their craft. Created the Dwarves. Sauron was once his Maia.', source: 'Tolkien' },
    navagraha: { text: 'Shani Deva (son of Surya and Chhaya) — discipline, karma, suffering, endurance, the taskmaster.', source: 'Vedic' },
    norseGod: { text: 'Old Father — ancient progenitor, the first being of flesh. Saturday bears Saturn\'s name.', source: 'Norse' },
    sephira: { text: 'Binah (Understanding) — receptive comprehension, the cosmic divine womb. Angel: Cassiel.', source: 'Kabbalah' },
  },
};

const PLANET_DAY = {
  Sun: {
    etymology: { text: 'Sunday — Old English Sunnandæg, "day of the Sun." Latin Dies Solis. Every Indo-European culture gave this day to the solar deity.', source: 'Etymology' },
    planetaryHour: { text: 'The Sun rules the first planetary hour of Sunday. Each planet governs in Chaldean order: Sun → Venus → Mercury → Moon → Saturn → Jupiter → Mars, repeating.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Rishon — the first day. God said "Let there be light," and separated light from darkness.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Ahad — the first day of the week. A day of creation and beginning.', source: 'Islamic Tradition' },
  },
  Moon: {
    etymology: { text: 'Monday — Old English Mōnandæg, "day of the Moon." Latin Dies Lunae. French Lundi, Spanish Lunes — all from Luna.', source: 'Etymology' },
    planetaryHour: { text: 'The Moon rules the first planetary hour of Monday. Lunar influence governs tides, emotion, and the rhythm of growth and decay.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Sheni — the second day. God separated the waters above from the waters below, creating the firmament.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Ithnayn — Monday. The Prophet Muhammad was born and received his first revelation on this day. Fasting on Monday is recommended.', source: 'Islamic Tradition' },
  },
  Mars: {
    etymology: { text: 'Tuesday — Old English Tīwesdæg, from Tiw/Tyr, the Norse god of war and justice. Latin Dies Martis. French Mardi, Spanish Martes — from Mars.', source: 'Etymology' },
    planetaryHour: { text: 'Mars rules the first planetary hour of Tuesday. A day of action, conflict, and assertive energy across all astrological traditions.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Shlishi — the third day. God gathered the waters, revealed dry land, and brought forth vegetation. The only day pronounced "good" twice.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Thulatha — Tuesday. Associated in folk tradition with the creation of darkness and difficulty.', source: 'Islamic Tradition' },
  },
  Mercury: {
    etymology: { text: 'Wednesday — Old English Wōdnesdæg, "Woden\'s day," from Odin, the Norse god of wisdom and communication. Latin Dies Mercurii. French Mercredi — from Mercury.', source: 'Etymology' },
    planetaryHour: { text: 'Mercury rules the first planetary hour of Wednesday. A day for communication, trade, intellect, and travel.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Revi\'i — the fourth day. God created the Sun, Moon, and stars to govern day and night and mark the seasons.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Arbi\'a — Wednesday. The celestial lights were set in their courses on this day of creation.', source: 'Islamic Tradition' },
  },
  Jupiter: {
    etymology: { text: 'Thursday — Old English Þūnresdæg, "Thor\'s day," from the Norse thunder god. Latin Dies Iovis, "day of Jupiter." French Jeudi, Spanish Jueves — from Jove.', source: 'Etymology' },
    planetaryHour: { text: 'Jupiter rules the first planetary hour of Thursday. A day of expansion, generosity, law, and benevolent authority.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Chamishi — the fifth day. God created the creatures of the sea and the birds of the air. The first living, moving beings.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Khamis — Thursday. Deeds are presented to God on Thursdays. Fasting on Thursday is recommended alongside Monday.', source: 'Islamic Tradition' },
  },
  Venus: {
    etymology: { text: 'Friday — Old English Frīgedæg, "Freya\'s day," from the Norse goddess of love and beauty. Latin Dies Veneris. French Vendredi, Spanish Viernes — from Venus.', source: 'Etymology' },
    planetaryHour: { text: 'Venus rules the first planetary hour of Friday. A day of love, beauty, pleasure, and social harmony.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Shishi — the sixth day. God created land animals and then Adam and Eve in the divine image. Humanity enters the world.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Jumu\'ah — Friday, the day of congregation. The most sacred day in Islam, when the community gathers for Jumu\'ah prayer. Adam was created and entered Paradise on a Friday.', source: 'Islamic Tradition' },
  },
  Saturn: {
    etymology: { text: 'Saturday — the only English day name that kept its Roman root: Dies Saturni, "Saturn\'s day." Hebrew Shabbat, the day of rest, also falls here.', source: 'Etymology' },
    planetaryHour: { text: 'Saturn rules the first planetary hour of Saturday. A day of rest, limitation, reflection, and the contemplation of time.', source: 'Classical Astrology' },
    hebrewCreation: { text: 'Yom Shabbat — the seventh day. God rested. The Sabbath is not absence of work but the presence of completion. The world is declared very good.', source: 'Genesis' },
    islamicDay: { text: 'Yawm al-Sabt — Saturday, from the root meaning "to rest." Recognized as the Jewish Sabbath in the Quran. A day of cessation.', source: 'Islamic Tradition' },
  },
};

function BodyTab({ data }) {
  if (!data?.core?.body) return <p className="chrono-empty">No self data available.</p>;
  const b = data.core.body;
  const planet = data.core.planet;
  const pos = data._bodyPosition;
  const chakra = pos ? pos.chakra : PLANET_CHAKRA_DETAILS[planet];
  const glandInfo = pos ? pos.gland : PLANET_GLANDS[planet];
  const description = pos ? pos.description : (PLANET_CHAKRA_DETAILS[planet]?.description || null);
  const self = PLANET_SELF[planet];
  return (
    <div className="tab-content">
      {self && (
        <>
          {['soul', 'vehicle', 'consciousness', 'virtue', 'vice', 'imbalance', 'temperament', 'plane', 'sense'].map(key => {
            const entry = self[key];
            if (!entry) return null;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div className="body-section" key={key}>
                <h5>{label}</h5>
                <p>{entry.text}</p>
                <p className="body-meta self-source">{entry.source}</p>
              </div>
            );
          })}
        </>
      )}
      {chakra && (
        <div className="body-section">
          <h5>Chakra: {chakra.label}</h5>
          <p className="body-meta">{chakra.sanskrit} · {chakra.location} · {chakra.element}</p>
          <p className="body-meta">Theme: {chakra.theme}</p>
          {description && <p>{description}</p>}
        </div>
      )}
      {(pos ? pos.organ : b.organ) && (
        <div className="body-section">
          <h5>Organ System: {pos ? pos.organ : b.organ}</h5>
          {(pos ? pos.organDescription : b.organDescription) && <p>{pos ? pos.organDescription : b.organDescription}</p>}
        </div>
      )}
      {glandInfo && (
        <div className="body-section">
          <h5>Gland: {glandInfo.gland}</h5>
          <p>{glandInfo.hormones}</p>
        </div>
      )}
    </div>
  );
}

function HebrewTab({ data, chakraViewMode }) {
  if (!data?.hebrew) return <p className="chrono-empty">No Hebrew data available.</p>;
  const h = data.hebrew;
  const showCreation = !chakraViewMode || chakraViewMode === 'weekdays';
  return (
    <div className="tab-content">
      {showCreation && h.hebrewDay && <h4 className="hebrew-day">{h.hebrewDay}</h4>}
      {showCreation && h.creation && (
        <div className="hebrew-section">
          <h5>Day {h.creation.dayNumber} of Creation</h5>
          <p>{h.creation.description}</p>
        </div>
      )}
      {h.kabbalistic && (
        <div className="hebrew-section">
          <h5>{h.kabbalistic.sephira} — {h.kabbalistic.meaning}</h5>
          <p>{h.kabbalistic.description}</p>
        </div>
      )}
      {h.otherAssociations && (
        <div className="hebrew-section">
          <h5>Other Associations</h5>
          <p>{h.otherAssociations}</p>
        </div>
      )}
    </div>
  );
}


export default function MetalDetailPanel({ data, activeTab, onSelectTab, activeCulture, onSelectCulture, devEntries, setDevEntries, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, personaChatMessages, setPersonaChatMessages, onClosePersonaChat, getTabClass, onToggleYBR, ybrActive, chakraViewMode, activePerspective, perspectiveData, perspectiveTabs, activeTradition, perspectiveLabel, orderLabel, onSelectPerspective, populatedPerspectives, onColumnClick }) {
  const { forgeMode } = useStoryForge();
  const isVaultPerspective = activePerspective && activePerspective !== 'mythouse';
  const showCultureSelector = !isVaultPerspective && activeTab === 'deities';

  return (
    <div className="metal-detail-panel">
      <MetalContentTabs activeTab={activeTab} onSelectTab={onSelectTab} playlistUrl={playlistUrl} videoActive={videoActive} onToggleVideo={onToggleVideo} onTogglePersonaChat={onTogglePersonaChat} personaChatActive={personaChatActive} getTabClass={!isVaultPerspective ? getTabClass : undefined} onToggleYBR={onToggleYBR} ybrActive={ybrActive} perspectiveLabel={perspectiveLabel} orderLabel={orderLabel} onSelectPerspective={onSelectPerspective} activePerspective={activePerspective} populatedPerspectives={populatedPerspectives} tabs={isVaultPerspective ? perspectiveTabs : undefined} />
      {showCultureSelector && (
        <CultureSelector activeCulture={activeCulture} onSelectCulture={onSelectCulture} />
      )}
      <div className="metal-content-scroll">
        {isVaultPerspective ? (
          <PerspectiveTabContent
            columnKey={activeTab}
            perspectiveData={perspectiveData}
            activeTradition={activeTradition}
            onColumnClick={onColumnClick}
            planet={data?.core?.planet}
          />
        ) : (
          <>
            {activeTab === 'metal' && (
              <div className="tab-content">
                <div className="body-section">
                  <h5>Metal</h5>
                  <p>{data.core.metal}</p>
                </div>
                {data.core.metalDescription && (
                  <div className="body-section">
                    <p>{data.core.metalDescription}</p>
                  </div>
                )}
                {PLANET_METAL[data.core.planet] && (
                  <>
                    {['alchemicalStage', 'organ', 'element', 'gemstone', 'liberalArt', 'musicalInterval', 'platonicSolid'].map(key => {
                      const entry = PLANET_METAL[data.core.planet]?.[key];
                      if (!entry) return null;
                      const labels = { alchemicalStage: 'Alchemical Stage', organ: 'Organ', element: 'Element', gemstone: 'Gemstone', liberalArt: 'Liberal Art', musicalInterval: 'Musical Interval', platonicSolid: 'Platonic Solid' };
                      return (
                        <div className="body-section" key={key}>
                          <h5>{labels[key]}</h5>
                          <p>{entry.text}</p>
                          <p className="body-meta self-source">{entry.source}</p>
                        </div>
                      );
                    })}
                  </>
                )}
                {data.deities?.thematicEssays && Object.entries(data.deities.thematicEssays).map(([key, text]) => (
                  <div key={key} className="essay-block">
                    <h5 className="essay-title">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'planet' && (
              <div className="tab-content">
                <div className="body-section">
                  <h5>Planet</h5>
                  <p>{data.core.planet}</p>
                </div>
                {data.core.astrology && (
                  <div className="body-section">
                    <p>{data.core.astrology}</p>
                  </div>
                )}
                {PLANET_PLANET[data.core.planet] && (
                  <>
                    {['sephira', 'angel', 'navagraha', 'arabicName', 'elvishName', 'realm', 'loka', 'dante'].map(key => {
                      const entry = PLANET_PLANET[data.core.planet]?.[key];
                      if (!entry) return null;
                      const labels = { sephira: 'Sephira', angel: 'Angel', navagraha: 'Navagraha', arabicName: 'Arabic Name', elvishName: 'Elvish Name', realm: 'Norse Realm', loka: 'Vedic Loka', dante: 'Dante' };
                      return (
                        <div className="body-section" key={key}>
                          <h5>{labels[key]}</h5>
                          <p>{entry.text}</p>
                          <p className="body-meta self-source">{entry.source}</p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'deities' && <DeitiesTab data={data} activeCulture={activeCulture} />}
            {activeTab === 'sins' && <SinsTab data={data} />}
            {activeTab === 'day' && <DayTab data={data} />}
            {activeTab === 'body' && <BodyTab data={data} />}
            {activeTab === 'hebrew' && <HebrewTab data={data} chakraViewMode={chakraViewMode} />}
            {activeTab === 'tarot' && <TarotCardContent correspondenceType="planet" correspondenceValue={data.core.planet} showMinorArcana={false} />}
            {activeTab === 'development' && forgeMode && (
              <DevelopmentPanel
                stageLabel={`${data.core.planet} — ${data.core.metal}`}
                stageKey={`chronosphaera-${data.core.planet}`}
                entries={devEntries}
                setEntries={setDevEntries}
              />
            )}
          </>
        )}
      </div>
      {personaChatActive && (
        <PersonaChatPanel
          entityType="planet"
          entityName={data.core.planet}
          entityLabel={data.core.planet}
          messages={personaChatMessages || []}
          setMessages={setPersonaChatMessages}
          onClose={onClosePersonaChat}
        />
      )}
    </div>
  );
}
