import React from 'react';
import MetalContentTabs from './MetalContentTabs';
import CultureSelector from './CultureSelector';
import DeityCard from './DeityCard';
import TextBlock from './TextBlock';
import DevelopmentPanel from '../DevelopmentPanel';
import TarotCardContent from './TarotCardContent';
import PersonaChatPanel from '../PersonaChatPanel';

function OverviewTab({ data }) {
  if (!data) return <p className="metals-empty">Select a planet to begin.</p>;
  const m = data.core;
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

function BodyTab({ data }) {
  if (!data?.core?.body) return <p className="metals-empty">No body data available.</p>;
  const b = data.core.body;
  return (
    <div className="tab-content">
      {b.chakra && (
        <div className="body-section">
          <h5>{b.chakra}</h5>
          {b.chakraDescription && <p>{b.chakraDescription}</p>}
        </div>
      )}
      {b.organ && (
        <div className="body-section">
          <h5>{b.organ}</h5>
          {b.organDescription && <p>{b.organDescription}</p>}
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

export default function MetalDetailPanel({ data, activeTab, onSelectTab, activeCulture, onSelectCulture, devEntries, setDevEntries, playlistUrl, videoActive, onToggleVideo, onTogglePersonaChat, personaChatActive, personaChatMessages, setPersonaChatMessages, onClosePersonaChat }) {
  const showCultureSelector = activeTab === 'deities';

  return (
    <div className="metal-detail-panel">
      <MetalContentTabs activeTab={activeTab} onSelectTab={onSelectTab} playlistUrl={playlistUrl} videoActive={videoActive} onToggleVideo={onToggleVideo} onTogglePersonaChat={onTogglePersonaChat} personaChatActive={personaChatActive} />
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
        {activeTab === 'development' && (
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
