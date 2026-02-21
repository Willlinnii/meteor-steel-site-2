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
  if (!data) return <p className="metals-empty">Select a planet to begin.</p>;
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
  if (!data?.deities) return <p className="metals-empty">No deity data available.</p>;
  const deityList = data.deities.deities || [];
  const aliases = DEITY_CULTURE_ALIASES[activeCulture] || [activeCulture.toLowerCase()];
  const filtered = activeCulture
    ? deityList.filter(d => d.culture && aliases.some(a => d.culture.toLowerCase().includes(a)))
    : deityList;

  return (
    <div className="tab-content">
      {filtered.length === 0 && <p className="metals-empty">No deities found for this culture.</p>}
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
  if (!a && !m && !artists && !t && !s) return <p className="metals-empty">No sin/virtue data available.</p>;

  const artistFields = [
    ['bosch', 'Hieronymus Bosch'],
    ['dali', 'Salvador Dalí'],
    ['bruegel', 'Pieter Bruegel'],
    ['cadmus', 'Paul Cadmus'],
    ['blake', 'William Blake'],
  ];

  return (
    <div className="tab-content">
      {a && (
        <>
          <h4 className="archetype-name">{a.archetype}</h4>
          {a.shadow && (
            <div className="archetype-section">
              <h5>Shadow</h5>
              <p>{a.shadow}</p>
            </div>
          )}
          {a.light && (
            <div className="archetype-section">
              <h5>Light</h5>
              <p>{a.light}</p>
            </div>
          )}
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
  if (!m && !core) return <p className="metals-empty">No day data available.</p>;

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
    description: 'This chakra concerns the fundamental experience of being safe to exist in the world. It relates to stability, home, resources, tribe, and the sense of being anchored in the body and reality. When balanced, it shows up as groundedness, presence, and a quiet sense of security; when strained, it can appear as anxiety, fear, instability, or disconnection from the body and the material world.',
  },
  Jupiter: {
    label: 'Sacral',
    sanskrit: 'Svadhisthana',
    location: 'Lower abdomen / pelvis',
    theme: 'Emotion, pleasure, sexuality, creativity',
    element: 'Water',
    description: 'This chakra reflects the realm of feeling, desire, and creative life force. It governs emotional flow, sensuality, intimacy, and the ability to enjoy life and create. When balanced, emotions move fluidly and creativity feels alive; when imbalanced, it can appear as numbness, shame, repression, emotional overwhelm, or compulsive seeking of pleasure.',
  },
  Mars: {
    label: 'Solar Plexus',
    sanskrit: 'Manipura',
    location: 'Upper abdomen',
    theme: 'Power, will, identity, confidence',
    element: 'Fire',
    description: 'This chakra represents personal agency and the capacity to act in the world. It relates to confidence, motivation, self-definition, and boundaries. In balance it supports healthy self-esteem and purposeful action; when strained, it may show up as shame, passivity, lack of direction, or the opposite extreme of control, anger, and domination.',
  },
  Venus: {
    label: 'Heart',
    sanskrit: 'Anahata',
    location: 'Center of chest',
    theme: 'Love, compassion, connection',
    element: 'Air',
    description: 'The heart chakra acts as the bridge between the lower and upper chakras, integrating survival and identity with meaning and connection. It relates to empathy, compassion, forgiveness, and relational openness. In balance it allows both giving and receiving love; in imbalance it may manifest as isolation, grief, resentment, or over-giving without boundaries.',
  },
  Mercury: {
    label: 'Throat',
    sanskrit: 'Vishuddha',
    location: 'Throat',
    theme: 'Expression, truth, communication',
    element: 'Ether / Space',
    description: 'This chakra governs authentic expression and the capacity to speak and hear truth. It includes communication, honesty, listening, and the ability to give voice to one\'s inner life. When balanced, expression feels clear and natural; when imbalanced, it can appear as fear of speaking, dishonesty, suppression, or the feeling of not being heard.',
  },
  Moon: {
    label: 'Third Eye',
    sanskrit: 'Ajna',
    location: 'Between eyebrows',
    theme: 'Insight, intuition, imagination',
    element: 'Mind / Light',
    description: 'This chakra relates to perception, inner vision, and reflective awareness. It includes intuition, imagination, clarity, and the ability to see patterns within oneself and the world. When balanced, it supports insight and self-reflection; when strained, it can appear as confusion, denial, or excessive fantasy disconnected from reality.',
  },
  Sun: {
    label: 'Crown',
    sanskrit: 'Sahasrara',
    location: 'Top of head',
    theme: 'Unity, transcendence, meaning',
    element: 'Consciousness',
    description: 'The crown chakra represents the experience of connection to the larger whole\u2014spirituality, meaning, awe, and humility before life. When balanced, it supports a sense of belonging within existence and openness to mystery; when imbalanced, it may manifest as nihilism, spiritual disconnection, or spiritual bypassing and escape from embodied life.',
  },
};

function BodyTab({ data }) {
  if (!data?.core?.body) return <p className="metals-empty">No body data available.</p>;
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
  if (!data?.hebrew) return <p className="metals-empty">No Hebrew data available.</p>;
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
  if (!essays) return <p className="metals-empty">No synthesis data available.</p>;
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

export default function MetalDetailPanel({ data, activeTab, onSelectTab, activeCulture, onSelectCulture, devEntries, setDevEntries, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, personaChatMessages, setPersonaChatMessages, onClosePersonaChat, getTabClass }) {
  const { forgeMode } = useStoryForge();
  const showCultureSelector = activeTab === 'deities';

  return (
    <div className="metal-detail-panel">
      <MetalContentTabs activeTab={activeTab} onSelectTab={onSelectTab} playlistUrl={playlistUrl} videoActive={videoActive} onToggleVideo={onToggleVideo} onTogglePersonaChat={onTogglePersonaChat} personaChatActive={personaChatActive} getTabClass={getTabClass} />
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
            stageKey={`metals-${data.core.planet}`}
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
