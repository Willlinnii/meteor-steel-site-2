import React, { useState } from 'react';
import TextBlock from '../sevenMetals/TextBlock';
import DevelopmentPanel from '../DevelopmentPanel';
import { THEORIST_TO_MODEL, CYCLE_TO_MODEL, MONOMYTH_STAGES } from '../../data/monomythConstants';

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
  { id: 'history', label: 'History' },
  { id: 'myths', label: 'Myths' },
  { id: 'films', label: 'Films' },
  { id: 'development', label: 'Development' },
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
  if (!stageData) return <p className="metals-empty">No theorist data available.</p>;

  const group = stageData[activeGroup];
  if (!group) return <p className="metals-empty">No {activeGroup} theorists for this stage.</p>;

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
  if (!philosophy) return <p className="metals-empty">No history data available.</p>;

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

function MythsTab({ stageId }) {
  const stageData = mythsData[stageId];
  if (!stageData) return <p className="metals-empty">No myth data available.</p>;

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
  if (!stageData) return <p className="metals-empty">No film data available.</p>;

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

function CyclesTab({ stageId, onSelectCycle, selectedModelId }) {
  const stageData = psychlesData[stageId];
  if (!stageData) return <p className="metals-empty">No cycle data available.</p>;

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
}) {
  const [activeGroup, setActiveGroup] = useState('mythological');

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
        {activeTab === 'cycles' && <CyclesTab stageId={stageId} onSelectCycle={onSelectCycle} selectedModelId={selectedModelId} />}
        {activeTab === 'theorists' && <TheoristsTab stageId={stageId} activeGroup={activeGroup} onSelectModel={onSelectModel} selectedModelId={selectedModelId} />}
        {activeTab === 'history' && <HistoryTab stageId={stageId} />}
        {activeTab === 'myths' && <MythsTab stageId={stageId} />}
        {activeTab === 'films' && <FilmsTab stageId={stageId} />}
        {activeTab === 'development' && <DevelopmentPanel stageLabel={MONOMYTH_STAGES.find(s => s.id === stageId)?.label || stageId} stageKey={`monomyth-${stageId}`} entries={devEntries || {}} setEntries={setDevEntries || (() => {})} />}
      </div>
    </div>
  );
}
