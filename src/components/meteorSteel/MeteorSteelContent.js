import React, { useState, useEffect } from 'react';
import DevelopmentPanel from '../DevelopmentPanel';
import CrossStageModal from '../CrossStageModal';
import { useStoryForge, useYBRMode } from '../../App';
import steelProcess from '../../data/steelProcess.json';
import figures from '../../data/figures.json';
import saviors from '../../data/saviors.json';
import modernFigures from '../../data/modernFigures.json';
import ufo from '../../data/ufo.json';
import monomythProse from '../../data/monomyth.json';
import synthesis from '../../data/synthesis.json';
import stageOverviews from '../../data/stageOverviews.json';
import storyOfStoriesData from '../../data/storyOfStoriesData';

const STAGE_TO_SOS = {
  'golden-age': 'golden-surface',
  'falling-star': 'calling-star',
  'impact-crater': 'crater-crossing',
  'forge': 'trials-forge',
  'quenching': 'quenching',
  'integration': 'return-reflection',
  'drawing': 'drawing-dawn',
  'new-age': 'new-age',
};

const SOS_CHAPTER_NAMES = {
  'golden-surface': 'Chapter 1: Golden Age \u2014 The Setup',
  'calling-star': 'Chapter 2: Calling Star \u2014 From Stasis to Rupture',
  'crater-crossing': 'Chapter 3: Crater Crossing \u2014 Threshold',
  'trials-forge': 'Chapter 4: Tests of the Forge \u2014 The Road of Initiation',
  'quenching': 'Chapter 5: Quench \u2014 The Nadir',
  'return-reflection': 'Chapter 6: Integrate & Reflect \u2014 The Return',
  'drawing-dawn': 'Chapter 7: Drawing Dawn \u2014 The Return Threshold',
  'new-age': 'Chapter 8: Age of Integration \u2014 Renewal',
};

const SECTION_TABS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'technology', label: 'Meteor Steel' },
  { id: 'figures', label: 'Mythic Figures' },
  { id: 'saviors', label: 'Iron Age Saviors' },
  { id: 'modern', label: 'Modern Myths' },
  { id: 'ufo', label: 'UFO' },
  { id: 'monomyth', label: 'Monomyth' },
  { id: 'synthesis', label: 'Synthesis' },
];

function TextContent({ text }) {
  if (!text || !text.trim()) return <div className="chrono-empty">Content to be added.</div>;
  return (
    <div className="overview-text">
      {text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function IntroductionContent({ stageId }) {
  const sosId = STAGE_TO_SOS[stageId];
  if (!sosId) return <div className="chrono-empty">No introduction available.</div>;
  const chapterName = SOS_CHAPTER_NAMES[sosId];
  const summary = storyOfStoriesData.stageSummaries?.[sosId];
  return (
    <>
      {chapterName && <h4>{chapterName}</h4>}
      {summary ? (
        summary.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
      ) : (
        <div className="chrono-empty">Content coming soon.</div>
      )}
    </>
  );
}

function FigureCards({ figuresList, stage, onFigureClick }) {
  const available = figuresList.filter(f => f.stages[stage] && f.stages[stage].trim());
  const [activeFigure, setActiveFigure] = useState(available[0]?.id || null);

  useEffect(() => {
    if (available.length > 0 && !available.find(f => f.id === activeFigure)) {
      setActiveFigure(available[0].id);
    }
  }, [stage, available, activeFigure]);

  if (available.length === 0) return <div className="chrono-empty">No content available.</div>;

  if (available.length === 1) {
    const f = available[0];
    return (
      <div className="figure-card mono-card-clickable" onClick={() => onFigureClick(f)}>
        <h4 className="figure-name">{f.name}</h4>
        <div className="figure-content">
          {f.stages[stage].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }

  const selected = available.find(f => f.id === activeFigure) || available[0];
  return (
    <div className="figure-selector">
      <div className="figure-buttons">
        {available.map(f => (
          <button key={f.id} className={`culture-btn${f.id === selected.id ? ' active' : ''}`}
            onClick={() => setActiveFigure(f.id)}>{f.name}</button>
        ))}
      </div>
      <div className="figure-card mono-card-clickable" onClick={() => onFigureClick(selected)}>
        <div className="figure-content">
          {selected.stages[stage].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  );
}

const STAGE_LABELS = {
  'golden-age': 'Golden Age', 'falling-star': 'Calling Star', 'impact-crater': 'Crater Crossing',
  'forge': 'Trials of Forge', 'quenching': 'Quench', 'integration': 'Integration',
  'drawing': 'Draw', 'new-age': 'Age of Steel',
};

const MS_STAGES = Object.entries(STAGE_LABELS).map(([id, label]) => ({ id, label }));

export default function MeteorSteelContent({ stageId, activeTab, onSelectTab, devEntries, setDevEntries, onToggleYBR, ybrActive }) {
  const [crossStageData, setCrossStageData] = useState(null);
  const { forgeMode } = useStoryForge();
  const { ybrMode } = useYBRMode();

  const handleFigureClick = (figure) => {
    const entries = MS_STAGES.map(s => {
      const text = figure.stages[s.id];
      if (!text || !text.trim()) return null;
      return { text };
    });
    setCrossStageData({ title: figure.name, entries });
  };

  return (
    <div className="metal-detail-panel">
      {stageOverviews[stageId] && (
        <div className="mono-overview-block">
          <TextContent text={stageOverviews[stageId]} />
        </div>
      )}
      <div className="metal-tabs">
        {SECTION_TABS.map(t => (
          <button key={t.id}
            className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onSelectTab(t.id)}>{t.label}</button>
        ))}
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
      <div className="metal-content-scroll">
        <div className="tab-content">
          {activeTab === 'introduction' && <IntroductionContent stageId={stageId} />}
          {activeTab === 'technology' && <TextContent text={steelProcess[stageId]} />}
          {activeTab === 'figures' && <FigureCards figuresList={figures} stage={stageId} onFigureClick={handleFigureClick} />}
          {activeTab === 'saviors' && <FigureCards figuresList={saviors} stage={stageId} onFigureClick={handleFigureClick} />}
          {activeTab === 'modern' && <FigureCards figuresList={modernFigures} stage={stageId} onFigureClick={handleFigureClick} />}
          {activeTab === 'ufo' && <TextContent text={ufo[stageId]} />}
          {activeTab === 'monomyth' && <TextContent text={monomythProse[stageId]} />}
          {activeTab === 'synthesis' && <TextContent text={synthesis[stageId]} />}
          {activeTab === 'development' && forgeMode && <DevelopmentPanel stageLabel={STAGE_LABELS[stageId] || stageId} stageKey={stageId} entries={devEntries || {}} setEntries={setDevEntries || (() => {})} />}
        </div>
      </div>

      {crossStageData && (
        <CrossStageModal
          title={crossStageData.title}
          subtitle={crossStageData.subtitle}
          stages={MS_STAGES}
          entries={crossStageData.entries}
          onClose={() => setCrossStageData(null)}
        />
      )}
    </div>
  );
}
