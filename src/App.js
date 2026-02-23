import React, { useState, useEffect, useCallback, useRef, useContext, createContext, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { CourseworkProvider, useCoursework } from './coursework/CourseworkContext';
import { WritingsProvider, useWritings } from './writings/WritingsContext';
import { ProfileProvider, useProfile } from './profile/ProfileContext';
import { MultiplayerProvider } from './multiplayer/MultiplayerContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { FriendRequestsProvider } from './contexts/FriendRequestsContext';
import { MatchRequestsProvider } from './contexts/MatchRequestsContext';
import { FellowshipProvider } from './contexts/FellowshipContext';
import { AtlasContextProvider, useAtlasContext } from './contexts/AtlasContext';
import ShareCompletionModal from './components/fellowship/ShareCompletionModal';
import { ScopeProvider } from './contexts/ScopeContext';
import { TraditionsProvider } from './contexts/TraditionsContext';
import { CreationsProvider } from './contexts/CreationsContext';
import { StoryBookProvider } from './contexts/StoryBookContext';
import { GenealogyProvider } from './contexts/GenealogyContext';
import LoginPage from './auth/LoginPage';
import './App.css';
import { apiFetch } from './lib/chatApi';
import ChatPanel from './components/ChatPanel';
import CircleNav from './components/CircleNav';
import DevelopmentPanel from './components/DevelopmentPanel';
import useWheelJourney from './hooks/useWheelJourney';
import WheelJourneyPanel from './components/WheelJourneyPanel';
import ChronosphaeraPage from './pages/Chronosphaera/ChronosphaeraPage';
import MonomythPage from './pages/Monomyth/MonomythPage';
import MythologyChannelPage from './pages/MythologyChannel/MythologyChannelPage';
import GamesPage from './pages/Games/GamesPage';
import LEGAL_DOCUMENTS from './data/legalDocuments';
import figures from './data/figures.json';
import modernFigures from './data/modernFigures.json';
import stageOverviews from './data/stageOverviews.json';
import steelProcess from './data/steelProcess.json';
import saviors from './data/saviors.json';
import ufo from './data/ufo.json';
import monomyth from './data/monomyth.json';
import synthesis from './data/synthesis.json';
import ArchetypesPanel from './components/ArchetypesPanel';

// YBR header context — pages register their toggle/active state so the header can show the button
const YBRHeaderContext = createContext({ active: false, toggle: null });
export const useYBRHeader = () => useContext(YBRHeaderContext);

// Story Forge context — global toggle for Development panels throughout the site
const StoryForgeContext = createContext({ forgeMode: false });
export const useStoryForge = () => useContext(StoryForgeContext);

// YBR mode context — global toggle for Yellow Brick Road icons throughout the site
const YBRModeContext = createContext({ ybrMode: false });
export const useYBRMode = () => useContext(YBRModeContext);

// Area override — now backed by AtlasContext for backward compatibility
export const useAreaOverride = () => {
  const { area, meta, register } = useAtlasContext();
  return { area, meta, register };
};

// XR mode context — global toggle for VR/AR features
const XRModeContext = createContext({ xrMode: false });
export const useXRMode = () => useContext(XRModeContext);

const ChronosphaeraVRPage = lazy(() => import('./pages/Chronosphaera/ChronosphaeraVRPage'));
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));
const OuroborosJourneyPage = lazy(() => import('./pages/OuroborosJourney/OuroborosJourneyPage'));
const AtlasPage = lazy(() => import('./pages/Atlas/AtlasPage'));
const MythSalonLibraryPage = lazy(() => import('./pages/MythSalonLibrary/MythSalonLibraryPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const StoryOfStoriesPage = lazy(() => import('./pages/StoryOfStories/StoryOfStoriesPage'));
const MythsPage = lazy(() => import('./pages/Myths/MythsPage'));
const MythicEarthPage = lazy(() => import('./pages/MythicEarth/MythicEarthPage'));
const YellowBrickRoadPage = lazy(() => import('./pages/YellowBrickRoad/YellowBrickRoadPage'));
const XRPage = lazy(() => import('./pages/XR/XRPage'));
const FallenStarlightPage = lazy(() => import('./pages/FallenStarlight/FallenStarlightPage'));
const MentorDirectoryPage = lazy(() => import('./pages/MentorDirectory/MentorDirectoryPage'));
const GuildPage = lazy(() => import('./pages/Guild/GuildPage'));
const SacredSites360Page = lazy(() => import('./pages/SacredSites360/SacredSites360Page'));
const DiscoverPage = lazy(() => import('./pages/Discover/DiscoverPage'));
const DiscoverStarlightPage = lazy(() => import('./pages/DiscoverStarlight/DiscoverStarlightPage'));
const SecretWeaponPage = lazy(() => import('./pages/SecretWeapon/SecretWeaponPage'));
const FellowshipPage = lazy(() => import('./pages/Fellowship/FellowshipPage'));
const CuratedProductsPage = lazy(() => import('./pages/CuratedProducts/CuratedProductsPage'));
const MatchingPage = lazy(() => import('./pages/Matching/MatchingPage'));

const STAGES = [
  { id: 'golden-age', label: 'Golden Age' },
  { id: 'falling-star', label: 'Calling Star', playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrMxHMpTDRlDhlLoaRq6dF4' },
  { id: 'impact-crater', label: 'Crater Crossing', flipLabel: true, playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtoYglowzB41dBItO8rMabPn' },
  { id: 'forge', label: 'Trials of Forge', playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpg0pxs6NXg74AcwRseQsyB' },
  { id: 'quenching', label: 'Quench', playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtp9wK2jaSsGVtMPijVE12NQ' },
  { id: 'integration', label: 'Integration' },
  { id: 'drawing', label: 'Draw', flipLabel: true },
  { id: 'new-age', label: 'Age of Steel' },
];

const OVERVIEW_PLAYLIST = 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtprvPecCWeurfN2QUufNTX_';

const FIGURE_PLAYLISTS = {
  'achilles-hephaestus-prometheus': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtoo4HfBh_Seteq850FpXj0J',
  'jason-hercules-argonauts': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpcAkL6FcT6oh0kjxPCwIdC',
};

const WILL_LINN_PLAYLIST = 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqnc5ueQyjc0ZZQCtYZ6Pci';

/* CircleNav extracted to ./components/CircleNav.js */

const SECTION_TABS = [
  { id: 'technology', label: 'Meteor Steel Technology' },
  { id: 'figures', label: 'Mythic Figures' },
  { id: 'saviors', label: 'Iron Age Saviors' },
  { id: 'modern', label: 'Modern Myths' },
  { id: 'ufo', label: 'UFO' },
  { id: 'monomyth', label: 'Monomyth' },
  { id: 'synthesis', label: 'Synthesis' },
];

function FigureCards({ figuresList, stage, onPlayFigure }) {
  const available = figuresList.filter(f => f.stages[stage] && f.stages[stage].trim());
  const [activeFigure, setActiveFigure] = useState(available[0]?.id || null);

  useEffect(() => {
    if (available.length > 0 && !available.find(f => f.id === activeFigure)) {
      setActiveFigure(available[0].id);
    }
  }, [stage, available, activeFigure]);

  if (available.length === 0) {
    return <div className="empty-content">No content available for this stage.</div>;
  }

  const renderFigureName = (f) => {
    const playlistUrl = FIGURE_PLAYLISTS[f.id];
    if (playlistUrl && onPlayFigure) {
      return (
        <>
          {f.name} <span className="figure-play-icon" onClick={(e) => { e.stopPropagation(); onPlayFigure(playlistUrl); }}>{'\u25B6'}</span>
        </>
      );
    }
    return f.name;
  };

  if (available.length === 1) {
    const f = available[0];
    return (
      <div className="figure-card">
        <h4 className="figure-name">{renderFigureName(f)}</h4>
        <div className="figure-content">
          {f.stages[stage].split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    );
  }

  const selected = available.find(f => f.id === activeFigure) || available[0];

  return (
    <div className="figure-selector">
      <div className="figure-buttons">
        {available.map(f => (
          <button
            key={f.id}
            className={`figure-btn ${f.id === selected.id ? 'active' : ''}`}
            onClick={() => setActiveFigure(f.id)}
          >
            {renderFigureName(f)}
          </button>
        ))}
      </div>
      <div className="figure-card">
        <div className="figure-content">
          {selected.stages[stage].split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function BioView() {
  return (
    <div className="static-overview">
      <div className="overview-text bio-text">
        <p>Will Linn, Ph.D., is a mythologist, producer, and media creator working at the intersection of mythology, storytelling, and immersive media. He is the Founder of Mythouse.org, Head Mythologist and Narrative Producer for Fascinated by Everything, and a recurring "meta-expert" for the television series <em>Myths: The Greatest Mysteries of Humanity</em>, which has aired internationally and been translated into multiple languages. His documentary appearances include <em>Memory: The Origins of Alien</em> (2019) and <em>The Taking</em> (2023). Linn has collaborated with musicians, filmmakers, and artists to develop transformational narrative projects across projection-mapped spaces, domes, VR, and large-format screens.</p>
        <p>From 2011 to 2021, Linn held leadership roles with the Joseph Campbell Foundation, contributing to the creation of the Joseph Campbell Writers' Room in Los Angeles Center Studios. From 2015 to 2023, he served as professor and founding department chair at Hussian College's film and performing arts campus, where he taught mythology, anthropology, philosophy, writing, and storytelling. He has presented at international conferences, delivered the <em>Sermons of the Earth</em> lecture series at Kintsugi in Austin, and serves as Chair of the Board for StoryAtlas, helping bring climate and storytelling programs to thousands of students. Linn holds a Ph.D. in Mythology from Pacifica Graduate Institute and a B.A. in Philosophy from Sewanee: The University of the South.</p>
      </div>
    </div>
  );
}

function TextContent({ text }) {
  if (!text || !text.trim()) {
    return <div className="empty-content">Content to be added.</div>;
  }
  return (
    <div className="overview-text">
      {text.split('\n\n').map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function OverviewView({ onPlayVideo, videoActive }) {
  return (
    <div className="static-overview">
      <div className="overview-text">
        {stageOverviews.overview.split('\n\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="overview-play-row">
        <button
          className={`section-tab playlist-tab${videoActive ? ' active' : ''}`}
          onClick={() => onPlayVideo(videoActive ? null : OVERVIEW_PLAYLIST)}
          title="Heroes of Steel playlist"
        >
          {videoActive ? '\u25A0' : '\u25B6'} Heroes of Steel
        </button>
      </div>
    </div>
  );
}


function SectionContent({ sectionId, stage, entries, setEntries, onPlayFigure }) {
  switch (sectionId) {
    case 'technology':
      return <TextContent text={steelProcess[stage]} />;
    case 'figures':
      return <FigureCards figuresList={figures} stage={stage} onPlayFigure={onPlayFigure} />;
    case 'saviors':
      return <FigureCards figuresList={saviors} stage={stage} onPlayFigure={onPlayFigure} />;
    case 'modern':
      return <FigureCards figuresList={modernFigures} stage={stage} onPlayFigure={onPlayFigure} />;
    case 'ufo':
      return <TextContent text={ufo[stage]} />;
    case 'monomyth':
      return <TextContent text={monomyth[stage]} />;
    case 'synthesis':
      return <TextContent text={synthesis[stage]} />;
    case 'development':
      return <DevelopmentPanel stageLabel={STAGES.find(s => s.id === stage)?.label || stage} stageKey={stage} entries={entries} setEntries={setEntries} />;
    default:
      return null;
  }
}

function StageView({ stage, devEntries, setDevEntries, onPlayVideo, videoActive, onPlayFigure, onToggleYBR, ybrActive }) {
  const [activeSection, setActiveSection] = useState('technology');
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();
  const stageData = STAGES.find(s => s.id === stage);
  const playlistUrl = stageData?.playlist;

  return (
    <>
      <div className="static-overview">
        <TextContent text={stageOverviews[stage]} />
      </div>

      <div className="section-tabs">
        {SECTION_TABS.map(tab => (
          <button
            key={tab.id}
            className={`section-tab ${activeSection === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        {forgeMode && (
          <button
            className={`section-tab forge-icon-tab${activeSection === 'development' ? ' active' : ''}`}
            title="Story Forge"
            onClick={() => setActiveSection('development')}
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10,2 L10,11" />
              <path d="M7,5 Q10,3 13,5" />
              <path d="M6,11 L14,11" />
              <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
            </svg>
          </button>
        )}
        {ybrMode && onToggleYBR && (
          <button
            className={`section-tab ybr-icon-tab${ybrActive ? ' active' : ''}`}
            title={ybrActive ? 'Exit Yellow Brick Road' : 'Walk the Yellow Brick Road'}
            onClick={onToggleYBR}
          >
            <svg viewBox="0 0 20 14" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M1,4 L7,1 L19,1 L13,4 Z" />
              <path d="M1,4 L1,13 L13,13 L13,4" />
              <path d="M13,4 L19,1 L19,10 L13,13" />
              <line x1="7" y1="4" x2="7" y2="13" />
              <line x1="1" y1="8.5" x2="13" y2="8.5" />
              <line x1="4" y1="8.5" x2="4" y2="13" />
              <line x1="10" y1="4" x2="10" y2="8.5" />
            </svg>
          </button>
        )}
        {playlistUrl && (
          <button
            className={`section-tab playlist-tab${videoActive ? ' active' : ''}`}
            title="Watch playlist"
            onClick={() => onPlayVideo(videoActive ? null : playlistUrl)}
          >
            {videoActive ? '\u25A0' : '\u25B6'}
          </button>
        )}
      </div>

      <div className="section-content">
        <div className="content-area">
          <SectionContent sectionId={activeSection} stage={stage} entries={devEntries} setEntries={setDevEntries} onPlayFigure={onPlayFigure} />
        </div>
      </div>
    </>
  );
}

function MeteorShower({ active }) {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    if (!active) {
      setMeteors([]);
      return;
    }
    const count = 35;
    const newMeteors = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 120 - 10,
      delay: Math.random() * 2.2,
      duration: 1.2 + Math.random() * 1.8,
      size: 1 + Math.random() * 2.5,
      tailLength: 40 + Math.random() * 80,
      angle: -(12 + Math.random() * 16),
      opacity: 0.4 + Math.random() * 0.6,
    }));
    setMeteors(newMeteors);
    const timer = setTimeout(() => setMeteors([]), 4500);
    return () => clearTimeout(timer);
  }, [active]);

  if (meteors.length === 0) return null;

  return (
    <div className="meteor-shower">
      {meteors.map(m => (
        <div
          key={m.id}
          className="meteor-streak"
          style={{
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--meteor-size': `${m.size}px`,
            '--meteor-tail': `${m.tailLength}px`,
            '--meteor-angle': `${m.angle}deg`,
            opacity: m.opacity,
          }}
        />
      ))}
    </div>
  );
}

function MeteorSteelHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [showMeteors, setShowMeteors] = useState(false);
  const [devEntries, setDevEntries] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);
  const [ybrAutoStart, setYbrAutoStart] = useState(false);

  const journey = useWheelJourney('meteor-steel', STAGES);
  const { trackElement, trackTime, isElementCompleted, courseworkMode } = useCoursework();
  const { notesData, saveNotes, loaded: writingsLoaded } = useWritings();

  // Load dev entries from persisted notes on mount
  useEffect(() => {
    if (writingsLoaded && notesData.entries) {
      const relevant = {};
      Object.entries(notesData.entries).forEach(([key, val]) => {
        // Home page keys don't have a prefix (stage keys like "golden-age-noting")
        if (!key.startsWith('starlight-') && !key.startsWith('forge-') && !key.startsWith('monomyth-') && !key.startsWith('chronosphaera-') && !key.startsWith('metals-')) {
          relevant[key] = val;
        }
      });
      if (Object.keys(relevant).length > 0) setDevEntries(prev => ({ ...relevant, ...prev }));
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save dev entries to writings context on change
  const prevDevEntries = useRef(devEntries);
  useEffect(() => {
    if (!writingsLoaded) return;
    if (prevDevEntries.current === devEntries) return;
    prevDevEntries.current = devEntries;
    Object.entries(devEntries).forEach(([key, val]) => {
      saveNotes(key, val);
    });
  }, [devEntries, writingsLoaded, saveNotes]);

  // Page visit tracking
  useEffect(() => { trackElement('home.page.visited'); }, [trackElement]);

  // Time tracking per stage
  const timeRef = useRef({ stage: currentStage, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0 && prev.stage !== 'overview') {
      trackTime(`home.stage.${prev.stage}.time`, elapsed);
    }
    timeRef.current = { stage: currentStage, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0 && cur.stage !== 'overview') {
        trackTime(`home.stage.${cur.stage}.time`, secs);
      }
    };
  }, [currentStage, trackTime]);

  // Meteor shower on page open
  useEffect(() => {
    const t = setTimeout(() => {
      setShowMeteors(false);
      requestAnimationFrame(() => setShowMeteors(true));
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handleYBRToggle = useCallback(() => {
    if (journey.active) {
      journey.exitGame();
    } else {
      journey.startGame();
      trackElement('home.ybr.started');
    }
  }, [journey, trackElement]);

  const handleSelectStage = useCallback((stage) => {
    setCurrentStage(stage);
    setVideoUrl(null);
    if (stage !== 'overview') trackElement(`home.stage.${stage}`);
    if (stage === 'falling-star') {
      setShowMeteors(false);
      requestAnimationFrame(() => setShowMeteors(true));
    } else {
      setShowMeteors(false);
    }
  }, [trackElement]);

  // When journey advances to a new stage, auto-select it on the wheel
  useEffect(() => {
    if (journey.active && journey.currentStopIndex >= 0 && journey.currentStopIndex < STAGES.length) {
      handleSelectStage(STAGES[journey.currentStopIndex].id);
    }
  }, [journey.active, journey.currentStopIndex, handleSelectStage]);

  // Deep link from Atlas navigation
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    const journeyParam = searchParams.get('journey');
    if (journeyParam === 'true') {
      setYbrAutoStart(true);
    } else if (stageParam && STAGES.find(s => s.id === stageParam)) {
      handleSelectStage(stageParam);
    }
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayVideo = useCallback((url) => {
    setVideoUrl(url);
    trackElement(`home.video.${currentStage}`);
  }, [trackElement, currentStage]);

  const currentLabel = currentStage === 'overview'
    ? null
    : STAGES.find(s => s.id === currentStage)?.label;

  return (
    <>
      <MeteorShower active={showMeteors} />
      <CircleNav
        stages={STAGES}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        clockwise={clockwise}
        onToggleDirection={() => setClockwise(!clockwise)}
        videoUrl={videoUrl}
        onCloseVideo={() => setVideoUrl(null)}
        onAuthorPlay={() => setVideoUrl(WILL_LINN_PLAYLIST)}
        ybrActive={journey.active}
        ybrCurrentStopIndex={journey.currentStopIndex}
        ybrStages={STAGES}
        onToggleYBR={handleYBRToggle}
        ybrAutoStart={ybrAutoStart}
        getStageClass={courseworkMode ? (id) => isElementCompleted(`home.stage.${id}`) ? 'cw-completed' : 'cw-incomplete' : undefined}
      />

      {currentStage !== 'overview' && currentStage !== 'bio' && (
        <h2 className="stage-heading">{currentLabel}</h2>
      )}

      {journey.active && (
        <div className="container">
          <WheelJourneyPanel
            journeyId="meteor-steel"
            stages={STAGES}
            currentStopIndex={journey.currentStopIndex}
            stopProgress={journey.stopProgress}
            journeyComplete={journey.journeyComplete}
            completedStops={journey.completedStops}
            totalStops={journey.totalStops}
            onAdvanceFromIntro={journey.advanceFromIntro}
            onRecordResult={journey.recordResult}
            onAdvanceToNext={journey.advanceToNext}
            onExit={journey.exitGame}
            introText={[
              "Atlas invites you to walk the Yellow Brick Road of Meteor Steel.",
              "Eight stages. Eight stops around the wheel. At each one, Atlas will ask you to describe what happens at that stage — the technology, the mythology, and the transformation.",
              "You are encouraged to explore each stage's content on the page before answering. The tabs above hold the knowledge you need — technology, figures, saviors, monomyth, synthesis.",
              "Steel cuts. Life flows.",
            ]}
            completionText={[
              "You have walked the full wheel of Meteor Steel — from Golden Age through Calling Star, Crater Crossing, Trials of Forge, Quench, Integration, Draw, and Age of Steel.",
              "The meteorite fell. The crater opened. The forge burned. The blade was drawn. You have traced the full arc of transformation — from fallen starlight to living steel.",
            ]}
            returnLabel="Return to Meteor Steel"
          />
        </div>
      )}

      <div className="container">
        <div id="content-container">
          {currentStage === 'overview' ? (
            <OverviewView onPlayVideo={handlePlayVideo} videoActive={!!videoUrl} />
          ) : currentStage === 'bio' ? (
            <BioView />
          ) : (
            <StageView
              stage={currentStage}
              devEntries={devEntries}
              setDevEntries={setDevEntries}
              onPlayVideo={handlePlayVideo}
              videoActive={!!videoUrl}
              onPlayFigure={handlePlayVideo}
              onToggleYBR={handleYBRToggle}
              ybrActive={journey.active}
            />
          )}
        </div>
      </div>
    </>
  );
}


const FORGE_STAGES = [
  { id: 'golden-age', label: 'Surface' },
  { id: 'falling-star', label: 'Calling' },
  { id: 'impact-crater', label: 'Crossing', flipLabel: true },
  { id: 'forge', label: 'Initiating' },
  { id: 'quenching', label: 'Nadir' },
  { id: 'integration', label: 'Return' },
  { id: 'drawing', label: 'Arrival', flipLabel: true },
  { id: 'new-age', label: 'Renewal' },
];

const TEMPLATE_OPTIONS = [
  { id: 'personal', label: 'Personal Myth', desc: 'Your own life as monomyth' },
  { id: 'fiction', label: 'Fiction', desc: 'A character and world you invent' },
  { id: 'screenplay', label: 'Screenplay', desc: 'Visual, cinematic storytelling' },
  { id: 'reflection', label: 'Reflection', desc: 'Philosophical exploration' },
  { id: 'my-stories', label: 'My Stories', desc: 'Your personal story journal' },
  { id: 'archetypes', label: 'Archetypes', desc: 'Archetypal character alignments' },
];

const FORGE_PROMPTS = {
  personal: {
    'golden-age': 'Describe a time in your life when things felt whole and ordered. What was the world like before disruption arrived?',
    'falling-star': 'What unexpected event, person, or realization disrupted your world? What fell from the sky and demanded your attention?',
    'impact-crater': 'Where did heaven meet earth? Describe the moment of collision — when the disruption hit and the ground shook beneath you.',
    'forge': 'What trials by fire did you face? What burned away, and what was being shaped in the heat?',
    'quenching': 'Describe the cooling — the moment the intensity broke. What hardened in you? What clarity emerged?',
    'integration': 'How did you bring the changed self back into your life? What did you include rather than purify away?',
    'drawing': 'Who emerged from this process? Describe the person you became — the blade drawn from the forge.',
    'new-age': 'What does your world look like now, transformed? How has the journey changed not just you, but your relationship to everything?',
  },
  fiction: {
    'golden-age': 'Establish your story\'s world before disruption. Who lives here? What is ordinary, precious, or taken for granted?',
    'falling-star': 'Something arrives from beyond — a stranger, a prophecy, a catastrophe. What is the calling that shatters normalcy?',
    'impact-crater': 'The threshold is crossed. Your protagonist enters unknown territory. What is the landscape of this new world?',
    'forge': 'Your character faces ordeals, allies, and enemies. What trials test them to their core?',
    'quenching': 'After the climactic fire, there is a transformation. What does your character become through sacrifice or surrender?',
    'integration': 'The character must reconcile who they were with who they have become. What inner conflict resolves?',
    'drawing': 'The hero is fully realized. What power, truth, or gift do they now wield?',
    'new-age': 'The world is remade. How does your character\'s transformation ripple outward? What is the new ordinary?',
  },
  screenplay: {
    'golden-age': 'INT/EXT — Establish the opening world. What does the audience see and hear? What tone is set?',
    'falling-star': 'The inciting incident. Write the scene or describe the moment everything changes. What is the visual hook?',
    'impact-crater': 'Act One break. The protagonist commits to the journey. Where do they go? What do they leave behind?',
    'forge': 'Act Two trials. Describe 2-3 key sequences — confrontations, setbacks, revelations. Rising tension.',
    'quenching': 'The midpoint shift or dark night of the soul. What breaks? What is the lowest moment before transformation?',
    'integration': 'The protagonist reconciles internal conflict. What scene shows them accepting the full truth?',
    'drawing': 'The climax. Describe the defining action, confrontation, or choice that resolves the central conflict.',
    'new-age': 'The denouement. What image closes the film? How has the world visually changed from the opening?',
  },
  reflection: {
    'golden-age': 'What does "paradise before the fall" mean to you? When have you experienced a golden age — personally, culturally, or imaginally?',
    'falling-star': 'Reflect on disruption as a sacred messenger. What uninvited guests have become your greatest teachers?',
    'impact-crater': 'Consider the places where spirit and matter collide. Where in your life has the transcendent crashed into the mundane?',
    'forge': 'What is the relationship between suffering and becoming? When has fire been a gift rather than a punishment?',
    'quenching': 'Reflect on the nature of cooling, patience, and the kind of strength that comes from stillness rather than action.',
    'integration': 'What does it mean to include rather than purify? How do you hold opposites together without resolving them?',
    'drawing': 'When have you felt fully drawn forth — revealed as who you truly are? What conditions allowed that emergence?',
    'new-age': 'How do personal transformations change the collective? Reflect on the relationship between inner work and outer worlds.',
  },
};

function StoryForgeHome() {
  const [currentStage, setCurrentStage] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [showMeteors, setShowMeteors] = useState(false);
  const [template, setTemplate] = useState(null);
  const [forgeEntries, setForgeEntries] = useState({});
  const [generatedStory, setGeneratedStory] = useState({});
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('write');
  const [libraryExpanded, setLibraryExpanded] = useState(null);
  // Personal Stories state
  const [activeStoryFilter, setActiveStoryFilter] = useState(null); // storyId or 'archetypal'
  const [expandedStory, setExpandedStory] = useState(null);
  const [storyViewTab, setStoryViewTab] = useState('entries'); // 'entries' | 'generated'
  const [editingStage, setEditingStage] = useState(null); // { storyId, stageId }
  const [editDraft, setEditDraft] = useState('');
  const [showStoryInterview, setShowStoryInterview] = useState(false);
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewStoryId, setInterviewStoryId] = useState(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisText, setSynthesisText] = useState(null);
  // Polarity Generator state — null | 'protagonism' | 'antagonism'
  const [generatorMode, setGeneratorMode] = useState(null);
  const [generatorMessages, setGeneratorMessages] = useState([]);
  const [generatorInput, setGeneratorInput] = useState('');
  const [generatorLoading, setGeneratorLoading] = useState(false);
  // Draft mode state
  const [draftMessages, setDraftMessages] = useState({});
  const [draftInput, setDraftInput] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [forgeDrafts, setForgeDrafts] = useState({});
  const draftChatEndRef = useRef(null);
  const { trackElement, trackTime, isElementCompleted, courseworkMode } = useCoursework();
  const { forgeData, saveForge, saveForgeConversation, saveForgeDraft, getAllWritings, personalStories, addStory, addStoryEntry, updateStoryEdited, updateStoryName, saveConversation, loaded: writingsLoaded } = useWritings();

  // Load forge data from persisted writings on mount
  useEffect(() => {
    if (writingsLoaded && forgeData) {
      if (forgeData.template) setTemplate(forgeData.template);
      if (forgeData.entries && Object.keys(forgeData.entries).length > 0) {
        setForgeEntries(prev => ({ ...forgeData.entries, ...prev }));
      }
      if (forgeData.stories && Object.keys(forgeData.stories).length > 0) {
        setGeneratedStory(prev => ({ ...forgeData.stories, ...prev }));
      }
      if (forgeData.conversations) setDraftMessages(prev => ({ ...forgeData.conversations, ...prev }));
      if (forgeData.drafts) setForgeDrafts(prev => ({ ...forgeData.drafts, ...prev }));
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save forge data to writings context on change
  const prevForgeState = useRef({ entries: forgeEntries, stories: generatedStory, template });
  useEffect(() => {
    if (!writingsLoaded) return;
    const prev = prevForgeState.current;
    if (prev.entries === forgeEntries && prev.stories === generatedStory && prev.template === template) return;
    prevForgeState.current = { entries: forgeEntries, stories: generatedStory, template };
    saveForge(forgeEntries, generatedStory, template);
  }, [forgeEntries, generatedStory, template, writingsLoaded, saveForge]);

  // Page visit tracking
  useEffect(() => { trackElement('story-forge.page.visited'); }, [trackElement]);

  // Time tracking per stage
  const timeRef = useRef({ stage: currentStage, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0 && prev.stage !== 'overview' && prev.stage !== 'bio') {
      trackTime(`story-forge.stage.${prev.stage}.time`, elapsed);
    }
    timeRef.current = { stage: currentStage, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0 && cur.stage !== 'overview' && cur.stage !== 'bio') {
        trackTime(`story-forge.stage.${cur.stage}.time`, secs);
      }
    };
  }, [currentStage, trackTime]);

  const handleSelectStage = useCallback((stage) => {
    setCurrentStage(stage);
    if (stage !== 'overview' && stage !== 'bio') trackElement(`story-forge.stage.${stage}`);
    if (stage === 'falling-star') {
      setShowMeteors(false);
      requestAnimationFrame(() => setShowMeteors(true));
    } else {
      setShowMeteors(false);
    }
  }, [trackElement]);

  const stagesWithContent = FORGE_STAGES.filter(s => {
    const modes = ['noting', 'reflecting', 'creating'];
    return modes.some(m => (forgeEntries[`forge-${s.id}-${m}`] || []).length > 0);
  });

  const currentLabel = currentStage !== 'overview' && currentStage !== 'bio'
    ? FORGE_STAGES.find(s => s.id === currentStage)?.label
    : null;

  const currentIdx = FORGE_STAGES.findIndex(s => s.id === currentStage);

  const goNext = () => {
    if (currentIdx < FORGE_STAGES.length - 1) handleSelectStage(FORGE_STAGES[currentIdx + 1].id);
  };
  const goPrev = () => {
    if (currentIdx > 0) handleSelectStage(FORGE_STAGES[currentIdx - 1].id);
  };

  // --- Draft mode handlers ---
  const handleDraftSend = async (isRequestDraft = false) => {
    const text = isRequestDraft ? 'Please produce a polished draft for this stage.' : draftInput.trim();
    if (!text || draftLoading) return;
    setDraftInput('');
    setDraftLoading(true);

    const stageMessages = draftMessages[currentStage] || [];
    const userMsg = { role: 'user', content: text };
    const updated = [...stageMessages, userMsg];
    setDraftMessages(prev => ({ ...prev, [currentStage]: updated }));

    // Gather raw entries for this stage
    const modes = ['noting', 'reflecting', 'creating'];
    const stageEntries = modes
      .map(m => ({ mode: m, text: (forgeEntries[`forge-${currentStage}-${m}`] || []).map(e => e.text).join('\n') }))
      .filter(e => e.text);

    // Adjacent drafts for continuity
    const prevIdx = currentIdx - 1;
    const nextIdx = currentIdx + 1;
    const adjacentDrafts = {};
    if (prevIdx >= 0 && forgeDrafts[FORGE_STAGES[prevIdx].id]?.text) {
      adjacentDrafts.previous = forgeDrafts[FORGE_STAGES[prevIdx].id].text;
    }
    if (nextIdx < FORGE_STAGES.length && forgeDrafts[FORGE_STAGES[nextIdx].id]?.text) {
      adjacentDrafts.next = forgeDrafts[FORGE_STAGES[nextIdx].id].text;
    }

    try {
      const templateLabel = TEMPLATE_OPTIONS.find(t => t.id === template)?.label || template;
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'forge-draft',
          messages: updated,
          stageId: currentStage,
          template: templateLabel,
          stageEntries,
          adjacentDrafts,
          requestDraft: isRequestDraft,
        }),
      });
      const data = await res.json();
      if (data.reply || data.draft || data.mythicParallel) {
        const assistantMsg = { role: 'assistant', content: data.reply || '' };
        if (data.mythicParallel) assistantMsg.mythicParallel = data.mythicParallel;
        const newMsgs = [...updated, assistantMsg];
        setDraftMessages(prev => ({ ...prev, [currentStage]: newMsgs }));
        saveForgeConversation(currentStage, newMsgs);

        if (data.draft) {
          setForgeDrafts(prev => ({ ...prev, [currentStage]: { text: data.draft, updatedAt: Date.now() } }));
          saveForgeDraft(currentStage, data.draft);
        }
      }
    } catch (err) {
      console.error('Draft send error:', err);
      const errorMsg = { role: 'assistant', content: 'Network error. Please try again.' };
      const newMsgs = [...updated, errorMsg];
      setDraftMessages(prev => ({ ...prev, [currentStage]: newMsgs }));
    }
    setDraftLoading(false);
    setTimeout(() => draftChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAssembleNarrative = async () => {
    setGenerating(true);
    trackElement(`story-forge.draft.assemble.${template}`);
    try {
      const templateLabel = TEMPLATE_OPTIONS.find(t => t.id === template)?.label || template;
      const draftTexts = {};
      Object.entries(forgeDrafts).forEach(([id, d]) => {
        if (d?.text) draftTexts[id] = d.text;
      });

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'forge-assemble', drafts: draftTexts, template: templateLabel }),
      });
      const data = await res.json();
      if (data.story) {
        const parts = data.story.split(/===\s*([\w-]+)\s*===/);
        const chapters = { ...generatedStory };
        for (let i = 1; i < parts.length; i += 2) {
          chapters[parts[i].trim()] = parts[i + 1].trim();
        }
        setGeneratedStory(chapters);
        setViewMode('read');
      }
    } catch (err) {
      console.error('Assemble narrative error:', err);
    }
    setGenerating(false);
  };

  const handleGenerate = async (targetStage) => {
    setGenerating(true);
    trackElement(`story-forge.generate.${template}${targetStage ? `.${targetStage}` : ''}`);
    try {
      const templateLabel = TEMPLATE_OPTIONS.find(t => t.id === template)?.label || template;
      const stageContent = FORGE_STAGES.map(s => {
        const modes = ['noting', 'reflecting', 'creating'];
        const entries = modes.flatMap(m =>
          (forgeEntries[`forge-${s.id}-${m}`] || []).map(e => `[${m}] ${e.text}`)
        );
        return { stageId: s.id, label: s.label, entries };
      }).filter(s => s.entries.length > 0);

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'forge', template: templateLabel, stageContent, targetStage: targetStage || null }),
      });
      const data = await res.json();
      if (data.story) {
        const parts = data.story.split(/===\s*([\w-]+)\s*===/);
        const chapters = { ...generatedStory };
        for (let i = 1; i < parts.length; i += 2) {
          chapters[parts[i].trim()] = parts[i + 1].trim();
        }
        setGeneratedStory(chapters);
        setViewMode('read');
      }
    } catch (err) {
      console.error('Story Forge generation error:', err);
    }
    setGenerating(false);
  };

  const handleGeneratorSend = async () => {
    const text = generatorInput.trim();
    if (!text || generatorLoading || !generatorMode) return;
    setGeneratorInput('');
    setGeneratorLoading(true);

    const userMsg = { role: 'user', content: text };
    const updated = [...generatorMessages, userMsg];
    setGeneratorMessages(updated);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: generatorMode, messages: updated }),
      });
      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.reply || 'No response.' };
      setGeneratorMessages([...updated, assistantMsg]);
    } catch {
      setGeneratorMessages([...updated, { role: 'assistant', content: 'Network error.' }]);
    }
    setGeneratorLoading(false);
  };

  const cycleGenerator = () => {
    if (!generatorMode) { setGeneratorMode('protagonism'); setGeneratorMessages([]); }
    else if (generatorMode === 'protagonism') { setGeneratorMode('antagonism'); setGeneratorMessages([]); }
    else { setGeneratorMode(null); }
  };

  const isProtag = generatorMode === 'protagonism';
  const isAntag = generatorMode === 'antagonism';

  const forgeControlsAndPanel = (
    <>
      <div className="forge-controls">
        <button className="forge-ctrl-btn" onClick={() => setClockwise(!clockwise)} title={clockwise ? 'Counter-clockwise' : 'Clockwise'}>
          {clockwise ? '\u21BB' : '\u21BA'}
        </button>
        <button className={`forge-ctrl-btn${generatorMode ? (isProtag ? ' active protag' : ' active antag') : ''}`} onClick={cycleGenerator} title={!generatorMode ? 'Protagonism Generator' : isProtag ? 'Switch to Antagonism' : 'Close Generator'}>
          {!generatorMode ? '+' : isProtag ? '+' : '\u2212'}
        </button>
      </div>
      {generatorMode && (
        <div className={`protagonism-panel ${generatorMode}`}>
          <div className="protagonism-header">
            <h3>{isProtag ? 'Protagonism' : 'Antagonism'} Generator</h3>
            <button onClick={() => setGeneratorMode(null)}>{'\u2715'}</button>
          </div>
          <p className="protagonism-intro">
            {isProtag
              ? 'Paste any antagonism \u2014 news, conflict, personal struggle, any story of opposition. The generator reads the narrative polarity and responds with the protagonism that antagonism inspires. Not analysis. Not commentary. The force it calls forth.'
              : 'Paste any protagonism \u2014 triumph, hope, resolution, any story of light. The generator reads the narrative polarity and responds with the antagonism that protagonism conceals. Not critique. Not cynicism. The shadow it casts.'}
          </p>
          <div className="protagonism-messages">
            {generatorMessages.map((msg, i) => (
              <div key={i} className={`protagonism-msg ${msg.role}`}>
                <span className="protagonism-label">{msg.role === 'user' ? (isProtag ? 'Antagonism' : 'Protagonism') : (isProtag ? 'Protagonism' : 'Antagonism')}</span>
                {msg.content.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
              </div>
            ))}
            {generatorLoading && <div className="protagonism-loading">{isProtag ? 'Reading polarity...' : 'Reading shadow...'}</div>}
          </div>
          <div className="protagonism-input-row">
            <textarea value={generatorInput} onChange={e => setGeneratorInput(e.target.value)} placeholder={isProtag ? 'Paste antagonism here...' : 'Paste protagonism here...'} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGeneratorSend(); }}} />
            <button onClick={handleGeneratorSend} disabled={generatorLoading || !generatorInput.trim()}>
              {generatorLoading ? '...' : '\u2192'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Template picker
  if (!template) {
    return (
      <>
        <MeteorShower active={showMeteors} />
        <CircleNav
          stages={FORGE_STAGES}
          currentStage={currentStage}
          onSelectStage={handleSelectStage}
          clockwise={clockwise}
          centerLine1="Story"
          centerLine2=""
          centerLine3="Forge"
          showAuthor={false}
          getStageClass={courseworkMode ? (id) => isElementCompleted(`story-forge.stage.${id}`) ? 'cw-completed' : 'cw-incomplete' : undefined}
        />
        {forgeControlsAndPanel}
        <div className="container">
          <div className="static-overview">
            <div className="overview-text" style={{ textAlign: 'center' }}>
              <p>Choose a lens through which to forge your story. You will be guided through the eight stages of the monomyth, writing at each stage. When ready, the forge will weave your material into a cohesive narrative.</p>
            </div>
          </div>
          <div className="forge-template-grid">
            {TEMPLATE_OPTIONS.map(t => (
              <button key={t.id} className={`forge-template-btn${courseworkMode ? (isElementCompleted(`story-forge.template.${t.id}`) ? ' cw-completed' : ' cw-incomplete') : ''}`} onClick={() => { trackElement(`story-forge.template.${t.id}`); setTemplate(t.id); }}>
                <span className="forge-template-label">{t.label}</span>
                <span className="forge-template-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // --- Archetypes mode ---
  if (template === 'archetypes') {
    return (
      <>
        <MeteorShower active={showMeteors} />
        <CircleNav
          stages={FORGE_STAGES}
          currentStage={currentStage}
          onSelectStage={handleSelectStage}
          clockwise={clockwise}
          centerLine1="Story"
          centerLine2=""
          centerLine3="Forge"
          showAuthor={false}
        />
        {forgeControlsAndPanel}
        <div className="container">
          <ArchetypesPanel trackElement={trackElement} trackPrefix="story-forge" />
        </div>
      </>
    );
  }

  // --- My Stories mode ---
  if (template === 'my-stories') {
    const stories = personalStories.stories || {};
    const storyEntries = Object.entries(stories).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
    const isStage = currentStage !== 'overview' && currentStage !== 'bio';
    const stageStories = isStage ? storyEntries.filter(([, s]) => {
      const st = s.stages[currentStage];
      return st && (st.entries.length > 0 || st.generated || st.edited);
    }) : storyEntries;
    const filteredStories = activeStoryFilter && activeStoryFilter !== 'archetypal'
      ? stageStories.filter(([id]) => id === activeStoryFilter)
      : stageStories;

    const handleStartInterview = () => {
      const id = `story-${Date.now()}`;
      setInterviewStoryId(id);
      setInterviewMessages([]);
      setInterviewInput('');
      setShowStoryInterview(true);
      trackElement('story-forge.my-stories.interview.start');
    };

    const handleInterviewSend = async () => {
      const text = interviewInput.trim();
      if (!text || interviewLoading) return;
      const userMsg = { role: 'user', content: text };
      const updated = [...interviewMessages, userMsg];
      setInterviewMessages(updated);
      setInterviewInput('');
      setInterviewLoading(true);
      try {
        const res = await apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updated, mode: 'story-interview', storyId: interviewStoryId }),
        });
        const data = await res.json();
        if (data.reply) {
          setInterviewMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
          // Auto-save story updates from structured response
          if (data.storyUpdate) {
            const su = data.storyUpdate;
            if (!stories[interviewStoryId]) {
              addStory(interviewStoryId, su.name || 'Untitled Story', 'atlas-interview');
            }
            if (su.name && stories[interviewStoryId]) {
              updateStoryName(interviewStoryId, su.name);
            }
            if (su.stageEntries) {
              Object.entries(su.stageEntries).forEach(([stageId, entryText]) => {
                if (entryText) addStoryEntry(interviewStoryId, stageId, { text: entryText, source: 'atlas-interview' });
              });
            }
          }
        }
        // Save conversation
        const key = `story-interview-${interviewStoryId}`;
        const newMsgs = data.reply ? [...updated, { role: 'assistant', content: data.reply }] : updated;
        saveConversation('persona', key, newMsgs);
      } catch {
        setInterviewMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
      }
      setInterviewLoading(false);
    };

    const handleSynthesis = async (stageId) => {
      setSynthesisLoading(true);
      setSynthesisText(null);
      trackElement('story-forge.my-stories.synthesis' + (stageId ? `.${stageId}` : '.full'));
      try {
        // Gather all entries across all stories for synthesis
        const allEntries = stageId
          ? storyEntries.flatMap(([, s]) => {
              const st = s.stages[stageId];
              return st ? st.entries.map(e => ({ storyName: s.name, text: e.text })) : [];
            })
          : FORGE_STAGES.flatMap(stage =>
              storyEntries.flatMap(([, s]) => {
                const st = s.stages[stage.id];
                return st ? st.entries.map(e => ({ storyName: s.name, stage: stage.label, text: e.text })) : [];
              })
            );
        const res = await apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'story-synthesis', stageId: stageId || 'full', stageData: allEntries }),
        });
        const data = await res.json();
        setSynthesisText(data.synthesis || data.error || 'No synthesis generated.');
      } catch {
        setSynthesisText('Network error. Please try again.');
      }
      setSynthesisLoading(false);
    };

    const handleEditSave = (storyId, stageId) => {
      updateStoryEdited(storyId, stageId, editDraft);
      setEditingStage(null);
      setEditDraft('');
    };

    // Story interview chat overlay
    if (showStoryInterview) {
      return (
        <>
          <MeteorShower active={showMeteors} />
          <CircleNav
            stages={FORGE_STAGES}
            currentStage={currentStage}
            onSelectStage={handleSelectStage}
            clockwise={clockwise}
            onToggleDirection={() => setClockwise(!clockwise)}
            centerLine1="My"
            centerLine2=""
            centerLine3="Stories"
            showAuthor={false}
          />
          <div className="container">
            <div className="story-interview-panel">
              <div className="story-interview-header">
                <h3>Tell Atlas Your Story</h3>
                <button className="forge-change-btn" onClick={() => setShowStoryInterview(false)}>Back to Stories</button>
              </div>
              <div className="chat-messages" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {interviewMessages.length === 0 && (
                  <div className="chat-welcome">
                    Tell me a story from your life. It can be about anything — a transition, a challenge, a transformation. Share it however it comes to you, and I will help you find the mythic pattern within it.
                  </div>
                )}
                {interviewMessages.map((msg, i) => (
                  <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                    <div className="chat-msg-content">{msg.content}</div>
                  </div>
                ))}
                {interviewLoading && (
                  <div className="chat-msg chat-msg-assistant">
                    <div className="chat-msg-content chat-loading">Listening...</div>
                  </div>
                )}
              </div>
              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  value={interviewInput}
                  onChange={e => setInterviewInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInterviewSend(); } }}
                  placeholder="Share your story..."
                  rows={3}
                  disabled={interviewLoading}
                />
                <button className="chat-send" onClick={handleInterviewSend} disabled={interviewLoading || !interviewInput.trim()}>&#10148;</button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <MeteorShower active={showMeteors} />
        <CircleNav
          stages={FORGE_STAGES}
          currentStage={currentStage}
          onSelectStage={handleSelectStage}
          clockwise={clockwise}
          centerLine1="My"
          centerLine2=""
          centerLine3="Stories"
          showAuthor={false}
        />
        {forgeControlsAndPanel}
        {isStage && <h2 className="stage-heading">{FORGE_STAGES.find(s => s.id === currentStage)?.label}</h2>}
        <div className="container">
          <div id="content-container">
            {!isStage ? (
              /* My Journeys — overview of all stories */
              <div className="forge-hub">
                <div className="forge-view-toggle">
                  <button className="forge-change-btn" onClick={() => { setTemplate(null); setCurrentStage('overview'); }}>Change Template</button>
                </div>
                <h3 style={{ marginBottom: '12px' }}>My Journeys</h3>
                {storyEntries.length === 0 ? (
                  <div className="empty-content">
                    <p>No stories yet. Click "Tell a Story" to begin your first personal narrative with Atlas, or select a stage on the wheel to start writing directly.</p>
                  </div>
                ) : (
                  <div className="forge-story-overview">
                    {storyEntries.map(([id, story]) => {
                      const stageCount = Object.values(story.stages || {}).filter(st => st.entries.length > 0).length;
                      return (
                        <div key={id} className="forge-chapter-preview" onClick={() => {
                          setActiveStoryFilter(id);
                          const firstStage = FORGE_STAGES.find(s => story.stages[s.id]?.entries.length > 0);
                          if (firstStage) handleSelectStage(firstStage.id);
                        }}>
                          <h4>{story.name || 'Untitled Story'}</h4>
                          <p>{stageCount} of 8 stages {'\u00B7'} {story.source === 'atlas-interview' ? 'Atlas Interview' : story.source === 'tarot-reading' ? 'Tarot Reading' : 'Manual'}</p>
                          <p style={{ fontSize: '0.8em', opacity: 0.6 }}>{story.updatedAt ? new Date(story.updatedAt).toLocaleDateString() : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="forge-actions">
                  <button className="forge-generate-btn" onClick={handleStartInterview}>+ Tell a Story</button>
                  {storyEntries.length > 0 && (
                    <button
                      className="forge-generate-btn"
                      onClick={() => handleSynthesis(null)}
                      disabled={synthesisLoading}
                      style={{ marginLeft: '10px' }}
                    >
                      {synthesisLoading ? 'Synthesizing...' : 'Archetypal Journey'}
                    </button>
                  )}
                </div>
                {synthesisText && (
                  <div className="forge-story-overview" style={{ marginTop: '20px' }}>
                    <h4>Archetypal Journey</h4>
                    {synthesisText.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}
              </div>
            ) : (
              /* Stage view — stories for this stage */
              <div className="forge-hub">
                {/* Story filter buttons */}
                <div className="forge-view-toggle" style={{ flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    className={`dev-mode-btn ${!activeStoryFilter ? 'active' : ''}`}
                    onClick={() => setActiveStoryFilter(null)}
                  >All</button>
                  {stageStories.map(([id, s]) => (
                    <button
                      key={id}
                      className={`dev-mode-btn ${activeStoryFilter === id ? 'active' : ''}`}
                      onClick={() => setActiveStoryFilter(id)}
                    >{s.name || 'Untitled'}</button>
                  ))}
                  <button
                    className={`dev-mode-btn ${activeStoryFilter === 'archetypal' ? 'active' : ''}`}
                    onClick={() => { setActiveStoryFilter('archetypal'); handleSynthesis(currentStage); }}
                  >Archetypal Journey</button>
                </div>

                {activeStoryFilter === 'archetypal' ? (
                  <div style={{ marginTop: '16px' }}>
                    {synthesisLoading ? (
                      <div className="empty-content">Synthesizing archetypal narrative...</div>
                    ) : synthesisText ? (
                      <div className="forge-story-overview">
                        {synthesisText.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                      </div>
                    ) : (
                      <div className="empty-content">No entries to synthesize for this stage.</div>
                    )}
                  </div>
                ) : filteredStories.length === 0 ? (
                  <div className="empty-content" style={{ marginTop: '16px' }}>
                    <p>No stories have entries for this stage yet.</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px' }}>
                    {filteredStories.map(([id, story]) => {
                      const stage = story.stages[currentStage] || { entries: [], generated: null, edited: null };
                      const isExpanded = expandedStory === id;
                      const isEditing = editingStage?.storyId === id && editingStage?.stageId === currentStage;

                      return (
                        <div key={id} className={`forge-library-card${isExpanded ? ' expanded' : ''}`}>
                          <div className="forge-library-card-header" onClick={() => setExpandedStory(isExpanded ? null : id)} style={{ cursor: 'pointer' }}>
                            <h4 className="forge-library-card-title">{story.name || 'Untitled Story'}</h4>
                            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{stage.entries.length} entries</span>
                          </div>
                          {isExpanded && (
                            <div className="forge-library-card-body">
                              <div className="forge-view-toggle" style={{ marginBottom: '10px' }}>
                                <button className={`dev-mode-btn ${storyViewTab === 'entries' ? 'active' : ''}`} onClick={() => setStoryViewTab('entries')}>Entries</button>
                                <button className={`dev-mode-btn ${storyViewTab === 'generated' ? 'active' : ''}`} onClick={() => setStoryViewTab('generated')}>Generated</button>
                                {!isEditing && (
                                  <button className="dev-mode-btn" onClick={() => {
                                    setEditingStage({ storyId: id, stageId: currentStage });
                                    setEditDraft(stage.edited || stage.generated || stage.entries.map(e => e.text).join('\n\n'));
                                  }}>Edit</button>
                                )}
                              </div>
                              {isEditing ? (
                                <div>
                                  <textarea
                                    className="dev-input"
                                    value={editDraft}
                                    onChange={e => setEditDraft(e.target.value)}
                                    rows={8}
                                  />
                                  <div className="dev-actions">
                                    <button className="dev-save-btn" onClick={() => handleEditSave(id, currentStage)}>Save</button>
                                    <button className="dev-relate-btn" onClick={() => { setEditingStage(null); setEditDraft(''); }}>Cancel</button>
                                  </div>
                                </div>
                              ) : storyViewTab === 'entries' ? (
                                <div className="dev-entries">
                                  {stage.entries.map((entry, i) => (
                                    <div key={i} className="dev-entry">
                                      <p>{entry.text}</p>
                                      <span style={{ fontSize: '0.7em', opacity: 0.5 }}>{entry.source} {'\u00B7'} {new Date(entry.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div>
                                  {stage.edited ? (
                                    stage.edited.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                                  ) : stage.generated ? (
                                    stage.generated.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                                  ) : (
                                    <div className="empty-content">No generated narrative yet. Complete an Atlas interview to generate stage narratives.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stage navigation + Tell a Story */}
                <div className="forge-actions" style={{ marginTop: '16px' }}>
                  <button className="forge-generate-btn" onClick={handleStartInterview}>+ Tell a Story</button>
                </div>
                <div className="forge-stage-nav">
                  {currentIdx > 0 && (
                    <button className="forge-nav-btn" onClick={goPrev}>
                      {'\u2190'} {FORGE_STAGES[currentIdx - 1].label}
                    </button>
                  )}
                  <button className="forge-nav-btn forge-nav-overview" onClick={() => setCurrentStage('overview')}>
                    My Journeys
                  </button>
                  {currentIdx < FORGE_STAGES.length - 1 && (
                    <button className="forge-nav-btn" onClick={goNext}>
                      {FORGE_STAGES[currentIdx + 1].label} {'\u2192'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const isStageView = currentStage !== 'overview' && currentStage !== 'bio';

  return (
    <>
      <MeteorShower active={showMeteors} />
      <CircleNav
        stages={FORGE_STAGES}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        clockwise={clockwise}
        centerLine1="Story"
        centerLine2=""
        centerLine3="Forge"
        showAuthor={false}
        getStageClass={courseworkMode ? (id) => isElementCompleted(`story-forge.stage.${id}`) ? 'cw-completed' : 'cw-incomplete' : undefined}
      />
      {forgeControlsAndPanel}

      {currentLabel && <h2 className="stage-heading">{currentLabel}</h2>}

      <div className="container">
        <div id="content-container">
          {!isStageView ? (
            /* Overview / Hub */
            <div className="forge-hub">
              <div className="forge-view-toggle">
                <button className={`dev-mode-btn ${viewMode === 'write' ? 'active' : ''}`} onClick={() => setViewMode('write')}>Write</button>
                <button className={`dev-mode-btn ${viewMode === 'draft' ? 'active' : ''}`} onClick={() => setViewMode('draft')}>Draft</button>
                <button className={`dev-mode-btn ${viewMode === 'read' ? 'active' : ''}`} onClick={() => setViewMode('read')}>Read</button>
                <button className={`dev-mode-btn ${viewMode === 'library' ? 'active' : ''}`} onClick={() => setViewMode('library')}>Library</button>
              </div>

              {viewMode === 'draft' ? (
                <div className="forge-draft-overview">
                  <h4 className="forge-progress-title">Draft Progress — {TEMPLATE_OPTIONS.find(t => t.id === template)?.label}</h4>
                  <div className="forge-progress-stages">
                    {FORGE_STAGES.map(s => {
                      const hasDraft = forgeDrafts[s.id]?.text;
                      const hasConvo = (draftMessages[s.id] || []).length > 0;
                      return (
                        <button
                          key={s.id}
                          className={`forge-progress-dot ${hasDraft ? 'filled' : hasConvo ? 'partial' : ''}`}
                          onClick={() => handleSelectStage(s.id)}
                          title={`${s.label}${hasDraft ? ' (drafted)' : hasConvo ? ' (in progress)' : ''}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="forge-progress-count">
                    {Object.values(forgeDrafts).filter(d => d?.text).length} of 8 stages drafted
                  </p>
                  <div className="forge-actions">
                    <button
                      className="forge-generate-btn"
                      onClick={handleAssembleNarrative}
                      disabled={Object.values(forgeDrafts).filter(d => d?.text).length < 2 || generating}
                    >
                      {generating ? 'Assembling...' : 'Assemble Full Narrative'}
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className="forge-progress">
                <h4 className="forge-progress-title">Progress — {TEMPLATE_OPTIONS.find(t => t.id === template)?.label}</h4>
                <div className="forge-progress-stages">
                  {FORGE_STAGES.map(s => {
                    const has = stagesWithContent.find(sc => sc.id === s.id);
                    return (
                      <button
                        key={s.id}
                        className={`forge-progress-dot ${has ? 'filled' : ''}`}
                        onClick={() => handleSelectStage(s.id)}
                        title={s.label}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <p className="forge-progress-count">{stagesWithContent.length} of 8 stages</p>
              </div>

              <div className="forge-actions">
                <button
                  className="forge-generate-btn"
                  onClick={() => handleGenerate()}
                  disabled={stagesWithContent.length === 0 || generating}
                >
                  {generating ? 'Forging...' : 'Generate Story'}
                </button>
                <button className="forge-change-btn" onClick={() => { setTemplate(null); setCurrentStage('overview'); }}>
                  Change Template
                </button>
              </div>
              </>
              )}

              {Object.keys(generatedStory).length > 0 && viewMode === 'read' && (
                <div className="forge-story-overview">
                  {FORGE_STAGES.map(s => generatedStory[s.id] ? (
                    <div key={s.id} className="forge-chapter-preview" onClick={() => { handleSelectStage(s.id); }}>
                      <h4>{s.label}</h4>
                      <p>{generatedStory[s.id].substring(0, 150)}...</p>
                    </div>
                  ) : null)}
                </div>
              )}

              {viewMode === 'library' && (
                <div className="forge-library">
                  {getAllWritings().length === 0 ? (
                    <div className="empty-content">No writings saved yet. Explore the site, write in the forge, take journeys, and chat with Atlas to build your library.</div>
                  ) : (
                    getAllWritings().map((item, i) => (
                      <div key={i} className={`forge-library-card${libraryExpanded === i ? ' expanded' : ''}`} onClick={() => setLibraryExpanded(libraryExpanded === i ? null : i)}>
                        <div className="forge-library-card-header">
                          <span className={`forge-library-source ${item.source}`}>{item.source}</span>
                          <h4 className="forge-library-card-title">{item.title}</h4>
                          {item.date && <span className="forge-library-date">{new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                        {libraryExpanded === i ? (
                          <div className="forge-library-card-body">
                            {item.text ? (
                              item.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)
                            ) : item.messages ? (
                              item.messages.slice(-20).map((m, j) => (
                                <div key={j} className={`forge-library-msg ${m.role}`}>
                                  <strong>{m.role === 'user' ? 'You' : 'Atlas'}:</strong> {m.content.substring(0, 500)}
                                </div>
                              ))
                            ) : item.entries ? (
                              item.entries.map((e, j) => <p key={j}>{e.text}</p>)
                            ) : null}
                          </div>
                        ) : (
                          <p className="forge-library-preview">{item.preview}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'write' ? (
            /* Stage — Write Mode */
            <>
              <div className="forge-prompt">
                <p>{FORGE_PROMPTS[template]?.[currentStage]}</p>
              </div>
              <div className="section-content">
                <div className="content-area">
                  <DevelopmentPanel
                    stageLabel={currentLabel}
                    stageKey={`forge-${currentStage}`}
                    entries={forgeEntries}
                    setEntries={setForgeEntries}
                    atlasOpener={FORGE_PROMPTS[template]?.[currentStage]}
                  />
                </div>
              </div>
              <div className="forge-stage-nav">
                {currentIdx > 0 && (
                  <button className="forge-nav-btn" onClick={goPrev}>
                    ← {FORGE_STAGES[currentIdx - 1].label}
                  </button>
                )}
                <button className="forge-nav-btn forge-nav-overview" onClick={() => setCurrentStage('overview')}>
                  Hub
                </button>
                {currentIdx < FORGE_STAGES.length - 1 && (
                  <button className="forge-nav-btn" onClick={goNext}>
                    {FORGE_STAGES[currentIdx + 1].label} →
                  </button>
                )}
              </div>
            </>
          ) : viewMode === 'draft' ? (
            /* Stage — Draft Mode */
            <>
              {/* Collapsible raw material */}
              {(() => {
                const modes = ['noting', 'reflecting', 'creating'];
                const hasRaw = modes.some(m => (forgeEntries[`forge-${currentStage}-${m}`] || []).length > 0);
                return hasRaw ? (
                  <details className="forge-raw-material">
                    <summary>Your raw material for this stage</summary>
                    {modes.map(m => {
                      const entries = forgeEntries[`forge-${currentStage}-${m}`] || [];
                      return entries.length > 0 ? (
                        <div key={m} className="forge-raw-group">
                          <span className="forge-raw-mode">[{m}]</span>
                          {entries.map((e, i) => <p key={i}>{e.text}</p>)}
                        </div>
                      ) : null;
                    })}
                  </details>
                ) : null;
              })()}

              {/* Chat thread */}
              <div className="forge-draft-chat">
                {(draftMessages[currentStage] || []).length === 0 ? (
                  <div className="forge-draft-empty">
                    Start a conversation with Atlas about this stage. Share your thoughts, ideas, or ask for guidance.
                  </div>
                ) : (
                  (draftMessages[currentStage] || []).map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.role}`}>
                      <strong>{msg.role === 'user' ? 'You' : 'Atlas'}:</strong>{' '}
                      {msg.content}
                      {msg.mythicParallel && (
                        <div className="forge-mythic-aside">
                          <strong>{msg.mythicParallel.source}</strong>: {msg.mythicParallel.parallel}
                          <p className="forge-mythic-suggestion">{msg.mythicParallel.suggestion}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {draftLoading && <div className="chat-msg assistant"><em>Atlas is thinking...</em></div>}
                <div ref={draftChatEndRef} />
              </div>

              {/* Input area */}
              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  value={draftInput}
                  onChange={e => setDraftInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDraftSend(); } }}
                  placeholder="Share your thoughts on this stage..."
                  rows={2}
                  disabled={draftLoading}
                />
                <button className="chat-send" onClick={() => handleDraftSend()} disabled={draftLoading || !draftInput.trim()}>Send</button>
              </div>

              {/* Draft this stage button */}
              <div className="forge-actions" style={{ marginTop: '12px' }}>
                <button
                  className="forge-generate-btn"
                  onClick={() => handleDraftSend(true)}
                  disabled={draftLoading}
                >
                  {forgeDrafts[currentStage]?.text ? 'Redraft This Stage' : 'Draft This Stage'}
                </button>
              </div>

              {/* Current draft display */}
              {forgeDrafts[currentStage]?.text && (
                <div className="forge-current-draft">
                  <h4>Current Draft</h4>
                  {forgeDrafts[currentStage].text.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <span className="forge-draft-timestamp">
                    {new Date(forgeDrafts[currentStage].updatedAt).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="forge-stage-nav">
                {currentIdx > 0 && (
                  <button className="forge-nav-btn" onClick={goPrev}>
                    ← {FORGE_STAGES[currentIdx - 1].label}
                  </button>
                )}
                <button className="forge-nav-btn forge-nav-overview" onClick={() => setCurrentStage('overview')}>
                  Hub
                </button>
                {currentIdx < FORGE_STAGES.length - 1 && (
                  <button className="forge-nav-btn" onClick={goNext}>
                    {FORGE_STAGES[currentIdx + 1].label} →
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Stage — Read Mode */
            <>
              {generatedStory[currentStage] ? (
                <>
                  <div className="chapter-scroll">
                    <div className="chapter-content">
                      {generatedStory[currentStage].split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                  <div className="forge-actions" style={{ marginTop: '20px' }}>
                    <button
                      className="forge-generate-btn"
                      onClick={() => handleGenerate(currentStage)}
                      disabled={generating}
                    >
                      {generating ? 'Reforging...' : 'Regenerate Chapter'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-content">
                  Complete your writing and hit Generate Story from the hub to see this chapter.
                </div>
              )}
              <div className="forge-stage-nav">
                {currentIdx > 0 && (
                  <button className="forge-nav-btn" onClick={goPrev}>
                    ← {FORGE_STAGES[currentIdx - 1].label}
                  </button>
                )}
                <button className="forge-nav-btn forge-nav-overview" onClick={() => setCurrentStage('overview')}>
                  Hub
                </button>
                {currentIdx < FORGE_STAGES.length - 1 && (
                  <button className="forge-nav-btn" onClick={goNext}>
                    {FORGE_STAGES[currentIdx + 1].label} →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const NAV_ITEMS = [
  { path: '/', label: 'Creation Story' },
  { path: '/chronosphaera', label: 'Chronosphaera' },
  { path: '/myths', label: 'Mythosphaera' },
  { path: '/mythology-channel', label: 'Mythology Channel' },
  { path: '/mythosophia', label: 'Mythosophia' },
  { path: '/atlas', label: 'Atlas' },
  { path: '/games', label: 'Game Room' },
  { path: '/fellowship', label: 'Fellowship' },
];

const HIDDEN_NAV_ITEMS = [
  { path: '/mentors', label: 'Guild Directory' },
  { path: '/guild', label: 'Guild' },
];

function SiteNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Include hidden nav items only when we're currently on that page
  const visibleItems = [
    ...NAV_ITEMS,
    ...HIDDEN_NAV_ITEMS.filter(h => location.pathname === h.path || location.pathname.startsWith(h.path + '/')),
  ];

  // Label-only overrides: show in the toggle text but not in the dropdown
  const LABEL_OVERRIDES = { '/profile': 'Profile', '/xr': 'VR / XR', '/mentors': 'Guild Directory', '/guild': 'Guild', '/dragon': 'Dragon', '/fallen-starlight': 'Fallen Starlight', '/story-of-stories': 'Story of Stories', '/monomyth': 'Monomyth', '/story-forge': 'Story Forge', '/yellow-brick-road': 'Yellow Brick Road', '/library': 'Library', '/home': 'Home', '/sacred-sites-360': 'Sacred Sites 360', '/mythic-earth': 'Mythic Earth', '/secret-weapon': 'Secret Weapon', '/fellowship': 'Fellowship', '/curated': 'Curated Collection' };
  const pathMatch = (navPath) => navPath === '/' ? location.pathname === '/' : location.pathname === navPath || location.pathname.startsWith(navPath + '/');
  const overrideLabel = LABEL_OVERRIDES[location.pathname]
    || (location.pathname.startsWith('/journey/') && 'Journey')
    || (location.pathname.startsWith('/dragon') && 'Dragon');
  const current = visibleItems.find(n => !n.external && pathMatch(n.path))
    || (overrideLabel ? { label: overrideLabel } : null)
    || NAV_ITEMS[0];

  return (
    <nav className="site-nav">
      <button className="site-nav-toggle" onClick={() => setOpen(!open)}>
        {current.label} <span className="site-nav-arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div className="site-nav-dropdown">
          {visibleItems.map(item => item.external ? (
            <a
              key={item.path}
              className="site-nav-option"
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {item.label} ↗
            </a>
          ) : (
            <Link
              key={item.path}
              className={`site-nav-option${pathMatch(item.path) ? ' active' : ''}`}
              to={item.path}
              onClick={() => { setOpen(false); window.scrollTo(0, 0); }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

const SUBSCRIPTIONS_META = {
  ybr: { id: 'ybr', name: 'Yellow Brick Road', description: 'Interactive journey through the monomyth stages with Atlas as your guide.' },
  forge: {
    id: 'forge',
    name: 'Story Forge',
    description: 'The Story Forge is a mythic story generator powered by the full architecture of the Mythouse \u2014 seven metals, monomyth stages, planetary archetypes, zodiac cycles, and the medicine wheel \u2014 woven together by Atlas, your AI mythologist.',
    features: [
      'Create an original story built on deep mythic structure',
      'Journal your personal hero\u2019s journey as you walk it',
      'Collaborate with Atlas to shape narrative, character, and theme',
    ],
    cta: 'Visit the Subscriptions area of your Profile page to learn more and activate.',
  },
  coursework: { id: 'coursework', name: 'Coursework', description: 'Track your progress through courses, earn ranks and certificates.' },
  'master-key': {
    id: 'master-key',
    name: 'Mythouse Master Key',
    description: 'Everything Mythouse has to offer — all journeys, courses, stories, and the forge.',
    features: [
      'All Yellow Brick Road journeys',
      'Story Forge — write your own myths with AI',
      'Coursework — track progress across 7 courses, earn ranks',
      'Starlight Bundle — Fallen Starlight + Story of Stories',
    ],
    cta: 'Visit your Profile to activate the Master Key.',
  },
};

const PURCHASES_META = {
  'fallen-starlight': {
    id: 'fallen-starlight',
    name: 'Fallen Starlight',
    description: 'The original revelation \u2014 tracing the descent of celestial fire through the seven planetary metals on the Chronosphaera.',
    features: [
      'Overlay the Fallen Starlight narrative ring on the Chronosphaera',
      'Eight stages of the descent of light into matter',
      'Integrated reading experience within the celestial clock',
    ],
    cta: 'Visit the Purchases area of your Profile page to learn more and activate.',
  },
  'story-of-stories': {
    id: 'story-of-stories',
    name: 'Story of Stories',
    description: 'The meta-narrative \u2014 the stories that emerged from the fall of light into matter, told through the Chronosphaera.',
    features: [
      'Overlay the Story of Stories narrative ring on the Chronosphaera',
      'The mythic tradition behind the seven metals',
      'A companion layer to Fallen Starlight',
    ],
    cta: 'Visit the Purchases area of your Profile page to learn more and activate.',
  },
  'medicine-wheel': {
    id: 'medicine-wheel',
    name: 'Medicine Wheel',
    description: 'The medicine wheel — Hyemeyohsts Storm\'s teachings on the sacred hoop and the four directions, overlaid on the Chronosphaera.',
    features: [
      'Overlay the medicine wheel on the Chronosphaera',
      'Explore the four directions and their powers',
      'Based on the teachings of Hyemeyohsts Storm',
    ],
    cta: 'Visit the Purchases area of your Profile page to learn more and activate.',
  },
};

const MASTER_KEY_INCLUDES = ['ybr', 'forge', 'coursework', 'fallen-starlight', 'story-of-stories'];

function SubscriptionGate({ gateInfo, onClose }) {
  const navigate = useNavigate();
  const isPurchase = gateInfo?.type === 'purchase';
  const meta = isPurchase ? PURCHASES_META[gateInfo?.id] : SUBSCRIPTIONS_META[gateInfo?.id];
  if (!meta) return null;
  const includedInMasterKey = MASTER_KEY_INCLUDES.includes(gateInfo?.id);
  return (
    <div className="subscription-gate-overlay" onClick={onClose}>
      <div className="subscription-gate-popup" onClick={e => e.stopPropagation()}>
        <h3 className="subscription-gate-title">{meta.name}</h3>
        <p className="subscription-gate-desc">{meta.description}</p>
        {meta.features && (
          <ul className="subscription-gate-features">
            {meta.features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
        {includedInMasterKey && (
          <p className="subscription-gate-master-key">Also included in the Mythouse Master Key.</p>
        )}
        {meta.cta && (
          <p className="subscription-gate-cta">{meta.cta}</p>
        )}
        <div className="subscription-gate-actions">
          <button className="subscription-gate-primary" onClick={() => { navigate(isPurchase ? '/profile#purchases' : '/profile#subscriptions'); onClose(); }}>
            Go to Subscriptions
          </button>
          <button className="subscription-gate-secondary" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  const { user } = useAuth();
  const { courseworkMode, toggleCourseworkMode } = useCoursework();
  const { forgeMode, setForgeMode } = useStoryForge();
  const { ybrMode, setYbrMode } = useYBRMode();
  const { xrMode, setXrMode } = useXRMode();
  const { hasSubscription, hasPurchase } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [gatePopup, setGatePopup] = useState(null); // { type: 'subscription'|'purchase', id }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const show3D = location.pathname.startsWith('/chronosphaera') && location.pathname !== '/chronosphaera/vr';
  return (
    <>
    <header className="site-header">
      <Link to="/chronosphaera" className="site-header-logo">Mythouse</Link>
      {xrMode && <div id="xr-controls-slot" className="xr-controls-slot" />}
      {user && (
        <div className={`site-header-user${mobileMenuOpen ? ' mobile-expanded' : ''}`}>
          <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '\u2715' : '\u22EF'}
          </button>
          <button
            className={`header-ybr-toggle${ybrMode ? ' active' : ''}`}
            onClick={() => {
              if (!ybrMode && !hasSubscription('ybr')) { setGatePopup({ type: 'subscription', id: 'ybr' }); return; }
              if (!ybrMode) {
                setYbrMode(true);
              } else if (location.pathname !== '/yellow-brick-road') {
                navigate('/yellow-brick-road');
              } else {
                setYbrMode(false);
              }
            }}
            title={ybrMode ? (location.pathname === '/yellow-brick-road' ? 'Turn off Yellow Brick Road' : 'Open Yellow Brick Road') : 'Turn on Yellow Brick Road'}
          >
            <svg viewBox="0 0 20 14" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M1,4 L7,1 L19,1 L13,4 Z" />
              <path d="M1,4 L1,13 L13,13 L13,4" />
              <path d="M13,4 L19,1 L19,10 L13,13" />
              <line x1="7" y1="4" x2="7" y2="13" />
              <line x1="1" y1="8.5" x2="13" y2="8.5" />
              <line x1="4" y1="8.5" x2="4" y2="13" />
              <line x1="10" y1="4" x2="10" y2="8.5" />
            </svg>
          </button>
          <button
            className={`header-forge-toggle${forgeMode ? ' active' : ''}`}
            onClick={() => {
              if (!forgeMode && !hasSubscription('forge')) { setGatePopup({ type: 'subscription', id: 'forge' }); return; }
              if (!forgeMode) {
                setForgeMode(true);
              } else if (location.pathname !== '/story-forge') {
                navigate('/story-forge');
              } else {
                setForgeMode(false);
              }
            }}
            title={forgeMode ? (location.pathname === '/story-forge' ? 'Turn off Story Forge' : 'Open Story Forge') : 'Turn on Story Forge'}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10,2 L10,11" />
              <path d="M7,5 Q10,3 13,5" />
              <path d="M6,11 L14,11" />
              <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
            </svg>
          </button>
          <button
            className={`coursework-toggle${courseworkMode ? ' active' : ''}`}
            onClick={() => {
              if (!courseworkMode && !hasSubscription('coursework')) { setGatePopup({ type: 'subscription', id: 'coursework' }); return; }
              if (courseworkMode) { navigate('/profile'); return; }
              toggleCourseworkMode();
            }}
            title={courseworkMode ? 'View Courses' : 'Coursework'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12 L12 6 L22 12 L12 18 Z" />
              <path d="M6 14 L6 19 C6 19 9 22 12 22 C15 22 18 19 18 19 L18 14" />
              <line x1="22" y1="12" x2="22" y2="18" />
            </svg>
          </button>
          <button
            className={`header-book-toggle${(hasPurchase('fallen-starlight') || hasPurchase('story-of-stories')) ? ' active' : ''}`}
            onClick={() => {
              if (!hasPurchase('fallen-starlight') && !hasPurchase('story-of-stories')) { setGatePopup({ type: 'purchase', id: 'fallen-starlight' }); return; }
              navigate('/chronosphaera');
            }}
            title={(hasPurchase('fallen-starlight') || hasPurchase('story-of-stories')) ? 'Fallen Starlight' : 'Unlock Fallen Starlight'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M12 6 L10.8 9.2 L7.5 9.2 L10.1 11.3 L9.1 14.5 L12 12.5 L14.9 14.5 L13.9 11.3 L16.5 9.2 L13.2 9.2 Z" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button
            className={`header-xr-toggle${xrMode ? ' active' : ''}`}
            onClick={() => {
              if (!xrMode) {
                setXrMode(true);
              } else if (location.pathname !== '/xr') {
                navigate('/xr');
              } else {
                setXrMode(false);
              }
            }}
            title={xrMode ? (location.pathname === '/xr' ? 'Turn off XR Mode' : 'Open XR Experiences') : 'VR / XR'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="7" width="22" height="11" rx="3" />
              <circle cx="8" cy="12.5" r="2.5" />
              <circle cx="16" cy="12.5" r="2.5" />
              <path d="M10.5 12.5 Q12 15 13.5 12.5" />
            </svg>
          </button>
          <button
            className="header-store-toggle"
            onClick={() => navigate('/curated')}
            title="Curated Collection"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l1.5-5h15L21 9" />
              <path d="M3 9h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
              <path d="M7.5 9 C7.5 11 5.5 11 3 9" />
              <path d="M7.5 9 C7.5 11 9.5 11 12 9" />
              <path d="M16.5 9 C16.5 11 14.5 11 12 9" />
              <path d="M16.5 9 C16.5 11 18.5 11 21 9" />
            </svg>
          </button>
          <Link to="/profile" className="site-header-profile" title="Profile">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      )}
    </header>
    {gatePopup && <SubscriptionGate gateInfo={gatePopup} onClose={() => setGatePopup(null)} />}
  </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-icons">
        <a href="https://www.instagram.com/_mythouse_/" target="_blank" rel="noopener noreferrer" className="site-footer-icon" title="Instagram">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
          </svg>
        </a>
        <a href="https://www.facebook.com/Mythouse.org" target="_blank" rel="noopener noreferrer" className="site-footer-icon" title="Facebook">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
          </svg>
        </a>
        <a href="https://www.youtube.com/@themythologychannel8755" target="_blank" rel="noopener noreferrer" className="site-footer-icon" title="YouTube">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
          </svg>
        </a>
      </div>
      <div className="site-footer-copyright">
        <p>&copy; 2026 Mythouse. All rights reserved.</p>
        <p>Content may not be reproduced, distributed, or transmitted without written permission.</p>
        <p>All content, images, and materials are the intellectual property of Mythouse.</p>
      </div>
    </footer>
  );
}

function MythosophiaPage() {
  return (
    <div className="mythosophia-page">
      <iframe
        src="https://www.mythouse.org/mythosophia"
        title="Mythosophia"
        className="mythosophia-iframe"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
  if (!user || user.email !== adminEmail) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--accent-ember)', marginBottom: 12 }}>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  return children;
}

function CourseCompletionPopup() {
  const { newlyCompleted, dismissCompletion } = useCoursework();
  const [showShare, setShowShare] = useState(false);
  if (!newlyCompleted) return null;
  return (
    <>
      <div className="course-completion-overlay" onClick={dismissCompletion}>
        <div className="course-completion-panel" onClick={e => e.stopPropagation()}>
          <span className="course-completion-star">{'\u2B50'}</span>
          <h2 className="course-completion-title">Congratulations!</h2>
          <p className="course-completion-name">
            You have completed all the requirements of <strong>{newlyCompleted.name}</strong>.
          </p>
          <p className="course-completion-cert">
            Your certificate is now available in your profile page.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="course-completion-btn" onClick={dismissCompletion}>Continue</button>
            <button className="fellowship-share-btn" onClick={() => setShowShare(true)}>Share with Fellows</button>
          </div>
        </div>
      </div>
      {showShare && (
        <ShareCompletionModal
          completionType="course"
          completionId={newlyCompleted.id}
          completionLabel={newlyCompleted.name}
          completionData={{ courseId: newlyCompleted.id, courseName: newlyCompleted.name }}
          onClose={() => setShowShare(false)}
          onPosted={dismissCompletion}
        />
      )}
    </>
  );
}

function renderLegalDocumentInline(text) {
  if (!text) return null;
  return text.trim().split('\n').map((line, i) => {
    const trimmed = line.trimEnd();
    if (!trimmed) return <br key={i} />;
    if (/^MYTHOUSE\s/.test(trimmed)) return <h3 key={i} className="mentor-contract-doc-title">{trimmed}</h3>;
    if (/^\d+\.\s+[A-Z]/.test(trimmed)) return <h4 key={i} className="mentor-contract-doc-section">{trimmed}</h4>;
    if (/^\d+\.\d+\s/.test(trimmed)) return <p key={i} className="mentor-contract-doc-subsection">{trimmed}</p>;
    if (/^- /.test(trimmed)) return <li key={i} className="mentor-contract-doc-bullet">{trimmed.slice(2)}</li>;
    if (/^Last Updated/.test(trimmed)) return <p key={i} className="mentor-contract-doc-date">{trimmed}</p>;
    return <p key={i} className="mentor-contract-doc-para">{trimmed}</p>;
  });
}

function MentorContractPopup() {
  const { mentorData, loaded: profileLoaded, acceptMentorContract } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  const show = profileLoaded && mentorData?.status === 'approved' && !mentorData?.mentorContractAccepted && !dismissed;

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => { if (e.key === 'Escape') setDismissed(true); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show]);

  if (!show) return null;

  return (
    <div className="mentor-contract-overlay" onClick={() => setDismissed(true)}>
      <div className="mentor-contract-panel" onClick={e => e.stopPropagation()}>
        <button className="mentor-contract-close" onClick={() => setDismissed(true)} aria-label="Close">&times;</button>
        <h2 className="mentor-contract-heading">Mentor Agreement</h2>
        <p className="mentor-contract-subtitle">Please review and accept the agreement below to proceed with your mentor activation.</p>
        <div className="mentor-contract-body">
          {renderLegalDocumentInline(LEGAL_DOCUMENTS['mentor-agreement'])}
        </div>
        <div className="mentor-contract-actions">
          <button className="mentor-contract-accept-btn" onClick={acceptMentorContract}>I Accept</button>
        </div>
      </div>
    </div>
  );
}

const LAST_PATH_KEY = 'mythouse_last_path';
const LAST_PATH_MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAtlas = location.pathname === '/atlas';
  const { courseworkMode } = useCoursework();
  const [ybrHeader, setYbrHeader] = useState({ active: false, toggle: null });
  // Restore last path on mount (only if landing on home and path is recent)
  const hasRestored = useRef(false);
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    if (location.pathname !== '/') return; // only redirect from home
    try {
      const raw = localStorage.getItem(LAST_PATH_KEY);
      if (!raw) return;
      const { path, ts } = JSON.parse(raw);
      if (path && path !== '/' && Date.now() - ts < LAST_PATH_MAX_AGE) {
        navigate(path, { replace: true });
      }
    } catch { /* ignore corrupt data */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save current path on every navigation
  useEffect(() => {
    try {
      localStorage.setItem(LAST_PATH_KEY, JSON.stringify({ path: location.pathname, ts: Date.now() }));
    } catch { /* storage full or unavailable */ }
  }, [location.pathname]);
  const [forgeMode, _setForgeMode] = useState(() => {
    try { return localStorage.getItem('mythouse_forge_mode') === '1'; } catch { return false; }
  });
  const setForgeMode = useCallback((v) => {
    const val = typeof v === 'function' ? v(forgeMode) : v;
    _setForgeMode(val);
    try { localStorage.setItem('mythouse_forge_mode', val ? '1' : '0'); } catch {}
  }, [forgeMode]);

  const [ybrMode, _setYbrMode] = useState(() => {
    try { return localStorage.getItem('mythouse_ybr_mode') === '1'; } catch { return false; }
  });
  const setYbrMode = useCallback((v) => {
    const val = typeof v === 'function' ? v(ybrMode) : v;
    _setYbrMode(val);
    try { localStorage.setItem('mythouse_ybr_mode', val ? '1' : '0'); } catch {}
  }, [ybrMode]);

  const [xrMode, _setXrMode] = useState(() => {
    try { return localStorage.getItem('mythouse_xr_mode') === '1'; } catch { return false; }
  });
  const setXrMode = useCallback((v) => {
    const val = typeof v === 'function' ? v(xrMode) : v;
    _setXrMode(val);
    try { localStorage.setItem('mythouse_xr_mode', val ? '1' : '0'); } catch {}
  }, [xrMode]);

  return (
    <StoryForgeContext.Provider value={{ forgeMode, setForgeMode }}>
    <YBRModeContext.Provider value={{ ybrMode, setYbrMode }}>
    <XRModeContext.Provider value={{ xrMode, setXrMode }}>
    <YBRHeaderContext.Provider value={{ ...ybrHeader, register: setYbrHeader }}>
    <AtlasContextProvider>
    <div className={`app${courseworkMode ? ' cw-mode' : ''}`}>
      <SiteHeader />
      <SiteNav />
      <CourseCompletionPopup />
      <MentorContractPopup />
      <Routes>
        <Route path="/" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><DiscoverStarlightPage /></Suspense>} />
        <Route path="/home" element={<MeteorSteelHome />} />
        <Route path="/chronosphaera/vr" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" />Loading 3D...</div>}><ChronosphaeraVRPage /></Suspense>} />
        <Route path="/chronosphaera/*" element={<ChronosphaeraPage />} />
        {/* Redirects from old /metals paths */}
        <Route path="/metals/vr" element={<Navigate to="/chronosphaera/vr" replace />} />
        <Route path="/metals/*" element={<Navigate to="/chronosphaera" replace />} />
        <Route path="/fallen-starlight" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><FallenStarlightPage /></Suspense>} />
        <Route path="/story-forge" element={<StoryForgeHome />} />
        <Route path="/yellow-brick-road" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><YellowBrickRoadPage /></Suspense>} />
        <Route path="/xr" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><XRPage /></Suspense>} />
        <Route path="/sacred-sites-360" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><SacredSites360Page /></Suspense>} />
        <Route path="/monomyth" element={<MonomythPage />} />
        <Route path="/mythology-channel" element={<MythologyChannelPage />} />
        <Route path="/games/*" element={<GamesPage />} />
        <Route path="/mythology-channel/:showId" element={<MythologyChannelPage />} />
        <Route path="/mythosophia" element={<MythosophiaPage />} />
        <Route path="/profile" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><ProfilePage /></Suspense>} />
        <Route path="/atlas" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><AtlasPage /></Suspense>} />
        <Route path="/journey/:journeyId" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" />Loading Journey...</div>}><OuroborosJourneyPage /></Suspense>} />
        <Route path="/library" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><MythSalonLibraryPage /></Suspense>} />
        <Route path="/story-of-stories" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><StoryOfStoriesPage /></Suspense>} />
        <Route path="/treasures" element={<Navigate to="/myths/treasures" replace />} />
        <Route path="/myths/*" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><MythsPage /></Suspense>} />
        <Route path="/mythic-earth" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><MythicEarthPage /></Suspense>} />
        <Route path="/mentors" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><MentorDirectoryPage /></Suspense>} />
        <Route path="/guild" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><GuildPage /></Suspense>} />
        <Route path="/discover" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><DiscoverPage /></Suspense>} />
        <Route path="/discover/starlight" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><DiscoverStarlightPage /></Suspense>} />
        <Route path="/secret-weapon" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><SecretWeaponPage /></Suspense>} />
        <Route path="/fellowship" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><FellowshipPage /></Suspense>} />
        <Route path="/curated" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><CuratedProductsPage /></Suspense>} />
        <Route path="/matching" element={<Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" /></div>}><MatchingPage /></Suspense>} />
        <Route path="/feed" element={<Navigate to="/fellowship" replace />} />
        {/* Redirect legacy /app routes to /fellowship */}
        <Route path="/app/*" element={<Navigate to="/fellowship" replace />} />
        <Route path="/dragon/*" element={<RequireAdmin><Suspense fallback={<div className="celestial-loading"><span className="celestial-loading-spinner" />Loading Admin...</div>}><AdminPage /></Suspense></RequireAdmin>} />
      </Routes>
      {!isAtlas && <SiteFooter />}
      {!isAtlas && <ChatPanel />}
    </div>
    </AtlasContextProvider>
    </YBRHeaderContext.Provider>
    </XRModeContext.Provider>
    </YBRModeContext.Provider>
    </StoryForgeContext.Provider>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="celestial-loading" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <span className="celestial-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <FamilyProvider>
    <FriendsProvider>
    <FriendRequestsProvider>
    <FellowshipProvider>
    <ScopeProvider>
    <CourseworkProvider>
      <WritingsProvider>
        <ProfileProvider>
          <MatchRequestsProvider>
          <MultiplayerProvider>
            <TraditionsProvider>
            <CreationsProvider>
            <StoryBookProvider>
            <GenealogyProvider>
            <Routes>
              <Route path="*" element={<AppContent />} />
            </Routes>
            </GenealogyProvider>
            </StoryBookProvider>
            </CreationsProvider>
            </TraditionsProvider>
          </MultiplayerProvider>
          </MatchRequestsProvider>
        </ProfileProvider>
      </WritingsProvider>
    </CourseworkProvider>
    </ScopeProvider>
    </FellowshipProvider>
    </FriendRequestsProvider>
    </FriendsProvider>
    </FamilyProvider>
  );
}

export default App;
