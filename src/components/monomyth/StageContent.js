import React, { useState, useEffect } from 'react';
import TextBlock from '../chronosphaera/TextBlock';
import DevelopmentPanel from '../DevelopmentPanel';
import StageTest from '../StageTest';
import useTest from '../../hooks/useTest';
import { getSectionQuestions } from '../../coursework/tests';
import CrossStageModal from '../CrossStageModal';
import { THEORIST_TO_MODEL, CYCLE_TO_MODEL, MONOMYTH_STAGES } from '../../data/monomythConstants';
import { useStoryForge, useYBRMode } from '../../App';
import { useCoursework } from '../../coursework/CourseworkContext';

import monomythProse from '../../data/monomyth.json';
import stageOverviews from '../../data/stageOverviews.json';
import theoristsData from '../../data/monomythTheorists.json';
import mythsData from '../../data/monomythMyths.json';
import psychlesData from '../../data/monomythPsychles.json';
import depthData from '../../data/monomythDepth.json';
import filmsData from '../../data/monomythFilms.json';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'theorists', label: 'Theorists' },
  { id: 'myths', label: 'Myths' },
  { id: 'films', label: 'Films' },
  { id: 'history', label: 'History' },
];

const THEORIST_GROUPS = [
  { id: 'mythological', label: 'Mythological' },
  { id: 'screenplay', label: 'Screenplay' },
];

const PSYCHLE_KEY_TO_CYCLE = {
  solarDay: 'Solar Day',
  lunarMonth: 'Lunar Month',
  solarYear: 'Solar Year',
  lifeDeath: 'Mortality',
  procreation: 'Procreation',
  wakingDreaming: 'Wake & Sleep',
};

const CS_STAGES = MONOMYTH_STAGES.map(s => ({ id: s.id, label: s.label }));

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

function TheoristsTab({ stageId, activeGroup, onSelectModel, selectedModelId, onItemClick }) {
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
          className={`mono-card mono-card-clickable${isActive ? ' mono-card-model-active' : ''}`}
          onClick={() => onItemClick('theorist', key, activeGroup)}
        >
          <h4 className="mono-card-name">
            {t.name}
            {hasModel && (
              <span
                className="mono-model-icon"
                onClick={(e) => { e.stopPropagation(); onSelectModel(key); }}
              >
                {isActive ? ' \u25C9' : ' \u25CE'}
              </span>
            )}
          </h4>
          <h5 className="mono-card-concept">{t.concept}</h5>
          <p>{t.description}</p>
          {key === 'jung' && activeGroup === 'mythological' && depthPsych && (
            <>
              <p>{depthPsych.description}</p>
              {depthPsych.concepts && (
                <p className="attr-list">{depthPsych.concepts.join(' \u00B7 ')}</p>
              )}
            </>
          )}
        </div>
      ); })}
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
          <p className="attr-list">{philosophy.themes.join(' \u00B7 ')}</p>
        )}
      </div>
    </div>
  );
}

function MythsTab({ stageId, onItemClick }) {
  const stageData = mythsData[stageId];
  if (!stageData) return <p className="chrono-empty">No myth data available.</p>;

  return (
    <div className="tab-content">
      {Object.entries(stageData).map(([key, m]) => (
        <div
          key={key}
          className="mono-card mono-card-clickable"
          onClick={() => onItemClick('myth', key)}
        >
          <span className="mono-card-tradition">{m.tradition}</span>
          <h4 className="mono-card-name">{m.title}</h4>
          <p>{m.description}</p>
        </div>
      ))}
    </div>
  );
}

function FilmsTab({ stageId, onItemClick }) {
  const stageData = filmsData[stageId];
  if (!stageData) return <p className="chrono-empty">No film data available.</p>;

  return (
    <div className="tab-content">
      {Object.entries(stageData).map(([key, f]) => (
        <div
          key={key}
          className="mono-card mono-card-clickable"
          onClick={() => onItemClick('film', key)}
        >
          <span className="mono-card-tradition">{f.year}</span>
          <h4 className="mono-card-name">{f.title}</h4>
          <p>{f.description}</p>
        </div>
      ))}
    </div>
  );
}

function CyclesTab({ stageId, onSelectCycle, selectedModelId, onItemClick }) {
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
          className={`mono-card mono-card-clickable${isActive ? ' mono-card-model-active' : ''}`}
          onClick={() => onItemClick('cycle', key)}
        >
          <h5 className="mono-card-concept">
            {c.label}
            {hasCycle && (
              <span
                className="mono-model-icon"
                onClick={(e) => { e.stopPropagation(); if (onSelectCycle) onSelectCycle(cycleKey); }}
              >
                {isActive ? ' \u25C9' : ' \u25CE'}
              </span>
            )}
          </h5>
          <span className="mono-card-tradition">{c.phase}</span>
          <p>{c.description}</p>
        </div>
      ); })}
    </div>
  );
}

function buildCrossStage(type, key, group) {
  const stageIds = MONOMYTH_STAGES.map(s => s.id);

  switch (type) {
    case 'myth': {
      const firstEntry = stageIds.reduce((acc, sid) => acc || mythsData[sid]?.[key], null);
      if (!firstEntry) return null;
      const title = (firstEntry.title || key).split(' \u2014 ')[0];
      const subtitle = firstEntry.tradition;
      const entries = stageIds.map(sid => {
        const m = mythsData[sid]?.[key];
        if (!m) return null;
        return { heading: m.title, text: m.description };
      });
      return { title, subtitle, entries };
    }
    case 'theorist': {
      const firstEntry = stageIds.reduce((acc, sid) => acc || theoristsData[sid]?.[group]?.[key], null);
      if (!firstEntry) return null;
      const groupLabel = THEORIST_GROUPS.find(g => g.id === group)?.label || group;
      const entries = stageIds.map(sid => {
        const t = theoristsData[sid]?.[group]?.[key];
        if (!t) return null;
        return { heading: t.concept, text: t.description };
      });
      return { title: firstEntry.name, subtitle: groupLabel, entries };
    }
    case 'cycle': {
      const firstEntry = stageIds.reduce((acc, sid) => acc || psychlesData[sid]?.cycles?.[key], null);
      if (!firstEntry) return null;
      const title = PSYCHLE_KEY_TO_CYCLE[key] || firstEntry.label;
      const entries = stageIds.map(sid => {
        const c = psychlesData[sid]?.cycles?.[key];
        if (!c) return null;
        return { heading: c.phase, text: c.description };
      });
      return { title, entries };
    }
    case 'film': {
      const firstEntry = stageIds.reduce((acc, sid) => acc || filmsData[sid]?.[key], null);
      if (!firstEntry) return null;
      const entries = stageIds.map(sid => {
        const f = filmsData[sid]?.[key];
        if (!f) return null;
        return { heading: f.title, text: f.description };
      });
      return { title: firstEntry.title, subtitle: String(firstEntry.year), entries };
    }
    default:
      return null;
  }
}

export default function StageContent({
  stageId,
  activeTab,
  onSelectTab,
  onSelectModel,
  onSelectCycle,
  selectedModelId,
  getTabClass,
  devEntries,
  setDevEntries,
  onToggleYBR,
  ybrActive,
}) {
  const [activeGroup, setActiveGroup] = useState('mythological');
  const [crossStageData, setCrossStageData] = useState(null);
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();
  const { trackElement, isElementCompleted, courseworkMode, toggleCourseworkMode } = useCoursework();

  // Test state
  const stageQuestions = getSectionQuestions('monomyth-explorer', stageId);
  const testCompleted = isElementCompleted(`monomyth.test.${stageId}`);
  const test = useTest({ questions: stageQuestions, alreadyCompleted: testCompleted });
  const stageLabel = MONOMYTH_STAGES.find(s => s.id === stageId)?.label;

  // Track test completion
  useEffect(() => {
    if (test.isFinished && !testCompleted && stageQuestions.length > 0) {
      trackElement(`monomyth.test.${stageId}`);
    }
  }, [test.isFinished, testCompleted, stageId, stageQuestions.length, trackElement]);

  // Reset test when stage changes
  useEffect(() => { test.reset(); }, [stageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleItemClick = (type, key, group) => {
    const data = buildCrossStage(type, key, group);
    if (data) setCrossStageData(data);
  };

  return (
    <div className="metal-detail-panel">
      <div className="metal-tabs">
        {TABS.map(t => {
          const cwClass = getTabClass ? (' ' + getTabClass(t.id)) : '';
          return (
            <button
              key={t.id}
              className={`metal-tab${activeTab === t.id ? ' active' : ''}${cwClass}`}
              onClick={() => onSelectTab(t.id)}
            >
              {t.label}
            </button>
          );
        })}
        <button
          className={`metal-tab cw-icon-tab${courseworkMode ? (activeTab === 'test' ? ' active' : '') : ''}`}
          title={courseworkMode ? 'Stage Test' : 'Coursework'}
          onClick={() => {
            if (courseworkMode) {
              trackElement(`monomyth.test.view.${stageId}`);
              onSelectTab('test');
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
        {forgeMode && (
          <button
            className={`metal-tab forge-icon-tab${activeTab === 'development' ? ' active' : ''}`}
            title="Story Forge"
            onClick={() => onSelectTab('development')}
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
            className={`metal-tab ybr-icon-tab${ybrActive ? ' active' : ''}`}
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
        {activeTab === 'overview' && <OverviewTab stageId={stageId} />}
        {activeTab === 'cycles' && <CyclesTab stageId={stageId} onSelectCycle={onSelectCycle} selectedModelId={selectedModelId} onItemClick={handleItemClick} />}
        {activeTab === 'theorists' && <TheoristsTab stageId={stageId} activeGroup={activeGroup} onSelectModel={onSelectModel} selectedModelId={selectedModelId} onItemClick={handleItemClick} />}
        {activeTab === 'history' && <HistoryTab stageId={stageId} />}
        {activeTab === 'myths' && <MythsTab stageId={stageId} onItemClick={handleItemClick} />}
        {activeTab === 'films' && <FilmsTab stageId={stageId} onItemClick={handleItemClick} />}
        {activeTab === 'development' && <DevelopmentPanel stageLabel={stageLabel || stageId} stageKey={`monomyth-${stageId}`} entries={devEntries || {}} setEntries={setDevEntries || (() => {})} />}
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
      </div>

      {crossStageData && (
        <CrossStageModal
          title={crossStageData.title}
          subtitle={crossStageData.subtitle}
          stages={CS_STAGES}
          entries={crossStageData.entries}
          onClose={() => setCrossStageData(null)}
        />
      )}
    </div>
  );
}
