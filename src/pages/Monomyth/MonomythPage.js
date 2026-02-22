import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import CircleNav from '../../components/CircleNav';
import DevelopmentPanel from '../../components/DevelopmentPanel';
import TextBlock from '../../components/chronosphaera/TextBlock';
import useWheelJourney from '../../hooks/useWheelJourney';
import WheelJourneyPanel from '../../components/WheelJourneyPanel';
import StageTest from '../../components/StageTest';
import useTest from '../../hooks/useTest';
import { getSectionQuestions } from '../../coursework/tests';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useWritings } from '../../writings/WritingsContext';
import { useYBRHeader, useStoryForge, useYBRMode } from '../../App';
import use360Media from '../../hooks/use360Media';
import monomythProse from '../../data/monomyth.json';
import stageOverviews from '../../data/stageOverviews.json';
import theoristsData from '../../data/monomythTheorists.json';
import mythsData from '../../data/monomythMyths.json';
import psychlesData from '../../data/monomythPsychles.json';
import depthData from '../../data/monomythDepth.json';
import filmsData from '../../data/monomythFilms.json';
import worldData from '../../data/normalOtherWorld.json';
import { MONOMYTH_STAGES, THEORIST_TO_MODEL, CYCLE_TO_MODEL, getModelById, getCycleById, INNER_RING_SETS, getInnerRingModel } from '../../data/monomythConstants';
import './MonomythPage.css';

const TrailOverlay = lazy(() => import('../../components/TrailOverlay'));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'theorists', label: 'Theorists' },
  { id: 'experts', label: 'Experts' },
  { id: 'history', label: 'History' },
  { id: 'myths', label: 'Myths' },
  { id: 'films', label: 'Films' },
];

const THEORIST_GROUPS = [
  { id: 'mythological', label: 'Mythological' },
  { id: 'screenplay', label: 'Screenplay' },
];

function OverviewTab({ stageId }) {
  const overview = stageOverviews[stageId];
  const prose = monomythProse[stageId];
  const symbols = depthData[stageId]?.symbols;

  return (
    <div className="tab-content">
      {overview && (
        <div className="mono-overview-block">
          <TextBlock text={overview} />
        </div>
      )}
      {prose && (
        <div className="mono-prose-block">
          <TextBlock text={prose} />
        </div>
      )}
      {symbols && (
        <div className="mono-card mono-symbols-card">
          <h4 className="mono-card-name">Symbols</h4>
          <div className="mono-symbols-grid">
            {Object.entries(symbols).map(([key, val]) => (
              <div key={key} className="mono-symbol-item">
                <span className="mono-symbol-label">{key}</span>
                <span className="mono-symbol-value">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TheoristsTab({ stageId, activeGroup, onSelectModel, selectedModelId }) {
  const stageData = theoristsData[stageId];
  if (!stageData) return <p className="chrono-empty">No theorist data available.</p>;

  const group = stageData[activeGroup];
  if (!group) return <p className="chrono-empty">No {activeGroup} theorists for this stage.</p>;

  const depthPsych = depthData[stageId]?.depth;

  return (
    <div className="tab-content">
      {Object.entries(group).map(([key, t]) => {
        const hasModel = !!THEORIST_TO_MODEL[key];
        const isActive = hasModel && selectedModelId === THEORIST_TO_MODEL[key];
        return (
        <div
          key={key}
          className={`mono-card${hasModel ? ' mono-card-clickable' : ''}${isActive ? ' mono-card-model-active' : ''}`}
          onClick={hasModel ? () => onSelectModel(key) : undefined}
        >
          <h4 className="mono-card-name">{t.name}{hasModel && <span className="mono-model-icon">{isActive ? ' \u25C9' : ' \u25CE'}</span>}</h4>
          <h5 className="mono-card-concept">{t.concept}</h5>
          <p>{t.description}</p>
          {key === 'jung' && activeGroup === 'mythological' && depthPsych && (
            <>
              <p>{depthPsych.description}</p>
              {depthPsych.concepts && (
                <p className="attr-list">{depthPsych.concepts.join(' · ')}</p>
              )}
            </>
          )}
        </div>
      ); })}
    </div>
  );
}

function ExpertsTab({ stageId, onSelectModel, selectedModelId }) {
  const stageData = theoristsData[stageId];
  if (!stageData) return <p className="chrono-empty">No expert data available.</p>;

  const group = stageData.screenplay;
  if (!group) return <p className="chrono-empty">No screenplay experts for this stage.</p>;

  return (
    <div className="tab-content">
      {Object.entries(group).map(([key, t]) => {
        const hasModel = !!THEORIST_TO_MODEL[key];
        const isActive = hasModel && selectedModelId === THEORIST_TO_MODEL[key];
        return (
          <div
            key={key}
            className={`mono-card${hasModel ? ' mono-card-clickable' : ''}${isActive ? ' mono-card-model-active' : ''}`}
            onClick={hasModel ? () => onSelectModel(key) : undefined}
          >
            <h4 className="mono-card-name">{t.name}{hasModel && <span className="mono-model-icon">{isActive ? ' \u25C9' : ' \u25CE'}</span>}</h4>
            <h5 className="mono-card-concept">{t.concept}</h5>
            <p>{t.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab({ stageId }) {
  const philosophy = depthData[stageId]?.philosophy;
  if (!philosophy) return <p className="chrono-empty">No history data available.</p>;

  return (
    <div className="tab-content">
      <div className="mono-card">
        <h4 className="mono-card-name">{philosophy.title}</h4>
        <p>{philosophy.description}</p>
        {philosophy.themes && (
          <p className="attr-list">{philosophy.themes.join(' · ')}</p>
        )}
      </div>
    </div>
  );
}

function MythsTab({ stageId }) {
  const stageData = mythsData[stageId];
  if (!stageData) return <p className="chrono-empty">No myth data available.</p>;

  const entries = Object.values(stageData);

  return (
    <div className="tab-content">
      {entries.map((m) => (
        <div key={m.title} className="mono-card">
          <span className="mono-card-tradition">{m.tradition}</span>
          <h4 className="mono-card-name">{m.title}</h4>
          <p>{m.description}</p>
        </div>
      ))}
    </div>
  );
}

function FilmsTab({ stageId }) {
  const stageData = filmsData[stageId];
  if (!stageData) return <p className="chrono-empty">No film data available.</p>;

  const entries = Object.values(stageData);

  return (
    <div className="tab-content">
      {entries.map((f) => (
        <div key={f.title} className="mono-card">
          <span className="mono-card-tradition">{f.year}</span>
          <h4 className="mono-card-name">{f.title}</h4>
          <p>{f.description}</p>
        </div>
      ))}
    </div>
  );
}

const PSYCHLE_KEY_TO_CYCLE = {
  solarDay: 'Solar Day',
  lunarMonth: 'Lunar Month',
  solarYear: 'Solar Year',
  lifeDeath: 'Mortality',
  procreation: 'Procreation',
  wakingDreaming: 'Wake & Sleep',
};

function CyclesTab({ stageId, onSelectCycle, selectedModelId }) {
  const stageData = psychlesData[stageId];
  if (!stageData) return <p className="chrono-empty">No cycle data available.</p>;

  const { stageName, summary, cycles } = stageData;

  return (
    <div className="tab-content">
      {stageName && <h4>{stageName}</h4>}
      {summary && <p className="mono-summary">{summary}</p>}
      {cycles && Object.entries(cycles).map(([key, c]) => {
        const cycleKey = PSYCHLE_KEY_TO_CYCLE[key];
        const cycleId = cycleKey ? CYCLE_TO_MODEL[cycleKey] : null;
        const hasCycle = !!cycleId;
        const isActive = hasCycle && selectedModelId === cycleId;
        return (
        <div
          key={key}
          className={`mono-card${hasCycle ? ' mono-card-clickable' : ''}${isActive ? ' mono-card-model-active' : ''}`}
          onClick={hasCycle && onSelectCycle ? () => onSelectCycle(cycleKey) : undefined}
        >
          <h5 className="mono-card-concept">{c.label}{hasCycle && <span className="mono-model-icon">{isActive ? ' \u25C9' : ' \u25CE'}</span>}</h5>
          <span className="mono-card-tradition">{c.phase}</span>
          <p>{c.description}</p>
        </div>
      ); })}
    </div>
  );
}

function GlobalOverview() {
  return (
    <div className="tab-content">
      <div className="mono-overview-block">
        <TextBlock text={stageOverviews.overview} />
      </div>
    </div>
  );
}

function buildWorldTabs(worldKey) {
  const tabs = [{ id: 'overview', label: 'Overview' }];
  if (worldKey === 'normal') tabs.push({ id: 'wasteland', label: 'Wasteland' });
  if (worldKey === 'other') {
    tabs.push({ id: 'dimensions', label: 'Dimensions' });
    tabs.push({ id: 'dream', label: 'Dream' });
  }
  if (worldKey === 'threshold') {
    tabs.push({ id: 'adze', label: 'The Adze' });
    tabs.push({ id: 'guardians', label: 'Guardians' });
    tabs.push({ id: 'motifs', label: 'Motifs' });
  }
  tabs.push({ id: 'cycles', label: 'Cycles' });
  if (worldKey !== 'threshold') tabs.push({ id: 'theorists', label: 'Theorists' });
  if (worldKey === 'other') tabs.push({ id: 'myths', label: 'Myths' });
  if (worldKey !== 'threshold') tabs.push({ id: 'films', label: 'Films' });
  return tabs;
}

function WorldContent({ worldKey, onSelectModel, onSelectCycle, selectedModelId, videoUrl, onPlayVideo, onCloseVideo }) {
  const [activeTab, setActiveTab] = useState('overview');
  const data = worldKey === 'normal' ? worldData.normalWorld : worldKey === 'other' ? worldData.otherWorld : worldData.threshold;
  const tabs = buildWorldTabs(worldKey);
  const thresholdPlaylist = 'PLX31T_KS3jtpSJ1X0ivWv1cuxJk7_FEgh';

  return (
    <div className="metal-detail-panel">
      <h3 className="world-title">{data.title}</h3>
      <p className="world-subtitle">{data.subtitle}</p>

      <div className="metal-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {worldKey === 'threshold' && (
          <button
            className={`metal-tab playlist-tab${videoUrl ? ' active' : ''}`}
            title="Watch Threshold playlist"
            onClick={() => {
              if (videoUrl) {
                onCloseVideo();
              } else {
                onPlayVideo(`https://www.youtube.com/embed/videoseries?list=${thresholdPlaylist}&autoplay=1`);
              }
            }}
          >
            {videoUrl ? '\u25A0' : '\u25B6'}
          </button>
        )}
      </div>

      <div className="metal-content-scroll">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <p className="mono-summary">{data.description}</p>
            {data.overview && Object.entries(data.overview).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
            {data.stages && (
              <div className="mono-card">
                <h5 className="mono-card-concept">By Stage</h5>
                {Object.entries(data.stages).map(([stageId, text]) => {
                  const stage = MONOMYTH_STAGES.find(s => s.id === stageId);
                  return (
                    <div key={stageId} className="world-stage-item">
                      <span className="mono-card-tradition">{stage?.label || stageId}</span>
                      <p>{text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'wasteland' && data.wasteland && (
          <div className="tab-content">
            {Object.entries(data.wasteland).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'dimensions' && data.dimensions && (
          <div className="tab-content">
            {Object.entries(data.dimensions).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'dream' && data.dream && (
          <div className="tab-content">
            {Object.entries(data.dream).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'adze' && data.adze && (
          <div className="tab-content">
            {Object.entries(data.adze).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'guardians' && data.guardians && (
          <div className="tab-content">
            {Object.entries(data.guardians).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'motifs' && data.motifs && (
          <div className="tab-content">
            {Object.entries(data.motifs).map(([key, text]) => (
              <div key={key} className="mono-card">
                <h5 className="mono-card-concept">{key}</h5>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'cycles' && data.cycles && (
          <div className="tab-content">
            {Object.entries(data.cycles).map(([key, text]) => {
              const cycleId = CYCLE_TO_MODEL[key];
              const hasCycle = !!cycleId;
              const isActive = hasCycle && selectedModelId === cycleId;
              return (
              <div
                key={key}
                className={`mono-card${hasCycle ? ' mono-card-clickable' : ''}${isActive ? ' mono-card-model-active' : ''}`}
                onClick={hasCycle ? () => onSelectCycle(key) : undefined}
              >
                <h5 className="mono-card-concept">{key}{hasCycle && <span className="mono-model-icon">{isActive ? ' \u25C9' : ' \u25CE'}</span>}</h5>
                <p>{text}</p>
              </div>
            ); })}
          </div>
        )}
        {activeTab === 'theorists' && data.theorists && (
          <div className="tab-content">
            {Object.entries(data.theorists).map(([key, t]) => {
              const hasModel = !!THEORIST_TO_MODEL[key];
              const isActive = hasModel && selectedModelId === THEORIST_TO_MODEL[key];
              return (
              <div
                key={key}
                className={`mono-card${hasModel ? ' mono-card-clickable' : ''}${isActive ? ' mono-card-model-active' : ''}`}
                onClick={hasModel ? () => onSelectModel(key) : undefined}
              >
                <h4 className="mono-card-name">{t.name}{hasModel && <span className="mono-model-icon">{isActive ? ' \u25C9' : ' \u25CE'}</span>}</h4>
                <p>{t.description}</p>
              </div>
            ); })}
          </div>
        )}
        {activeTab === 'myths' && data.myths && (
          <div className="tab-content">
            {Object.entries(data.myths).map(([key, m]) => (
              <div key={key} className="mono-card">
                <span className="mono-card-tradition">{m.tradition}</span>
                <h4 className="mono-card-name">{m.title}</h4>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'films' && (
          <div className="tab-content">
            {Object.entries(data.films).map(([key, f]) => (
              <div key={key} className="mono-card">
                <span className="mono-card-tradition">{f.year}</span>
                <h4 className="mono-card-name">{f.title}</h4>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonomythPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeGroup, setActiveGroup] = useState('mythological');
  const [devEntries, setDevEntries] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);
  const [activeWorld, setActiveWorld] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [ybrAutoStart, setYbrAutoStart] = useState(false);
  const [introAnim, setIntroAnim] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);

  const journey = useWheelJourney('monomyth', MONOMYTH_STAGES);
  const { getSlotsByPrefix, hasAnySlots } = use360Media();
  const { forgeMode, setForgeMode } = useStoryForge();
  const { ybrMode, setYbrMode } = useYBRMode();
  const { trackElement, trackTime, isElementCompleted, courseworkMode, toggleCourseworkMode } = useCoursework();
  const { notesData, saveNotes, loaded: writingsLoaded } = useWritings();

  // Test state — questions come from the coursework test registry
  const stageQuestions = getSectionQuestions('monomyth-explorer', currentStage);
  const testCompleted = isElementCompleted(`monomyth.test.${currentStage}`);
  const test = useTest({ questions: stageQuestions, alreadyCompleted: testCompleted });

  // Load dev entries from persisted notes
  useEffect(() => {
    if (writingsLoaded && notesData.entries) {
      const relevant = {};
      Object.entries(notesData.entries).forEach(([key, val]) => {
        if (key.startsWith('monomyth-')) relevant[key] = val;
      });
      if (Object.keys(relevant).length > 0) setDevEntries(prev => ({ ...relevant, ...prev }));
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save dev entries on change
  const prevDevEntries = useRef(devEntries);
  useEffect(() => {
    if (!writingsLoaded) return;
    if (prevDevEntries.current === devEntries) return;
    prevDevEntries.current = devEntries;
    Object.entries(devEntries).forEach(([key, val]) => {
      saveNotes(key, val);
    });
  }, [devEntries, writingsLoaded, saveNotes]);

  // Track page visit
  useEffect(() => {
    trackElement('monomyth.page.visited');
  }, [trackElement]);

  // Track time spent on current tab+stage
  const timeRef = useRef({ tab: null, stage: null, start: null });
  useEffect(() => {
    // Flush previous timer
    const prev = timeRef.current;
    if (prev.tab && prev.stage && prev.start) {
      const elapsed = Math.round((Date.now() - prev.start) / 1000);
      if (elapsed >= 1) {
        trackTime(`monomyth.${prev.tab}.${prev.stage}`, elapsed);
      }
    }
    // Start new timer
    timeRef.current = { tab: activeTab, stage: currentStage, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      if (cur.tab && cur.stage && cur.start) {
        const elapsed = Math.round((Date.now() - cur.start) / 1000);
        if (elapsed >= 1) {
          trackTime(`monomyth.${cur.tab}.${cur.stage}`, elapsed);
        }
      }
    };
  }, [activeTab, currentStage, trackTime]);

  // Track test completion
  useEffect(() => {
    if (test.isFinished && !testCompleted && stageQuestions.length > 0) {
      trackElement(`monomyth.test.${currentStage}`);
    }
  }, [test.isFinished, testCompleted, currentStage, stageQuestions.length, trackElement]);

  // Reset test when stage changes
  useEffect(() => { test.reset(); }, [currentStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play YBR light-up animation on page open
  useEffect(() => {
    const t = setTimeout(() => setIntroAnim(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleYBRToggle = useCallback(() => {
    if (journey.active) {
      journey.exitGame();
    } else {
      journey.startGame();
    }
  }, [journey]);

  // Register YBR toggle with the site header
  const { register: registerYBR } = useYBRHeader();
  useEffect(() => {
    registerYBR({ active: journey.active, toggle: handleYBRToggle });
    return () => registerYBR({ active: false, toggle: null });
  }, [journey.active, handleYBRToggle, registerYBR]);

  // When journey advances to a new stage, auto-select it on the wheel
  useEffect(() => {
    if (journey.active && journey.currentStopIndex >= 0 && journey.currentStopIndex < MONOMYTH_STAGES.length) {
      setCurrentStage(MONOMYTH_STAGES[journey.currentStopIndex].id);
      setActiveWorld(null);
    }
  }, [journey.active, journey.currentStopIndex]);

  const handleSelectModel = useCallback((theoristKey) => {
    const modelId = THEORIST_TO_MODEL[theoristKey];
    if (!modelId) return;
    const model = getModelById(modelId);
    if (!model) return;
    trackElement(`monomyth.theorists.${currentStage}.${theoristKey}`);
    setSelectedModel(prev => prev?.id === model.id ? null : model);
  }, [trackElement, currentStage]);

  const handleSelectCycle = useCallback((cycleKey) => {
    const cycleId = CYCLE_TO_MODEL[cycleKey];
    if (!cycleId) return;
    const cycle = getCycleById(cycleId);
    if (!cycle) return;
    trackElement(`monomyth.cycles.${currentStage}.${cycleKey}`);
    setSelectedModel(prev => prev?.id === cycle.id ? null : cycle);
  }, [trackElement, currentStage]);

  const handleSelectRingItem = useCallback((tab, itemId) => {
    const model = getInnerRingModel(tab, itemId);
    if (!model) return;
    trackElement(`monomyth.ring.${tab}.${itemId}`);
    setSelectedModel(prev => prev?.id === model.id ? null : model);
  }, [trackElement]);

  const ringKey = activeTab === 'theorists' ? activeGroup : activeTab;
  console.log('[RING DEBUG]', { activeTab, activeGroup, ringKey, setLength: (INNER_RING_SETS[ringKey] || []).length, items: (INNER_RING_SETS[ringKey] || []).map(i => i.id) });
  const selectorRing = (INNER_RING_SETS[ringKey] || []).map(item => ({
    ...item,
    active: selectedModel?.id === item.id || selectedModel?.id === `myth-${item.id}` || selectedModel?.id === `film-${item.id}`,
  }));

  // Deep link from Atlas navigation
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    const theoristParam = searchParams.get('theorist');
    const cycleParam = searchParams.get('cycle');
    const worldParam = searchParams.get('world');
    const journeyParam = searchParams.get('journey');

    if (journeyParam === 'true') {
      setYbrAutoStart(true);
    } else if (worldParam && ['normal', 'other', 'threshold'].includes(worldParam)) {
      setActiveWorld(worldParam);
      setCurrentStage('overview');
    } else if (stageParam && MONOMYTH_STAGES.find(s => s.id === stageParam)) {
      setCurrentStage(stageParam);
      setActiveWorld(null);
      if (cycleParam) {
        setActiveTab('cycles');
        setTimeout(() => handleSelectCycle(cycleParam), 150);
      } else if (theoristParam) {
        setActiveTab('theorists');
        setTimeout(() => handleSelectModel(theoristParam), 150);
      } else {
        setActiveTab('overview');
      }
    } else if (cycleParam) {
      // Cycle-only link (no stage): pick first stage, show cycles tab, activate cycle
      setCurrentStage('golden-age');
      setActiveWorld(null);
      setActiveTab('cycles');
      setTimeout(() => handleSelectCycle(cycleParam), 150);
    } else if (theoristParam) {
      // Theorist-only link (no stage): pick first stage, show theorists tab, activate model
      setCurrentStage('golden-age');
      setActiveWorld(null);
      setActiveTab('theorists');
      setTimeout(() => handleSelectModel(theoristParam), 150);
    }

    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stageLabel = MONOMYTH_STAGES.find(s => s.id === currentStage)?.label;
  const isStage = currentStage !== 'overview';

  const handleSelectStage = (id) => {
    if (id !== 'overview') trackElement(`monomyth.stage.${id}`);
    setCurrentStage(id);
    setVideoUrl(null);
    setActiveWorld(null);
    if (id !== 'overview') setActiveTab('overview');
  };

  const handleSelectWorld = (world) => {
    setActiveWorld(world);
    if (world) {
      setCurrentStage('overview');
      setVideoUrl(null);
    }
  };

  return (
    <div className="monomyth-page">
      <CircleNav
        stages={MONOMYTH_STAGES}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        clockwise={clockwise}
        onToggleDirection={() => setClockwise(!clockwise)}
        centerLine1="Monomyth"
        centerLine2="& the"
        centerLine3="Hero's Journey"
        showAuthor={false}
        videoUrl={videoUrl}
        onCloseVideo={() => setVideoUrl(null)}
        worldZones
        activeWorld={activeWorld}
        onSelectWorld={handleSelectWorld}
        modelOverlay={selectedModel}
        onCloseModel={() => setSelectedModel(null)}
        ybrActive={journey.active}
        ybrCurrentStopIndex={journey.currentStopIndex}
        ybrStages={MONOMYTH_STAGES}
        onToggleYBR={handleYBRToggle}
        ybrAutoStart={ybrAutoStart}
        playIntroAnim={introAnim}
        getStageClass={courseworkMode ? (id) => isElementCompleted(`monomyth.stage.${id}`) ? 'cw-completed' : 'cw-incomplete' : undefined}
        selectorRing={selectorRing}
        onSelectRingItem={(id) => handleSelectRingItem(activeTab, id)}
      />

      {selectorRing.length > 0 && (
        <div style={{ textAlign: 'center', color: '#c9a961', fontSize: '0.7rem', opacity: 0.7, margin: '-8px 0 4px' }}>
          {selectorRing.map(item => item.label).join(' · ')}
        </div>
      )}

      {isStage && stageLabel && (
        <h2 className="stage-heading">{stageLabel}</h2>
      )}

      {journey.active && (
        <div className="container">
          <WheelJourneyPanel
            journeyId="monomyth"
            stages={MONOMYTH_STAGES}
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
              "Atlas invites you to walk the Yellow Brick Road of the Hero's Journey.",
              "Eight stages. Eight stops around the wheel. At each one, Atlas will ask you to describe what happens at that stage — the events, themes, and transformations that define it.",
              "You are encouraged to explore each stage's content on the page before answering. The tabs above hold the knowledge you need — overview, cycles, theorists, myths, films.",
              "There are no wrong answers, only deeper ones.",
            ]}
            completionText={[
              "You have walked the full wheel of the Monomyth — from Surface through Calling, Crossing, Initiating, Nadir, Return, Arrival, and Renewal.",
              "The hero's journey is not a path that ends. It is a wheel that turns. You began at the surface. You return to the surface. But you are different now, because you have seen the pattern.",
            ]}
            returnLabel="Return to Monomyth"
          />
        </div>
      )}

      <div className="container">
        <div id="content-container">
          {activeWorld ? (
            <WorldContent worldKey={activeWorld} onSelectModel={handleSelectModel} onSelectCycle={handleSelectCycle} selectedModelId={selectedModel?.id} videoUrl={videoUrl} onPlayVideo={(url) => setVideoUrl(url)} onCloseVideo={() => setVideoUrl(null)} />
          ) : isStage ? (
            <div className="metal-detail-panel">
              <div className="metal-tabs">
                {TABS.map(t => {
                  const eid = `monomyth.${t.id}.${currentStage}`;
                  const cwClass = courseworkMode ? (isElementCompleted(eid) ? ' cw-completed' : ' cw-incomplete') : '';
                  return (
                    <button
                      key={t.id}
                      className={`metal-tab${activeTab === t.id ? ' active' : ''}${cwClass}`}
                      onClick={() => { trackElement(eid); setActiveTab(t.id); }}
                    >
                      {t.label}
                    </button>
                  );
                })}
                {hasAnySlots('monomyth') && (
                  <button
                    className="metal-tab trail-icon-tab"
                    title="360 Trail"
                    onClick={() => setTrailOpen(true)}
                  >
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="10" r="8" />
                      <path d="M10,2 L10,4" />
                      <path d="M10,16 L10,18" />
                      <path d="M2,10 L4,10" />
                      <path d="M16,10 L18,10" />
                      <path d="M10,6 L10,10 L13,13" />
                    </svg>
                  </button>
                )}
                <button
                  className={`metal-tab cw-icon-tab${courseworkMode ? (activeTab === 'test' ? ' active' : '') : ''}`}
                  title={courseworkMode ? 'Stage Test' : 'Coursework'}
                  onClick={() => {
                    if (courseworkMode) {
                      trackElement(`monomyth.test.view.${currentStage}`);
                      setActiveTab('test');
                    } else {
                      toggleCourseworkMode();
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2,12 L12,6 L22,12 L12,18 Z" />
                    <path d="M6,14 L6,19 C6,19 9,22 12,22 C15,22 18,19 18,19 L18,14" />
                    <line x1="22" y1="12" x2="22" y2="18" />
                  </svg>
                </button>
                <button
                  className={`metal-tab forge-icon-tab${forgeMode ? (activeTab === 'development' ? ' active' : '') : ''}`}
                  title={forgeMode ? 'Story Forge' : 'Story Forge (off)'}
                  onClick={() => {
                    if (forgeMode) {
                      trackElement(`monomyth.development.${currentStage}`);
                      setActiveTab('development');
                    } else {
                      setForgeMode(true);
                    }
                  }}
                >
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10,2 L10,11" />
                    <path d="M7,5 Q10,3 13,5" />
                    <path d="M6,11 L14,11" />
                    <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
                  </svg>
                </button>
                <button
                  className={`metal-tab ybr-icon-tab${ybrMode ? (journey.active ? ' active' : '') : ''}`}
                  title={ybrMode ? (journey.active ? 'Exit Yellow Brick Road' : 'Walk the Yellow Brick Road') : 'Yellow Brick Road (off)'}
                  onClick={() => {
                    if (ybrMode) {
                      handleYBRToggle();
                    } else {
                      setYbrMode(true);
                    }
                  }}
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
                {(() => {
                  const stage = MONOMYTH_STAGES.find(s => s.id === currentStage);
                  if (!stage?.playlist) return null;
                  const listId = new URL(stage.playlist).searchParams.get('list');
                  return (
                    <button
                      className={`metal-tab playlist-tab${videoUrl ? ' active' : ''}`}
                      title={`Watch ${stage.label} playlist`}
                      onClick={() => {
                        if (videoUrl) {
                          setVideoUrl(null);
                        } else {
                          setVideoUrl(`https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1`);
                        }
                      }}
                    >
                      {videoUrl ? '\u25A0' : '\u25B6'}
                    </button>
                  );
                })()}
              </div>

              {activeTab === 'theorists' && (
                <div className="mono-group-selector">
                  {THEORIST_GROUPS.map(g => (
                    <button
                      key={g.id}
                      className={`culture-btn${activeGroup === g.id ? ' active' : ''}`}
                      onClick={() => setActiveGroup(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="metal-content-scroll">
                {activeTab === 'overview' && (
                  <OverviewTab stageId={currentStage} />
                )}
                {activeTab === 'test' && courseworkMode && (
                  <StageTest
                    questions={stageQuestions}
                    currentIndex={test.currentIndex}
                    currentQuestion={test.currentQuestion}
                    totalQuestions={test.totalQuestions}
                    selected={test.selected}
                    feedback={test.feedback}
                    isFinished={test.isFinished}
                    onToggleOption={test.toggleOption}
                    onSubmit={test.submit}
                    onAdvance={test.advance}
                    stageLabel={stageLabel}
                  />
                )}
                {activeTab === 'cycles' && <CyclesTab stageId={currentStage} onSelectCycle={handleSelectCycle} selectedModelId={selectedModel?.id} />}
                {activeTab === 'theorists' && <TheoristsTab stageId={currentStage} activeGroup={activeGroup} onSelectModel={handleSelectModel} selectedModelId={selectedModel?.id} />}
                {activeTab === 'experts' && <ExpertsTab stageId={currentStage} onSelectModel={handleSelectModel} selectedModelId={selectedModel?.id} />}
                {activeTab === 'history' && <HistoryTab stageId={currentStage} />}
                {activeTab === 'myths' && <MythsTab stageId={currentStage} />}
                {activeTab === 'films' && <FilmsTab stageId={currentStage} />}
                {activeTab === 'development' && forgeMode && (
                  <DevelopmentPanel
                    stageLabel={stageLabel}
                    stageKey={`monomyth-${currentStage}`}
                    entries={devEntries}
                    setEntries={setDevEntries}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="metal-detail-panel">
              <GlobalOverview />
            </div>
          )}
        </div>
      </div>

      {trailOpen && (
        <Suspense fallback={null}>
          <TrailOverlay
            mediaSlots={getSlotsByPrefix('monomyth')}
            onClose={() => setTrailOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
