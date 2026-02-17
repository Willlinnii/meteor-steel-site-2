import React, { useState, useMemo } from 'react';
import OrbitalDiagram from '../../components/sevenMetals/OrbitalDiagram';
import MetalDetailPanel from '../../components/sevenMetals/MetalDetailPanel';
import CultureSelector from '../../components/sevenMetals/CultureSelector';
import './SevenMetalsPage.css';

import coreData from '../../data/sevenMetals.json';
import deitiesData from '../../data/sevenMetalsDeities.json';
import archetypesData from '../../data/sevenMetalsArchetypes.json';
import artistsData from '../../data/sevenMetalsArtists.json';
import hebrewData from '../../data/sevenMetalsHebrew.json';
import modernData from '../../data/sevenMetalsModern.json';
import sharedData from '../../data/sevenMetalsShared.json';
import storiesData from '../../data/sevenMetalsStories.json';
import theologyData from '../../data/sevenMetalsTheology.json';
import zodiacData from '../../data/sevenMetalsZodiac.json';
import cardinalsData from '../../data/sevenMetalsCardinals.json';
import planetaryCultures from '../../data/sevenMetalsPlanetaryCultures.json';
import elementsData from '../../data/sevenMetalsElements.json';
import calendarData from '../../data/mythicCalendar.json';

function findBySin(arr, sin) {
  return arr.find(item => item.sin === sin) || null;
}

function findByMetal(arr, metal) {
  return arr.find(item => item.metal === metal) || null;
}

/* Map culture selector labels to JSON keys */
const CULTURE_KEY_MAP = {
  Roman: 'roman',
  Greek: 'greek',
  Norse: 'norse',
  Babylonian: 'babylonian',
  Vedic: 'vedic',
  Islamic: 'islamic',
  Medieval: 'medieval',
};

function CultureBlock({ cultureData }) {
  if (!cultureData) return <p className="metals-empty">No data for this tradition.</p>;
  return (
    <div className="culture-block">
      <h4>{cultureData.name}</h4>
      {cultureData.myth && <p className="culture-myth"><em>{cultureData.myth}</em></p>}
      {cultureData.description && <p>{cultureData.description}</p>}
      {cultureData.symbols && (
        <p className="culture-symbols"><strong>Symbols:</strong> {cultureData.symbols}</p>
      )}
    </div>
  );
}

function ZodiacContent({ sign, activeCulture }) {
  const z = zodiacData.find(d => d.sign === sign);
  if (!z) return <p className="metals-empty">No data for {sign}.</p>;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = z.cultures?.[cultureKey];
  const elementEntry = elementsData[z.element];
  const elementCulture = elementEntry?.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <h4>{z.symbol} {z.archetype}</h4>
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">{z.element}</span></div>
        <div className="overview-item"><span className="ov-label">Modality</span><span className="ov-value">{z.modality}</span></div>
        <div className="overview-item"><span className="ov-label">Ruler</span><span className="ov-value">{z.rulingPlanet}</span></div>
        <div className="overview-item"><span className="ov-label">House</span><span className="ov-value">{z.house}</span></div>
        <div className="overview-item"><span className="ov-label">Dates</span><span className="ov-value">{z.dates}</span></div>
      </div>
      <div className="modern-section">
        <h5>{z.stageOfExperience}</h5>
        <p>{z.description}</p>
      </div>
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
      {elementCulture && (
        <div className="modern-section">
          <h5>{z.element} — {activeCulture} Tradition</h5>
          <CultureBlock cultureData={elementCulture} />
        </div>
      )}
    </div>
  );
}

function CardinalContent({ cardinalId, activeCulture }) {
  const c = cardinalsData[cardinalId];
  if (!c) return <p className="metals-empty">No data for this cardinal point.</p>;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = c.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Date</span><span className="ov-value">{c.date}</span></div>
        <div className="overview-item"><span className="ov-label">Season</span><span className="ov-value">{c.season}</span></div>
        <div className="overview-item"><span className="ov-label">Direction</span><span className="ov-value">{c.direction}</span></div>
        <div className="overview-item"><span className="ov-label">Zodiac Cusp</span><span className="ov-value">{c.zodiacCusp}</span></div>
      </div>
      {c.description && (
        <div className="modern-section">
          <h5>Description</h5>
          <p>{c.description}</p>
        </div>
      )}
      {c.mythology && (
        <div className="modern-section">
          <h5>Mythology</h5>
          <p>{c.mythology}</p>
        </div>
      )}
      {c.themes && (
        <div className="modern-section">
          <h5>Themes</h5>
          <p>{c.themes}</p>
        </div>
      )}
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
      {!c.description && !c.mythology && !c.themes && !cultureEntry && (
        <p className="metals-empty">{c.label} content coming soon.</p>
      )}
    </div>
  );
}

function MonthContent({ month, activeTab, onSelectTab }) {
  const m = calendarData.find(d => d.month === month);
  if (!m) return <p className="metals-empty">No data for {month}.</p>;

  // Build tab list: stone, flower, then each holiday
  const tabs = [];
  if (m.stone) tabs.push({ id: 'stone', label: 'Stone' });
  if (m.flower) tabs.push({ id: 'flower', label: 'Flower' });
  if (m.holidays) {
    m.holidays.forEach((h, i) => {
      tabs.push({ id: `holiday-${i}`, label: h.name });
    });
  }

  // Resolve active tab content
  let content = null;
  if (activeTab === 'stone' && m.stone) {
    content = (
      <div className="modern-section">
        <h5>Stone of the Month — {m.stone.name}</h5>
        <p>{m.stone.description}</p>
      </div>
    );
  } else if (activeTab === 'flower' && m.flower) {
    content = (
      <div className="modern-section">
        <h5>Flower of the Month — {m.flower.name}</h5>
        <p>{m.flower.description}</p>
      </div>
    );
  } else if (activeTab?.startsWith('holiday-') && m.holidays) {
    const idx = parseInt(activeTab.split('-')[1], 10);
    const h = m.holidays[idx];
    if (h) {
      content = (
        <div className="modern-section">
          <h5>{h.name}</h5>
          <p>{h.description}</p>
        </div>
      );
    }
  }

  // If active tab doesn't exist for this month, show first tab
  if (!content && tabs.length > 0 && activeTab !== tabs[0].id) {
    onSelectTab(tabs[0].id);
  }

  return (
    <div className="tab-content">
      {m.mood && <p className="month-mood">{m.mood}</p>}
      <div className="metal-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onSelectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {content}
    </div>
  );
}

function PlanetCultureContent({ planet, activeCulture }) {
  const planetData = planetaryCultures[planet];
  if (!planetData) return null;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = planetData[cultureKey];
  if (!cultureEntry) return null;
  return (
    <div className="modern-section planet-culture-section">
      <h5>{activeCulture} Tradition — {planet}</h5>
      <CultureBlock cultureData={cultureEntry} />
    </div>
  );
}

function EarthContent({ activeCulture }) {
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const earthElement = elementsData['Earth'];
  const earthCulture = earthElement?.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Role</span><span className="ov-value">Geocentric Center</span></div>
        <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">Earth</span></div>
        <div className="overview-item"><span className="ov-label">Signs</span><span className="ov-value">Taurus · Virgo · Capricorn</span></div>
        <div className="overview-item"><span className="ov-label">Qualities</span><span className="ov-value">{earthElement?.qualities || 'Stability, material form, patience, endurance'}</span></div>
      </div>
      <div className="modern-section">
        <h5>The Still Point</h5>
        <p>In the classical geocentric model, Earth stands at the center of the celestial spheres — not as a planet among planets, but as the fixed ground upon which all cosmic motion is measured. The seven metals orbit around it, each tracing a sphere of influence. Earth is the stage, the body, the material vessel through which all heavenly forces are received and expressed.</p>
      </div>
      {earthCulture && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={earthCulture} />
        </div>
      )}
    </div>
  );
}

export default function SevenMetalsPage() {
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCulture, setActiveCulture] = useState('Greek');
  const [selectedSign, setSelectedSign] = useState(null);
  const [selectedCardinal, setSelectedCardinal] = useState(null);
  const [selectedEarth, setSelectedEarth] = useState(false);
  const [devEntries, setDevEntries] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeMonthTab, setActiveMonthTab] = useState('stone');

  const mergedData = useMemo(() => {
    const map = {};
    coreData.forEach(item => {
      map[item.planet] = {
        core: item,
        deities: findByMetal(deitiesData, item.metal),
        archetype: findBySin(archetypesData, item.sin),
        artists: findBySin(artistsData, item.sin),
        hebrew: findByMetal(hebrewData, item.metal),
        modern: findBySin(modernData, item.sin),
        shared: sharedData,
        stories: findBySin(storiesData, item.sin),
        theology: findBySin(theologyData, item.sin),
      };
    });
    return map;
  }, []);

  const currentData = mergedData[selectedPlanet] || null;

  return (
    <div className="seven-metals-page">
      <div className="metals-diagram-center">
        <OrbitalDiagram
          selectedPlanet={selectedPlanet}
          onSelectPlanet={(p) => { setSelectedPlanet(p); setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(false); setSelectedMonth(null); }}
          selectedSign={selectedSign}
          onSelectSign={(sign) => { setSelectedSign(sign); setSelectedCardinal(null); setSelectedEarth(false); setSelectedMonth(null); }}
          selectedCardinal={selectedCardinal}
          onSelectCardinal={(c) => { setSelectedCardinal(c); setSelectedSign(null); setSelectedEarth(false); setSelectedMonth(null); }}
          selectedEarth={selectedEarth}
          onSelectEarth={(e) => { setSelectedEarth(e); setSelectedSign(null); setSelectedCardinal(null); setSelectedMonth(null); }}
          showCalendar={showCalendar}
          onToggleCalendar={() => setShowCalendar(!showCalendar)}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => { setSelectedMonth(m); setActiveMonthTab('stone'); if (m) { setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(false); } }}
        />
      </div>

      {selectedMonth ? (
        <>
          <h2 className="metals-heading">
            {selectedMonth}
            <span className="metals-sub">Mythic Calendar</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <MonthContent month={selectedMonth} activeTab={activeMonthTab} onSelectTab={setActiveMonthTab} />
              </div>
            </div>
          </div>
        </>
      ) : selectedEarth ? (
        <>
          <h2 className="metals-heading">
            Earth
            <span className="metals-sub">The Still Point · Geocentric Center</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                <EarthContent activeCulture={activeCulture} />
              </div>
            </div>
          </div>
        </>
      ) : selectedCardinal ? (
        <>
          <h2 className="metals-heading">
            {cardinalsData[selectedCardinal]?.label || selectedCardinal}
            <span className="metals-sub">Cardinal Point</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                <CardinalContent cardinalId={selectedCardinal} activeCulture={activeCulture} />
              </div>
            </div>
          </div>
        </>
      ) : selectedSign ? (
        <>
          <h2 className="metals-heading">
            {selectedSign}
            <span className="metals-sub">{zodiacData.find(z => z.sign === selectedSign)?.archetype || 'Zodiac'}</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                <ZodiacContent sign={selectedSign} activeCulture={activeCulture} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {currentData && (
            <h2 className="metals-heading">
              {currentData.core.planet} — {currentData.core.metal}
              <span className="metals-sub">{currentData.core.day} · {currentData.core.sin} / {currentData.core.virtue}</span>
            </h2>
          )}
          <div className="container">
            <div id="content-container">
              {currentData ? (
                <>
                  <MetalDetailPanel
                    data={currentData}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    activeCulture={activeCulture}
                    onSelectCulture={setActiveCulture}
                    devEntries={devEntries}
                    setDevEntries={setDevEntries}
                  />
                  {activeTab === 'overview' && (
                    <div className="planet-culture-wrapper">
                      <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                      <PlanetCultureContent planet={currentData.core.planet} activeCulture={activeCulture} />
                    </div>
                  )}
                </>
              ) : (
                <p className="metals-empty">Select a planet to explore its metal.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
