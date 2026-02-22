import React from 'react';
import MetalContentTabs from './MetalContentTabs';
import CultureSelector from './CultureSelector';
import DeityCard from './DeityCard';
import TextBlock from './TextBlock';
import DevelopmentPanel from '../DevelopmentPanel';
import TarotCardContent from './TarotCardContent';
import PersonaChatPanel from '../PersonaChatPanel';
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
      {m.metalDescription && <p className="metal-desc">{m.metalDescription}</p>}
      {m.combinedFigure && (
        <blockquote className="combined-figure">
          <TextBlock text={m.combinedFigure} />
        </blockquote>
      )}
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Planet</span><span className="ov-value">{m.planet}</span></div>
        <div className="overview-item"><span className="ov-label">Metal</span><span className="ov-value">{m.metal}</span></div>
        <div className="overview-item"><span className="ov-label">Day</span><span className="ov-value">{m.day}</span></div>
        <div className="overview-item"><span className="ov-label">Sin</span><span className="ov-value">{m.sin}</span></div>
        <div className="overview-item"><span className="ov-label">Virtue</span><span className="ov-value">{m.virtue}</span></div>
        {gem && <div className="overview-item"><span className="ov-label">Stone</span><span className="ov-value">{gem}</span></div>}
      </div>
      {m.astrology && <p className="astrology-note">{m.astrology}</p>}
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
  if (!data?.deities) return <p className="chrono-empty">No deity data available.</p>;
  const deityList = data.deities.deities || [];
  const aliases = DEITY_CULTURE_ALIASES[activeCulture] || [activeCulture.toLowerCase()];
  const filtered = activeCulture
    ? deityList.filter(d => d.culture && aliases.some(a => d.culture.toLowerCase().includes(a)))
    : deityList;

  return (
    <div className="tab-content">
      {filtered.length === 0 && <p className="chrono-empty">No deities found for this culture.</p>}
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
  const chakra = PLANET_CHAKRA_DETAILS[data?.core?.planet];
  if (!a && !m && !artists && !t && !s) return <p className="chrono-empty">No sin/virtue data available.</p>;

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
      {chakra && (
        <div className="archetype-section sin-chakra-context">
          <h5>{chakra.label} Chakra ({chakra.sanskrit})</h5>
          <p>{chakra.description}</p>
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
  if (!m && !core) return <p className="chrono-empty">No day data available.</p>;

  return (
    <div className="tab-content">
      {core && (
        <div className="modern-section">
          <h4>{core.day} — {core.planet}</h4>
        </div>
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

function BodyTab({ data }) {
  if (!data?.core?.body) return <p className="chrono-empty">No body data available.</p>;
  const b = data.core.body;
  const planet = data.core.planet;
  const chakra = PLANET_CHAKRA_DETAILS[planet];
  const glandInfo = PLANET_GLANDS[planet];
  return (
    <div className="tab-content">
      {chakra && (
        <div className="body-section">
          <h5>Chakra: {chakra.label}</h5>
          <p className="body-meta">{chakra.sanskrit} · {chakra.location} · {chakra.element}</p>
          <p className="body-meta">Theme: {chakra.theme}</p>
          <p>{chakra.description}</p>
        </div>
      )}
      {b.organ && (
        <div className="body-section">
          <h5>Organ System: {b.organ}</h5>
          {b.organDescription && <p>{b.organDescription}</p>}
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

function HebrewTab({ data }) {
  if (!data?.hebrew) return <p className="chrono-empty">No Hebrew data available.</p>;
  const h = data.hebrew;
  return (
    <div className="tab-content">
      {h.hebrewDay && <h4 className="hebrew-day">{h.hebrewDay}</h4>}
      {h.creation && (
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

function SynthesisTab({ data }) {
  const essays = data?.deities?.thematicEssays;
  if (!essays) return <p className="chrono-empty">No synthesis data available.</p>;
  return (
    <div className="tab-content">
      {Object.entries(essays).map(([key, text]) => (
        <div key={key} className="essay-block">
          <h5 className="essay-title">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

export default function MetalDetailPanel({ data, activeTab, onSelectTab, activeCulture, onSelectCulture, devEntries, setDevEntries, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, personaChatMessages, setPersonaChatMessages, onClosePersonaChat, getTabClass, onToggleYBR, ybrActive }) {
  const { forgeMode } = useStoryForge();
  const showCultureSelector = activeTab === 'deities';

  return (
    <div className="metal-detail-panel">
      <MetalContentTabs activeTab={activeTab} onSelectTab={onSelectTab} playlistUrl={playlistUrl} videoActive={videoActive} onToggleVideo={onToggleVideo} onTogglePersonaChat={onTogglePersonaChat} personaChatActive={personaChatActive} getTabClass={getTabClass} onToggleYBR={onToggleYBR} ybrActive={ybrActive} />
      {showCultureSelector && (
        <CultureSelector activeCulture={activeCulture} onSelectCulture={onSelectCulture} />
      )}
      <div className="metal-content-scroll">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'deities' && <DeitiesTab data={data} activeCulture={activeCulture} />}
        {activeTab === 'sins' && <SinsTab data={data} />}
        {activeTab === 'day' && <DayTab data={data} />}
        {activeTab === 'body' && <BodyTab data={data} />}
        {activeTab === 'hebrew' && <HebrewTab data={data} />}
        {activeTab === 'tarot' && <TarotCardContent correspondenceType="planet" correspondenceValue={data.core.planet} showMinorArcana={false} />}
        {activeTab === 'synthesis' && <SynthesisTab data={data} />}
        {activeTab === 'development' && forgeMode && (
          <DevelopmentPanel
            stageLabel={`${data.core.planet} — ${data.core.metal}`}
            stageKey={`chronosphaera-${data.core.planet}`}
            entries={devEntries}
            setEntries={setDevEntries}
          />
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
