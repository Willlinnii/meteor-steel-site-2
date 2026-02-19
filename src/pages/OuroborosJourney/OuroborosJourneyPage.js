import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useWheelJourney from '../../hooks/useWheelJourney';
import useYellowBrickRoad from '../../components/sevenMetals/useYellowBrickRoad';
import challengeData from '../../data/yellowBrickRoad.json';
import './OuroborosJourneyPage.css';

const { challenges } = challengeData;

/* ── Stage definitions ── */

const MONOMYTH_STAGES = [
  { id: 'golden-age', label: 'Surface' },
  { id: 'falling-star', label: 'Calling' },
  { id: 'impact-crater', label: 'Crossing' },
  { id: 'forge', label: 'Initiating' },
  { id: 'quenching', label: 'Nadir' },
  { id: 'integration', label: 'Return' },
  { id: 'drawing', label: 'Arrival' },
  { id: 'new-age', label: 'Renewal' },
];

const METEOR_STEEL_STAGES = [
  { id: 'golden-age', label: 'Golden Age' },
  { id: 'falling-star', label: 'Calling Star' },
  { id: 'impact-crater', label: 'Crater Crossing' },
  { id: 'forge', label: 'Trials of Forge' },
  { id: 'quenching', label: 'Quench' },
  { id: 'integration', label: 'Integration' },
  { id: 'drawing', label: 'Draw' },
  { id: 'new-age', label: 'Age of Steel' },
];

const STAGES_MAP = {
  monomyth: MONOMYTH_STAGES,
  'meteor-steel': METEOR_STEEL_STAGES,
};

const JOURNEY_CONFIG = {
  monomyth: {
    title: 'The Monomyth Journey',
    intro: [
      "Atlas invites you to walk the Ouroboros path of the Monomyth.",
      "Eight stages around the dragon's coil. At each one, Atlas will test your knowledge of the hero's journey.",
      "The dragon's body is your road. Its head marks your place.",
    ],
    completion: "You have walked the full circle of the Monomyth \u2014 from Surface through Renewal. The hero's journey is complete. The ouroboros turns.",
  },
  'meteor-steel': {
    title: 'The Meteor Steel Journey',
    intro: [
      "Atlas invites you to walk the Ouroboros path of Meteor Steel.",
      "Eight stages around the dragon's coil \u2014 from Golden Age to Age of Steel.",
      "At each stop, tell Atlas what happens at that stage of the transformation.",
    ],
    completion: "You have walked the full wheel of Meteor Steel \u2014 from Golden Age through Age of Steel. The meteorite fell. The forge burned. The blade was drawn. The ouroboros turns.",
  },
  cosmic: {
    title: 'The Cosmic Journey',
    intro: [
      "Atlas invites you to walk the Cosmic Ouroboros.",
      "Twenty-six encounters \u2014 ascending through the planetary spheres, traversing the zodiac, and descending back to Earth.",
      "Each celestial entity will test you three times. The dragon coils through all of them.",
    ],
    completion: "You have walked the Yellow Brick Road \u2014 ascending through the planetary spheres, traversing the zodiac, and descending back to Earth. The road was never about reaching a destination.",
  },
};

/* ── Geometry helpers ── */

// Two coordinate systems, both 0° = 12 o'clock, measured CW:
//
// DRAGON (original unflipped image):
//   Mouth tip ≈ 55°, Tail tip ≈ 125°, body fills the rest.
//   TAIL_TIP is the tail-tip angle in the original image.
//
// DOTS (stage nodes behind the dragon):
//   Stage 0 = 0° (top), each stage spaced 360°/total apart.
//
// Alignment: rotate the dragon so its tail tip sits on the current dot.
//
// CSS `scaleX(-1) rotate(R)` maps original angle θ → (360 − θ) + R.
// To place the tail tip at `target`:
//   (360 − TAIL_TIP) + R = target  ⟹  R = target + TAIL_TIP − 360
//   equivalently  R = target + TAIL_TIP  (mod 360, kept continuous)
const TAIL_TIP = 125;

function getStageAngle(index, total) {
  return index * (360 / total);
}

function getDragonRotation(stageIndex, total) {
  const target = stageIndex < 0 ? 0 : getStageAngle(stageIndex, total);
  return target + TAIL_TIP;
}

/* ── Cosmic challenge lookup ── */

function getCosmicChallenge(entity, phase, level) {
  const phaseKey = phase === 'ascending' ? 'ascending'
    : phase === 'descending' ? 'descending' : 'zodiac';
  return challenges[entity]?.[phaseKey]?.[level - 1] || null;
}

/* ── Cosmic adapter hook (maps useYellowBrickRoad → unified shape) ── */

function useCosmicAdapter() {
  const ybr = useYellowBrickRoad();

  const stages = ybr.journeySequence.map(stop => ({
    id: stop.id,
    label: stop.entity,
    entity: stop.entity,
    phase: stop.phase,
    type: stop.type,
  }));

  return {
    active: ybr.active,
    currentStopIndex: ybr.currentStopIndex,
    stopProgress: ybr.stopProgress,
    journeyComplete: ybr.journeyComplete,
    completedStops: ybr.completedStops,
    totalStops: ybr.totalStops,
    stages,
    startGame: ybr.startGame,
    advanceFromIntro: ybr.advanceFromEarth,
    recordResult: ybr.recordChallengeResult,
    advanceToNext: ybr.advanceToNextStop,
    exitGame: ybr.exitGame,
    isStopComplete: ybr.isStopComplete,
  };
}

/* ── Main component ── */

export default function OuroborosJourneyPage() {
  const { journeyId } = useParams();
  const isCosmic = journeyId === 'cosmic';

  const stagesForWheel = STAGES_MAP[journeyId] || MONOMYTH_STAGES;

  // Both hooks called unconditionally (React rules); only one is used
  const wheel = useWheelJourney(journeyId || 'unused', stagesForWheel);
  const cosmic = useCosmicAdapter();

  const journey = isCosmic ? cosmic : wheel;
  const stages = isCosmic ? cosmic.stages : stagesForWheel;
  const totalStages = stages.length;
  const config = JOURNEY_CONFIG[journeyId] || JOURNEY_CONFIG.monomyth;

  // Auto-start the journey on mount
  useEffect(() => {
    journey.startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Chat state ── */
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Derived state ── */
  const idx = journey.currentStopIndex;
  const stop = (idx >= 0 && idx < totalStages) ? stages[idx] : null;

  const cosmicProg = isCosmic && stop
    ? (journey.stopProgress[stop.id] || { passed: [false, false, false] })
    : null;
  const cosmicLevel = cosmicProg
    ? (cosmicProg.passed[0] ? (cosmicProg.passed[1] ? 3 : 2) : 1)
    : 1;
  const stopDone = stop && (
    isCosmic
      ? (cosmicProg?.passed?.every(Boolean) || false)
      : !!journey.stopProgress[stop.id]?.passed
  );

  const cosmicChallenge = isCosmic && stop
    ? getCosmicChallenge(stop.entity, stop.phase, cosmicLevel)
    : null;

  const isIntro = idx === -1;
  const isComplete = journey.journeyComplete || idx >= totalStages;
  const rotation = getDragonRotation(idx, totalStages);

  /* ── Handlers ── */

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || loading || !stop) return;
    const userMsg = { role: 'user', content: inputText.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInputText('');
    setLoading(true);

    try {
      const body = isCosmic
        ? { messages: next, mode: 'ybr-challenge', challengeStop: stop.id, level: cosmicLevel, area: 'celestial-clocks' }
        : { messages: next, mode: 'wheel-journey', journeyId, stageId: stop.id };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const aMsg = { role: 'assistant', content: data.reply || 'No response.' };
      const updated = [...next, aMsg];
      setMessages(updated);

      if (data.passed != null) {
        if (isCosmic) {
          journey.recordResult(stop.id, cosmicLevel, data.passed, updated);
        } else {
          journey.recordResult(stop.id, data.passed, updated);
        }
        if (data.passed) setMessages([]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, stop, isCosmic, journeyId, journey, cosmicLevel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleAdvance = () => { setMessages([]); journey.advanceToNext(); };
  const handleBegin = () => journey.advanceFromIntro();
  const handleExit = () => window.close();

  /* ── Render ── */

  return (
    <div className="ouroboros-page">
      {/* Header */}
      <div className="ouroboros-header">
        <h1 className="ouroboros-title">{config.title}</h1>
        <button className="ouroboros-exit" onClick={handleExit} title="Exit">{'\u2715'}</button>
      </div>

      <div className={`ouroboros-arena${isCosmic ? ' cosmic' : ''}`}>
        {/* Stage nodes — positioned ON the dragon's body */}
        {stages.map((stage, i) => {
          const angle = getStageAngle(i, totalStages);
          const rad = (angle - 90) * Math.PI / 180;
          // ~31% radius places dots on the dragon body centerline
          const r = isCosmic ? 32 : 31;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);

          let state = 'future';
          if (isCosmic) {
            if (journey.isStopComplete(stage.id)) state = 'completed';
            else if (i === idx) state = 'current';
          } else {
            if (journey.stopProgress[stage.id]?.passed) state = 'completed';
            else if (i === idx) state = 'current';
          }

          return (
            <div
              key={stage.id}
              className={`ouroboros-node ${state}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="ouroboros-dot" />
              <span className="ouroboros-label">{stage.label}</span>
            </div>
          );
        })}

        {/* Dragon image — flipped so mouth faces the other way */}
        <img
          className="ouroboros-dragon"
          src="/images/ouroboros-dragon.png"
          alt="Ouroboros Dragon"
          style={{ transform: `scaleX(-1) rotate(${rotation + 180}deg)` }}
        />

        {/* Central chat circle */}
        <div className="ouroboros-chat-circle">
          {isIntro && (
            <div className="ouro-screen ouro-intro">
              {config.intro.map((p, i) => <p key={i}>{p}</p>)}
              <button className="ouro-btn" onClick={handleBegin}>Begin</button>
            </div>
          )}

          {isComplete && (
            <div className="ouro-screen ouro-done">
              <h3>Journey Complete</h3>
              <p>{config.completion}</p>
              <p className="ouro-tally">{journey.completedStops} of {journey.totalStops} completed</p>
              <button className="ouro-btn" onClick={handleExit}>Return</button>
            </div>
          )}

          {!isIntro && !isComplete && stop && (
            <div className="ouro-screen ouro-active">
              <div className="ouro-stage-bar">
                <span className="ouro-count">{idx + 1}/{totalStages}</span>
                <span className="ouro-name">{stop.label}</span>
                {isCosmic && <span className="ouro-lvl">Lvl {cosmicLevel}/3</span>}
              </div>

              {stopDone ? (
                <div className="ouro-passed">
                  <p>Atlas nods. The dragon turns onward.</p>
                  <button className="ouro-btn" onClick={handleAdvance}>
                    {idx < totalStages - 1 ? `Continue to ${stages[idx + 1].label}` : 'Complete the Journey'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="ouro-messages">
                    {messages.length === 0 && (
                      <p className="ouro-prompt">
                        {isCosmic && cosmicChallenge
                          ? cosmicChallenge.prompt
                          : `Tell me \u2014 what happens at the ${stop.label} stage? What are the key events, themes, and transformations here?`}
                      </p>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={`ouro-msg ${m.role}`}>{m.content}</div>
                    ))}
                    {loading && <div className="ouro-msg assistant ouro-typing">...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="ouro-input">
                    <textarea
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Speak your answer..."
                      rows={2}
                      disabled={loading}
                    />
                    <button onClick={handleSend} disabled={loading || !inputText.trim()}>Send</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
