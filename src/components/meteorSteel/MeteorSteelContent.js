import React, { useState, useEffect } from 'react';
import DevelopmentPanel from '../DevelopmentPanel';
import { useStoryForge } from '../../App';
import steelProcess from '../../data/steelProcess.json';
import figures from '../../data/figures.json';
import saviors from '../../data/saviors.json';
import modernFigures from '../../data/modernFigures.json';
import ufo from '../../data/ufo.json';
import monomythProse from '../../data/monomyth.json';
import synthesis from '../../data/synthesis.json';
import stageOverviews from '../../data/stageOverviews.json';

const SECTION_TABS = [
  { id: 'technology', label: 'Meteor Steel' },
  { id: 'figures', label: 'Mythic Figures' },
  { id: 'saviors', label: 'Iron Age Saviors' },
  { id: 'modern', label: 'Modern Myths' },
  { id: 'ufo', label: 'UFO' },
  { id: 'monomyth', label: 'Monomyth' },
  { id: 'synthesis', label: 'Synthesis' },
  { id: 'development', label: 'Development' },
];

function TextContent({ text }) {
  if (!text || !text.trim()) return <div className="metals-empty">Content to be added.</div>;
  return (
    <div className="overview-text">
      {text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function FigureCards({ figuresList, stage }) {
  const available = figuresList.filter(f => f.stages[stage] && f.stages[stage].trim());
  const [activeFigure, setActiveFigure] = useState(available[0]?.id || null);

  useEffect(() => {
    if (available.length > 0 && !available.find(f => f.id === activeFigure)) {
      setActiveFigure(available[0].id);
    }
  }, [stage, available, activeFigure]);

  if (available.length === 0) return <div className="metals-empty">No content available.</div>;

  if (available.length === 1) {
    const f = available[0];
    return (
      <div className="figure-card">
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
      <div className="figure-card">
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

export default function MeteorSteelContent({ stageId, activeTab, onSelectTab, devEntries, setDevEntries }) {
  const { forgeMode } = useStoryForge();
  const visibleTabs = forgeMode ? SECTION_TABS : SECTION_TABS.filter(t => t.id !== 'development');
  return (
    <div className="metal-detail-panel">
      {stageOverviews[stageId] && (
        <div className="mono-overview-block">
          <TextContent text={stageOverviews[stageId]} />
        </div>
      )}
      <div className="metal-tabs">
        {visibleTabs.map(t => (
          <button key={t.id}
            className={`metal-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onSelectTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="metal-content-scroll">
        <div className="tab-content">
          {activeTab === 'technology' && <TextContent text={steelProcess[stageId]} />}
          {activeTab === 'figures' && <FigureCards figuresList={figures} stage={stageId} />}
          {activeTab === 'saviors' && <FigureCards figuresList={saviors} stage={stageId} />}
          {activeTab === 'modern' && <FigureCards figuresList={modernFigures} stage={stageId} />}
          {activeTab === 'ufo' && <TextContent text={ufo[stageId]} />}
          {activeTab === 'monomyth' && <TextContent text={monomythProse[stageId]} />}
          {activeTab === 'synthesis' && <TextContent text={synthesis[stageId]} />}
          {activeTab === 'development' && <DevelopmentPanel stageLabel={STAGE_LABELS[stageId] || stageId} stageKey={stageId} entries={devEntries || {}} setEntries={setDevEntries || (() => {})} />}
        </div>
      </div>
    </div>
  );
}
