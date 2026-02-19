import React, { useState, useMemo, useEffect } from 'react';
import OrbitalDiagram from '../../components/sevenMetals/OrbitalDiagram';
import MetalDetailPanel from '../../components/sevenMetals/MetalDetailPanel';
import CultureSelector from '../../components/sevenMetals/CultureSelector';
import './SevenMetalsPage.css';
import { useLocation, useNavigate } from 'react-router-dom';

import TarotCardContent from '../../components/sevenMetals/TarotCardContent';
import PersonaChatPanel from '../../components/PersonaChatPanel';
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
import wheelData from '../../data/medicineWheels.json';
import wheelContent from '../../data/medicineWheelContent.json';
import dayNightData from '../../data/dayNight.json';
import useYellowBrickRoad from '../../components/sevenMetals/useYellowBrickRoad';
import YellowBrickRoadPanel from '../../components/sevenMetals/YellowBrickRoadPanel';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const WEEKDAYS = [
  { label: 'Sun', day: 'Sunday', planet: 'Sun' },
  { label: 'Mon', day: 'Monday', planet: 'Moon' },
  { label: 'Tue', day: 'Tuesday', planet: 'Mars' },
  { label: 'Wed', day: 'Wednesday', planet: 'Mercury' },
  { label: 'Thu', day: 'Thursday', planet: 'Jupiter' },
  { label: 'Fri', day: 'Friday', planet: 'Venus' },
  { label: 'Sat', day: 'Saturday', planet: 'Saturn' },
];

const PLANET_PLAYLISTS = {
  Moon: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtq-GwZQZtrFaqTbvs6QPiBR',
  Mercury: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtqvqEVpF80i8C3BarI-r4v8',
  Venus: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtqPR9w4JeJ165w-kBZuJVRL',
  Sun: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpLL5eRKVfNOR2yZMGOZXX0',
  Mars: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtoX7Hl2YYUkaobk5xhBifss',
  Jupiter: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpPirpHQffXpnyD_Qr7CY98',
  Saturn: 'https://www.youtube.com/playlist?list=PLX31T_KS3jto0mKzJrNvM_8jQvbgMc3Ys',
};

const ZODIAC_PLAYLISTS = {
  Taurus: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtozOJ8XgvRnJHbXiqG-oDG4',
  Gemini: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtoOo40tz0rtHH8wqz-OevmS',
  Cancer: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtrevNnKq-qFfC2rAMTrmqmC',
  Leo: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtroHmH9HNF-xp_Gz5ruBXe6',
  Virgo: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtptlYXUvXfd4t_xUqx3KpwO',
  Libra: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpCLdwfCy-W7IJB1djh_Gai',
  Scorpio: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpmhF3fbc5Rnt6kRO-75zQS',
  Sagittarius: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtqw8XIsqacvmgt4-6bVFMXF',
  Capricorn: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtqc0pTP_OgydWtdT_EntIo8',
  Aquarius: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpqswOrq5U08V7qhPeVoMKu',
};

const CARDINAL_PLAYLISTS = {
  'summer-solstice': 'https://www.youtube.com/playlist?list=PLX31T_KS3jtrt6bHMWVETza07R8lJL2of',
  'autumnal-equinox': 'https://www.youtube.com/playlist?list=PLX31T_KS3jtqQZM-wycPZdEoc2BD2Q2iu',
};

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
  Tarot: 'tarot',
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

  if (activeCulture === 'Tarot') {
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
        <TarotCardContent correspondenceType="zodiac" correspondenceValue={sign} element={z.element} showMinorArcana />
      </div>
    );
  }

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

  if (activeCulture === 'Tarot') {
    return (
      <div className="tab-content">
        <div className="overview-grid">
          <div className="overview-item"><span className="ov-label">Date</span><span className="ov-value">{c.date}</span></div>
          <div className="overview-item"><span className="ov-label">Season</span><span className="ov-value">{c.season}</span></div>
          <div className="overview-item"><span className="ov-label">Direction</span><span className="ov-value">{c.direction}</span></div>
          <div className="overview-item"><span className="ov-label">Zodiac Cusp</span><span className="ov-value">{c.zodiacCusp}</span></div>
        </div>
        <TarotCardContent correspondenceType="cardinal" correspondenceValue={cardinalId} showMinorArcana />
      </div>
    );
  }

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

function DayNightContent({ side, activeCulture }) {
  const data = dayNightData[side];
  if (!data) return <p className="metals-empty">No data for {side}.</p>;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = data.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">{data.element}</span></div>
        <div className="overview-item"><span className="ov-label">Polarity</span><span className="ov-value">{data.polarity}</span></div>
        <div className="overview-item"><span className="ov-label">Qualities</span><span className="ov-value">{data.qualities}</span></div>
      </div>
      <div className="modern-section">
        <h5>{data.subtitle}</h5>
        <p>{data.description}</p>
      </div>
      <div className="modern-section">
        <h5>Cosmology</h5>
        <p>{data.cosmology}</p>
      </div>
      <div className="modern-section">
        <h5>Themes</h5>
        <p>{data.themes}</p>
      </div>
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
    </div>
  );
}

const MW_NUM_TO_DIR = { 1: 'E', 2: 'W', 3: 'S', 4: 'N', 5: 'C5', 6: 'SE', 7: 'SW', 8: 'NW', 9: 'NE', 10: 'C10' };
const MW_DIR_NAMES = { N: 'North', E: 'East', S: 'South', W: 'West', NE: 'Northeast', SE: 'Southeast', SW: 'Southwest', NW: 'Northwest', C5: 'Center', C10: 'Center' };
const WHEEL_SHORT_NAMES = { humanSelf: 'Self', perspective: 'Perspective', elements: 'Elements', sacredElements: 'Four Elements', earthCount: 'Earth Count', bodySpheres: 'Body', mathematics: 'Mathematics' };

function WheelAlignmentContent({ targetDir, activeWheelTab, onSelectWheelTab }) {
  const alignments = [];
  wheelData.wheels.forEach(wheel => {
    const pos = wheel.positions.find(p => p.dir === targetDir);
    if (pos) {
      alignments.push({ wheel, pos, content: wheelContent[`${wheel.id}:${pos.dir}`] });
    }
  });
  if (targetDir === 'C5') {
    wheelData.wheels.forEach(wheel => {
      if (!wheel.positions.find(p => p.dir === 'C5') && wheelContent[`${wheel.id}:center`]) {
        alignments.push({
          wheel,
          pos: { dir: 'center', label: (wheel.center || 'Center').replace(/\n/g, ' · ') },
          content: wheelContent[`${wheel.id}:center`]
        });
      }
    });
  }
  if (alignments.length === 0) return <p className="metals-empty">No alignments found.</p>;
  const currentTabId = activeWheelTab && alignments.find(a => a.wheel.id === activeWheelTab) ? activeWheelTab : alignments[0].wheel.id;
  const current = alignments.find(a => a.wheel.id === currentTabId);
  return (
    <div className="tab-content">
      <div className="metal-tabs">
        {alignments.map(a => (
          <button key={a.wheel.id} className={`metal-tab${currentTabId === a.wheel.id ? ' active' : ''}`} onClick={() => onSelectWheelTab(a.wheel.id)}>
            {WHEEL_SHORT_NAMES[a.wheel.id] || a.wheel.id}
          </button>
        ))}
      </div>
      {current && (
        <>
          <h5>{current.pos.shortLabel || current.pos.label}{current.pos.sublabel ? ` — ${current.pos.sublabel}` : ''}</h5>
          {current.content ? (
            <div className="modern-section">
              <p><em>{current.content.summary}</em></p>
              <p>{current.content.teaching}</p>
              {current.content.pages && (
                <p className="attr-list">Lightningbolt pp. {current.content.pages.join(', ')}</p>
              )}
            </div>
          ) : (
            <p className="metals-empty">Content coming soon.</p>
          )}
        </>
      )}
    </div>
  );
}

export default function SevenMetalsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCulture, setActiveCulture] = useState('Greek');
  const [selectedSign, setSelectedSign] = useState(null);
  const [selectedCardinal, setSelectedCardinal] = useState(null);
  const [selectedEarth, setSelectedEarth] = useState(() => location.pathname.endsWith('/calendar') ? null : 'day');
  const [devEntries, setDevEntries] = useState({});
  const [showCalendar, setShowCalendar] = useState(() => location.pathname.endsWith('/calendar'));
  const [selectedMonth, setSelectedMonth] = useState(() => location.pathname.endsWith('/calendar') ? MONTHS[new Date().getMonth()] : null);
  const [activeMonthTab, setActiveMonthTab] = useState('stone');
  const [showMedicineWheel, setShowMedicineWheel] = useState(() => location.pathname.endsWith('/medicine-wheel'));
  const [selectedWheelItem, setSelectedWheelItem] = useState(null);
  const [activeWheelTab, setActiveWheelTab] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [chakraViewMode, setChakraViewMode] = useState(null);
  const [personaChatOpen, setPersonaChatOpen] = useState(null);
  const [personaChatHistory, setPersonaChatHistory] = useState({});
  const ybr = useYellowBrickRoad();

  const [ybrAutoStart, setYbrAutoStart] = useState(false);

  // Sync view state with URL on back/forward navigation
  useEffect(() => {
    const path = location.pathname;
    setShowMedicineWheel(path.endsWith('/medicine-wheel'));
    const cal = path.endsWith('/calendar');
    setShowCalendar(cal);
    if (cal && !selectedMonth) {
      setSelectedMonth(MONTHS[new Date().getMonth()]);
      setActiveMonthTab('stone');
    }
    if (path.endsWith('/yellow-brick-road') && !ybr.active) {
      setYbrAutoStart(true);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYBRToggle = () => {
    if (ybr.active) {
      ybr.exitGame();
      navigate('/metals');
    } else {
      ybr.startGame();
      navigate('/metals/yellow-brick-road');
    }
  };

  const tooltipData = useMemo(() => {
    const planets = {};
    coreData.forEach(item => {
      planets[item.planet] = {
        metal: item.metal,
        day: item.day,
        chakra: item.body?.chakra,
        sin: item.sin,
        virtue: item.virtue,
        astrology: item.astrology,
      };
    });
    const zodiac = {};
    zodiacData.forEach(z => {
      zodiac[z.sign] = {
        symbol: z.symbol,
        archetype: z.archetype,
        element: z.element,
        modality: z.modality,
        ruler: z.rulingPlanet,
        dates: z.dates,
      };
    });
    const cardinals = {};
    Object.entries(cardinalsData).forEach(([id, c]) => {
      cardinals[id] = {
        label: c.label,
        date: c.date,
        season: c.season,
        direction: c.direction,
        zodiacCusp: c.zodiacCusp,
      };
    });
    const months = {};
    calendarData.forEach(m => {
      months[m.month] = {
        stone: m.stone?.name,
        flower: m.flower?.name,
        mood: m.mood ? (m.mood.length > 100 ? m.mood.slice(0, 100) + '\u2026' : m.mood) : null,
      };
    });
    const dayNight = {};
    Object.entries(dayNightData).forEach(([side, d]) => {
      dayNight[side] = {
        label: d.label,
        element: d.element,
        polarity: d.polarity,
        qualities: d.qualities,
      };
    });
    return { planets, zodiac, cardinals, months, dayNight };
  }, []);

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

  function togglePersonaChat(type, name) {
    const key = `${type}:${name}`;
    if (personaChatOpen === key) {
      setPersonaChatOpen(null);
    } else {
      setPersonaChatOpen(key);
      if (!personaChatHistory[key]) {
        setPersonaChatHistory(prev => ({ ...prev, [key]: [] }));
      }
    }
  }

  function setCurrentPersonaMessages(msgs) {
    if (!personaChatOpen) return;
    setPersonaChatHistory(prev => ({ ...prev, [personaChatOpen]: msgs }));
  }

  let wheelAlignmentData = null;
  if (selectedWheelItem?.startsWith('num:') || selectedWheelItem?.startsWith('dir:')) {
    const isNum = selectedWheelItem.startsWith('num:');
    const value = selectedWheelItem.split(':')[1];
    const targetDir = isNum ? MW_NUM_TO_DIR[parseInt(value)] : value;
    const dirName = MW_DIR_NAMES[targetDir] || targetDir;
    wheelAlignmentData = { targetDir, heading: isNum ? value : value, sub: `${dirName} · Alignments Across All Wheels` };
  }

  let wheelContentData = null;
  if (selectedWheelItem && !wheelAlignmentData) {
    const [wId, wDir] = selectedWheelItem.split(':');
    const wheel = wheelData.wheels.find(w => w.id === wId);
    const pos = wheel?.positions.find(p => p.dir === wDir);
    const content = wheelContent[selectedWheelItem] || null;
    if (wheel && pos) wheelContentData = { wheel, pos, content };
  }

  return (
    <div className="seven-metals-page">
      <div className="metals-diagram-center">
        <OrbitalDiagram
          tooltipData={tooltipData}
          selectedPlanet={selectedPlanet}
          hoveredPlanet={hoveredPlanet}
          onSelectPlanet={(p) => { setSelectedPlanet(p); setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(null); setSelectedMonth(null); setVideoUrl(null); setPersonaChatOpen(null); if (chakraViewMode) setActiveTab('body'); }}
          selectedSign={selectedSign}
          onSelectSign={(sign) => { setSelectedSign(sign); setSelectedCardinal(null); setSelectedEarth(null); setSelectedMonth(null); setVideoUrl(null); setPersonaChatOpen(null); }}
          selectedCardinal={selectedCardinal}
          onSelectCardinal={(c) => { setSelectedCardinal(c); setSelectedSign(null); setSelectedEarth(null); setSelectedMonth(null); setVideoUrl(null); setPersonaChatOpen(null); }}
          selectedEarth={selectedEarth}
          onSelectEarth={(e) => { setSelectedEarth(e); setSelectedSign(null); setSelectedCardinal(null); setSelectedMonth(null); setVideoUrl(null); setPersonaChatOpen(null); }}
          showCalendar={showCalendar}
          onToggleCalendar={() => {
            const next = !showCalendar;
            setShowCalendar(next);
            if (next) {
              setSelectedMonth(MONTHS[new Date().getMonth()]);
              setActiveMonthTab('stone');
              setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(null);
            } else {
              setSelectedMonth(null);
            }
            navigate(next ? '/metals/calendar' : '/metals');
          }}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => { setSelectedMonth(m); setActiveMonthTab('stone'); if (m) { setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(null); } }}
          showMedicineWheel={showMedicineWheel}
          onToggleMedicineWheel={() => {
            const next = !showMedicineWheel;
            setShowMedicineWheel(next);
            setSelectedWheelItem(null);
            if (next) { setChakraViewMode(null); setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(null); setSelectedMonth(null); setShowCalendar(false); navigate('/metals/medicine-wheel'); }
            else { setSelectedPlanet('Sun'); navigate('/metals'); }
          }}
          selectedWheelItem={selectedWheelItem}
          onSelectWheelItem={(item) => { setSelectedWheelItem(item); setActiveWheelTab(null); if (item) { setSelectedSign(null); setSelectedCardinal(null); setSelectedEarth(null); setSelectedMonth(null); } }}
          chakraViewMode={chakraViewMode}
          onToggleChakraView={() => {
            setChakraViewMode(prev => {
              if (!prev) return 'chaldean';
              if (prev === 'chaldean') return 'heliocentric';
              if (prev === 'heliocentric') return 'weekdays';
              return null;
            });
            if (showMedicineWheel) { setShowMedicineWheel(false); setSelectedWheelItem(null); navigate('/metals'); }
          }}
          videoUrl={videoUrl}
          onCloseVideo={() => setVideoUrl(null)}
          ybrActive={ybr.active}
          ybrCurrentStopIndex={ybr.currentStopIndex}
          ybrStopProgress={ybr.stopProgress}
          ybrJourneySequence={ybr.journeySequence}
          onToggleYBR={handleYBRToggle}
          ybrAutoStart={ybrAutoStart}
        />
      </div>

      {ybr.active ? (
        <YellowBrickRoadPanel
          currentStopIndex={ybr.currentStopIndex}
          stopProgress={ybr.stopProgress}
          journeyComplete={ybr.journeyComplete}
          journeySequence={ybr.journeySequence}
          completedStops={ybr.completedStops}
          totalStops={ybr.totalStops}
          onAdvanceFromEarth={ybr.advanceFromEarth}
          onRecordResult={ybr.recordChallengeResult}
          onAdvanceToNext={ybr.advanceToNextStop}
          onExit={() => { ybr.exitGame(); navigate('/metals'); }}
          isStopComplete={ybr.isStopComplete}
        />
      ) : showMedicineWheel ? (
        wheelAlignmentData ? (
          <>
            <h2 className="metals-heading">
              {wheelAlignmentData.heading}
              <span className="metals-sub">{wheelAlignmentData.sub}</span>
            </h2>
            <div className="container">
              <div id="content-container">
                <div className="metal-detail-panel">
                  <WheelAlignmentContent targetDir={wheelAlignmentData.targetDir} activeWheelTab={activeWheelTab} onSelectWheelTab={setActiveWheelTab} />
                </div>
              </div>
            </div>
          </>
        ) : wheelContentData ? (
          <>
            <h2 className="metals-heading">
              {wheelContentData.pos.label}
              <span className="metals-sub">{wheelContentData.wheel.title}</span>
            </h2>
            <div className="container">
              <div id="content-container">
                <div className="metal-detail-panel">
                  <div className="tab-content">
                    {wheelContentData.pos.sublabel && <h5>{wheelContentData.pos.sublabel}</h5>}
                    {wheelContentData.pos.num != null && (
                      <p className="attr-list">Position {wheelContentData.pos.num} · {wheelContentData.pos.dir}</p>
                    )}
                    {wheelContentData.content ? (
                      <div className="modern-section">
                        <p><em>{wheelContentData.content.summary}</em></p>
                        <p>{wheelContentData.content.teaching}</p>
                        {wheelContentData.content.pages && (
                          <p className="attr-list">Lightningbolt pp. {wheelContentData.content.pages.join(', ')}</p>
                        )}
                      </div>
                    ) : (
                      <p className="metals-empty">Content coming soon.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : selectedWheelItem === 'meta:author' ? (
          <>
            <h2 className="metals-heading">
              Hyemeyohsts Storm
              <span className="metals-sub">Seven Arrows (1972) · Lightningbolt (1994)</span>
            </h2>
            <div className="container">
              <div id="content-container">
                <div className="metal-detail-panel">
                  <div className="tab-content">
                    {wheelContent['meta:author'] && (
                      <div className="modern-section">
                        <p><em>{wheelContent['meta:author'].summary}</em></p>
                        {wheelContent['meta:author'].teaching.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                        <p className="attr-list">Lightningbolt, Introduction and pp. {wheelContent['meta:author'].pages.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="metals-heading">
              The Medicine Wheel
              <span className="metals-sub">Teachings of the Zero Chiefs</span>
            </h2>
            <div className="container">
              <div id="content-container">
                <div className="metal-detail-panel">
                  <div className="tab-content">
                    {wheelContent['meta:overview'] ? (
                      <div className="modern-section">
                        <p><em>{wheelContent['meta:overview'].summary}</em></p>
                        {wheelContent['meta:overview'].teaching.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                        <p className="attr-list">Lightningbolt pp. {wheelContent['meta:overview'].pages.join(', ')}</p>
                      </div>
                    ) : (
                      <p>Select a position on the medicine wheel to explore its teachings.</p>
                    )}
                    <p className="attr-list" style={{ marginTop: '1rem' }}>Human Self · Perspective · Elements · Four Sacred Elements · Earth Count · Spheres of the Body · Mathematics</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      ) : selectedMonth ? (
        <>
          <h2 className="metals-heading">
            {selectedMonth}
            <span className="metals-sub">Mythic Calendar</span>
          </h2>
          <div className="calendar-weekday-bar">
            <p className="calendar-today-label">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="calendar-weekday-buttons">
              {WEEKDAYS.map((w, i) => (
                <button
                  key={w.day}
                  className={`calendar-weekday-btn${new Date().getDay() === i ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedPlanet(w.planet);
                    setSelectedMonth(null);
                    setHoveredPlanet(null);
                  }}
                  onMouseEnter={() => setHoveredPlanet(w.planet)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  title={`${w.day} — ruled by ${w.planet}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <MonthContent month={selectedMonth} activeTab={activeMonthTab} onSelectTab={setActiveMonthTab} />
              </div>
            </div>
          </div>
        </>
      ) : selectedEarth === 'day' ? (
        <>
          <h2 className="metals-heading">
            Earth · Day
            <span className="metals-sub">Daylight</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                <DayNightContent side="day" activeCulture={activeCulture} />
              </div>
            </div>
          </div>
        </>
      ) : selectedEarth === 'night' ? (
        <>
          <h2 className="metals-heading">
            Earth · Night
            <span className="metals-sub">Night Shadow</span>
          </h2>
          <div className="container">
            <div id="content-container">
              <div className="metal-detail-panel">
                <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                <DayNightContent side="night" activeCulture={activeCulture} />
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
                <div className="metal-tabs">
                  <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                  {CARDINAL_PLAYLISTS[selectedCardinal] && (
                    <button
                      className={`metal-tab playlist-tab${videoUrl ? ' active' : ''}`}
                      title={`Watch ${cardinalsData[selectedCardinal]?.label || selectedCardinal} playlist`}
                      onClick={() => {
                        if (videoUrl) { setVideoUrl(null); }
                        else { setVideoUrl(CARDINAL_PLAYLISTS[selectedCardinal]); }
                      }}
                    >
                      {videoUrl ? '\u25A0' : '\u25B6'}
                    </button>
                  )}
                  <button
                    className={`metal-tab persona-tab${personaChatOpen === `cardinal:${selectedCardinal}` ? ' active' : ''}`}
                    title={personaChatOpen === `cardinal:${selectedCardinal}` ? 'Close persona chat' : `Speak to ${cardinalsData[selectedCardinal]?.label || selectedCardinal}`}
                    onClick={() => togglePersonaChat('cardinal', selectedCardinal)}
                  >
                    {personaChatOpen === `cardinal:${selectedCardinal}` ? '\u25A0' : '\uD83C\uDF99'}
                  </button>
                </div>
                <CardinalContent cardinalId={selectedCardinal} activeCulture={activeCulture} />
                {personaChatOpen === `cardinal:${selectedCardinal}` && (
                  <PersonaChatPanel
                    entityType="cardinal"
                    entityName={selectedCardinal}
                    entityLabel={cardinalsData[selectedCardinal]?.label || selectedCardinal}
                    messages={personaChatHistory[`cardinal:${selectedCardinal}`] || []}
                    setMessages={setCurrentPersonaMessages}
                    onClose={() => setPersonaChatOpen(null)}
                  />
                )}
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
                <div className="metal-tabs">
                  <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
                  {ZODIAC_PLAYLISTS[selectedSign] && (
                    <button
                      className={`metal-tab playlist-tab${videoUrl ? ' active' : ''}`}
                      title={`Watch ${selectedSign} playlist`}
                      onClick={() => {
                        if (videoUrl) { setVideoUrl(null); }
                        else { setVideoUrl(ZODIAC_PLAYLISTS[selectedSign]); }
                      }}
                    >
                      {videoUrl ? '\u25A0' : '\u25B6'}
                    </button>
                  )}
                  <button
                    className={`metal-tab persona-tab${personaChatOpen === `zodiac:${selectedSign}` ? ' active' : ''}`}
                    title={personaChatOpen === `zodiac:${selectedSign}` ? 'Close persona chat' : `Speak to ${selectedSign}`}
                    onClick={() => togglePersonaChat('zodiac', selectedSign)}
                  >
                    {personaChatOpen === `zodiac:${selectedSign}` ? '\u25A0' : '\uD83C\uDF99'}
                  </button>
                </div>
                <ZodiacContent sign={selectedSign} activeCulture={activeCulture} />
                {personaChatOpen === `zodiac:${selectedSign}` && (
                  <PersonaChatPanel
                    entityType="zodiac"
                    entityName={selectedSign}
                    entityLabel={selectedSign}
                    messages={personaChatHistory[`zodiac:${selectedSign}`] || []}
                    setMessages={setCurrentPersonaMessages}
                    onClose={() => setPersonaChatOpen(null)}
                  />
                )}
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
                    playlistUrl={PLANET_PLAYLISTS[selectedPlanet]}
                    videoActive={!!videoUrl}
                    onToggleVideo={() => {
                      if (videoUrl) { setVideoUrl(null); }
                      else { setVideoUrl(PLANET_PLAYLISTS[selectedPlanet]); }
                    }}
                    onTogglePersonaChat={() => togglePersonaChat('planet', selectedPlanet)}
                    personaChatActive={personaChatOpen === `planet:${selectedPlanet}`}
                    personaChatMessages={personaChatHistory[`planet:${selectedPlanet}`] || []}
                    setPersonaChatMessages={setCurrentPersonaMessages}
                    onClosePersonaChat={() => setPersonaChatOpen(null)}
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
