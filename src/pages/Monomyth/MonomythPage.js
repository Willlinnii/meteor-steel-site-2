import React, { useState } from 'react';
import CircleNav from '../../components/CircleNav';
import DevelopmentPanel from '../../components/DevelopmentPanel';
import TextBlock from '../../components/sevenMetals/TextBlock';
import './MonomythPage.css';

import monomythProse from '../../data/monomyth.json';
import stageOverviews from '../../data/stageOverviews.json';
import theoristsData from '../../data/monomythTheorists.json';
import mythsData from '../../data/monomythMyths.json';
import psychlesData from '../../data/monomythPsychles.json';
import depthData from '../../data/monomythDepth.json';
import filmsData from '../../data/monomythFilms.json';

const MONOMYTH_STAGES = [
  { id: 'golden-age', label: 'Surface' },
  { id: 'falling-star', label: 'Calling' },
  { id: 'impact-crater', label: 'Crossing', flipLabel: true },
  { id: 'forge', label: 'Initiating' },
  { id: 'quenching', label: 'Nadir' },
  { id: 'integration', label: 'Return' },
  { id: 'drawing', label: 'Arrival', flipLabel: true },
  { id: 'new-age', label: 'Renewal' },
];

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

function TheoristsTab({ stageId, activeGroup }) {
  const stageData = theoristsData[stageId];
  if (!stageData) return <p className="metals-empty">No theorist data available.</p>;

  const group = stageData[activeGroup];
  if (!group) return <p className="metals-empty">No {activeGroup} theorists for this stage.</p>;

  const depthPsych = depthData[stageId]?.depth;

  return (
    <div className="tab-content">
      {Object.entries(group).map(([key, t]) => (
        <div key={key} className="mono-card">
          <h4 className="mono-card-name">{t.name}</h4>
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
      ))}
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
          <p className="attr-list">{philosophy.themes.join(' · ')}</p>
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

function CyclesTab({ stageId }) {
  const stageData = psychlesData[stageId];
  if (!stageData) return <p className="metals-empty">No cycle data available.</p>;

  const { stageName, summary, cycles } = stageData;

  return (
    <div className="tab-content">
      {stageName && <h4>{stageName}</h4>}
      {summary && <p className="mono-summary">{summary}</p>}
      {cycles && Object.entries(cycles).map(([key, c]) => (
        <div key={key} className="mono-card">
          <h5 className="mono-card-concept">{c.label}</h5>
          <span className="mono-card-tradition">{c.phase}</span>
          <p>{c.description}</p>
        </div>
      ))}
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

export default function MonomythPage() {
  const [currentStage, setCurrentStage] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeGroup, setActiveGroup] = useState('mythological');
  const [devEntries, setDevEntries] = useState({});

  const stageLabel = MONOMYTH_STAGES.find(s => s.id === currentStage)?.label;
  const isStage = currentStage !== 'overview';

  const handleSelectStage = (id) => {
    setCurrentStage(id);
    if (id !== 'overview') setActiveTab('overview');
  };

  return (
    <div className="monomyth-page">
      <CircleNav
        stages={MONOMYTH_STAGES}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        clockwise={clockwise}
        onToggleDirection={() => setClockwise(!clockwise)}
        centerLine1="Hero's Journey"
        centerLine2="& the"
        centerLine3="Monomyth"
        showAuthor={false}
      />

      {isStage && stageLabel && (
        <h2 className="stage-heading">{stageLabel}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {isStage ? (
            <div className="metal-detail-panel">
              <div className="metal-tabs">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
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
                {activeTab === 'overview' && <OverviewTab stageId={currentStage} />}
                {activeTab === 'cycles' && <CyclesTab stageId={currentStage} />}
                {activeTab === 'theorists' && <TheoristsTab stageId={currentStage} activeGroup={activeGroup} />}
                {activeTab === 'history' && <HistoryTab stageId={currentStage} />}
                {activeTab === 'myths' && <MythsTab stageId={currentStage} />}
                {activeTab === 'films' && <FilmsTab stageId={currentStage} />}
                {activeTab === 'development' && (
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
    </div>
  );
}
