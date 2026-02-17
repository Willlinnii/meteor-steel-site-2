import React, { useState } from 'react';
import './App.css';
import figures from './data/figures.json';
import modernFigures from './data/modernFigures.json';
import stageOverviews from './data/stageOverviews.json';
import steelProcess from './data/steelProcess.json';
import historyData from './data/history.json';
import monomyth from './data/monomyth.json';

const STAGES = [
  { id: 'golden-age', label: 'Golden Age', angle: -90 },
  { id: 'falling-star', label: 'Calling Star', angle: -45 },
  { id: 'impact-crater', label: 'Crater Crossing', angle: 0 },
  { id: 'forge', label: 'Trials of Forge', angle: 45 },
  { id: 'quenching', label: 'Quench', angle: 90 },
  { id: 'integration', label: 'Integration', angle: 135 },
  { id: 'drawing', label: 'Draw', angle: 180 },
  { id: 'new-age', label: 'Age of Meteor Steel', angle: -135 },
];

function CircleNav({ currentStage, onSelectStage }) {
  const radius = 42;

  return (
    <div className="circle-nav-wrapper">
      <div className="circle-nav">
        <svg viewBox="0 0 100 100" className="circle-rings">
          <circle cx="50" cy="50" r="47" className="ring ring-outer" />
          <circle cx="50" cy="50" r="38" className="ring ring-inner" />
        </svg>

        <div
          className={`circle-center ${currentStage === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectStage('overview')}
        >
          <span className="center-title-journey">Journey</span>
          <span className="center-title-of">of</span>
          <span className="center-title-fallen">Fallen Starlight</span>
          <span className="center-author">Will Linn</span>
        </div>

        {STAGES.map(s => {
          const rad = (s.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          return (
            <div
              key={s.id}
              className={`circle-stage ${currentStage === s.id ? 'active' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => onSelectStage(s.id)}
            >
              <span
                className="circle-stage-label"
                style={{ transform: `rotate(${s.angle + 90}deg)` }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dropdown({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div className="dropdown-section">
      <div
        className={`dropdown-header ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <h3>{title}</h3>
        <span className="dropdown-arrow">{'\u25BC'}</span>
      </div>
      <div className={`dropdown-content ${open ? 'active' : ''}`}>
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

function FigureCards({ figuresList, stage }) {
  const rendered = figuresList
    .filter(f => f.stages[stage] && f.stages[stage].trim())
    .map(f => (
      <div className="figure-card" key={f.id}>
        <h4 className="figure-name">{f.name}</h4>
        <div className="figure-content">
          {f.stages[stage].split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    ));

  if (rendered.length === 0) {
    return <div className="empty-content">No content available for this stage.</div>;
  }
  return <>{rendered}</>;
}

function TextContent({ text }) {
  if (!text || !text.trim()) {
    return <div className="empty-content">Content to be added.</div>;
  }
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <div className="overview-text" key={i}>{p}</div>
      ))}
    </>
  );
}

function OverviewView() {
  return (
    <>
      <Dropdown title="Overview: Meteor Steel Mythology" defaultOpen>
        <div className="overview-text">{stageOverviews.overview}</div>
      </Dropdown>

      <Dropdown title="Mythic Figures">
        {figures.map(f => {
          const allContent = Object.values(f.stages).filter(c => c).join(' ');
          if (!allContent) return null;
          return (
            <div className="figure-card" key={f.id}>
              <h4 className="figure-name">{f.name}</h4>
              <div className="figure-content">
                <p>{allContent.substring(0, 500)}{allContent.length > 500 ? '...' : ''}</p>
              </div>
            </div>
          );
        })}
      </Dropdown>
    </>
  );
}

function StageView({ stage }) {
  return (
    <>
      <Dropdown title="Overview" defaultOpen>
        <TextContent text={stageOverviews[stage]} />
      </Dropdown>

      <Dropdown title="Mythic Figures">
        <FigureCards figuresList={figures} stage={stage} />
      </Dropdown>

      <Dropdown title="Modern Myths">
        <FigureCards figuresList={modernFigures} stage={stage} />
      </Dropdown>

      <Dropdown title="Steel-Making Process">
        <TextContent text={steelProcess[stage]} />
      </Dropdown>

      <Dropdown title="History of Meteor Steel">
        <TextContent text={historyData[stage]} />
      </Dropdown>

      <Dropdown title="Monomyth">
        <TextContent text={monomyth[stage]} />
      </Dropdown>
    </>
  );
}

function App() {
  const [currentStage, setCurrentStage] = useState('overview');

  const currentLabel = currentStage === 'overview'
    ? null
    : STAGES.find(s => s.id === currentStage)?.label;

  return (
    <div className="app">
      <CircleNav currentStage={currentStage} onSelectStage={setCurrentStage} />

      {currentStage !== 'overview' && (
        <h2 className="stage-heading">{currentLabel}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {currentStage === 'overview' ? (
            <OverviewView />
          ) : (
            <StageView stage={currentStage} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
