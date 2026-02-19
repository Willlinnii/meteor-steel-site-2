import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useWheelJourney from '../../hooks/useWheelJourney';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
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
  fused: METEOR_STEEL_STAGES,
};

/* ── Game modes ── */

const GAME_MODES = [
  { id: 'riddle', label: 'Riddle', description: 'Atlas tests your knowledge of each stage. Pass or fail.' },
  { id: 'story', label: 'Story Mode', description: 'Build a fictional story stage by stage. Atlas weaves it together at the end.' },
  { id: 'personal', label: 'Personal Mode', description: 'Share personal experiences at each stage. Atlas weaves them into a mythic portrait.' },
];

const MODE_INTROS = {
  story: [
    "Atlas invites you to forge a story along the Ouroboros path.",
    "At each stage, imagine a scene that fits the theme. When complete, Atlas weaves your fragments into one narrative.",
    "The dragon's body is your road. Its head marks your place.",
  ],
  personal: [
    "Atlas invites you to walk the Ouroboros path through your own life.",
    "At each stage, share a personal experience. When complete, Atlas weaves your stories into a portrait of your journey.",
    "The dragon's body is your road. Its head marks your place.",
  ],
  'fused-story': [
    "Atlas invites you to forge a story where monomyth meets meteor steel.",
    "At each stage, you'll create twice \u2014 first through the hero's journey, then through the forge. Atlas weaves both dimensions into one narrative.",
    "The dragon's body is your road. Its head marks your place.",
  ],
  'fused-personal': [
    "Atlas invites you to walk both the monomyth and meteor steel through your own life.",
    "At each stage, you'll reflect twice \u2014 first on the hero's journey, then on the forge. Atlas weaves both into a mythic portrait.",
    "The dragon's body is your road. Its head marks your place.",
  ],
};

const PERSONAL_PROMPTS = {
  'golden-age': "What's a time when your life felt whole and ordered \u2014 before something disrupted it?",
  'falling-star': "What's a time when you felt called to something new \u2014 an unexpected disruption or invitation?",
  'impact-crater': "What's a time when you crossed a threshold into unknown territory?",
  'forge': "What's a time when you were tested \u2014 trials that shaped who you became?",
  'quenching': "What was your darkest hour \u2014 a moment when something had to break before you could move forward?",
  'integration': "How did you bring your changed self back into your world?",
  'drawing': "When did you arrive as who you truly are \u2014 a moment of full emergence?",
  'new-age': "How has your journey changed not just you, but your world?",
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
  fused: {
    title: 'The Fused Journey',
    intro: [
      "Atlas invites you to walk the Fused Ouroboros \u2014 monomyth and meteor steel in one wheel.",
      "Eight stages around the dragon's coil. At each one, you face two phases: first the hero's journey, then the forge.",
      "The dragon's body is your road. Its head marks your place.",
    ],
    completion: "You have walked the full fused wheel \u2014 monomyth and meteor steel intertwined, from Golden Age through Age of Steel. The hero fell, was forged, and rose. The ouroboros turns.",
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

/* ── Stage prompt helper ── */

function getStagePrompt(gameMode, stop, isCosmic, cosmicChallenge, isFused, fusedPhase) {
  if (isCosmic && cosmicChallenge) return cosmicChallenge.prompt;

  if (isFused) {
    if (fusedPhase === 0) {
      // Monomyth phase
      if (gameMode === 'story') {
        return `[Monomyth] What story element takes shape at the ${stop.label} stage? Think of the hero's journey \u2014 imagine a scene, a character moment, or a turning point.`;
      }
      if (gameMode === 'personal') {
        return PERSONAL_PROMPTS[stop.id] || `[Monomyth] What's a time when the ${stop.label} stage showed up in your life?`;
      }
      return `[Monomyth] Tell me \u2014 what happens at the ${stop.label} stage of the hero's journey? What are the key events, themes, and transformations?`;
    }
    // Steel phase
    if (gameMode === 'story') {
      return `[Meteor Steel] Now \u2014 how does the forge deepen or transform what you just created? What happens to your story at the ${stop.label} stage when fire and steel enter the picture?`;
    }
    if (gameMode === 'personal') {
      return `[Meteor Steel] Now \u2014 how does the meteor steel metaphor illuminate what you just shared? What does the ${stop.label} stage look like when you think of it as forging?`;
    }
    return `[Meteor Steel] Now \u2014 how does the ${stop.label} stage connect to the meteor steel process? What happens when the hero's journey meets the forge?`;
  }

  if (gameMode === 'story') {
    return `What story element takes shape at the ${stop.label} stage? Imagine a scene, a character moment, or a turning point.`;
  }
  if (gameMode === 'personal') {
    return PERSONAL_PROMPTS[stop.id] || `What's a time when the ${stop.label} stage showed up in your life?`;
  }
  return `Tell me \u2014 what happens at the ${stop.label} stage? What are the key events, themes, and transformations here?`;
}

/* ── Smoke puff particle config ── */
// Each particle: angle offset from outward direction (deg), travel distance (vmin), size (vmin), delay (ms)
const SMOKE_PARTICLES = [
  { a: -20, d: 10,  s: 6,   ms: 0 },
  { a:  12, d: 13,  s: 7.5, ms: 50 },
  { a: -40, d: 8,   s: 5,   ms: 100 },
  { a:  28, d: 11,  s: 8,   ms: 70 },
  { a:  -5, d: 14,  s: 4.5, ms: 130 },
  { a:  38, d: 8.5, s: 6.5, ms: 30 },
  { a: -15, d: 15,  s: 9,   ms: 90 },
  { a:  20, d: 9,   s: 4,   ms: 160 },
  { a:   0, d: 12,  s: 9.5, ms: 20 },
  { a: -30, d: 13,  s: 5.5, ms: 110 },
];

/* ── Main component ── */

export default function OuroborosJourneyPage() {
  const { journeyId } = useParams();
  const isCosmic = journeyId === 'cosmic';
  const isFused = journeyId === 'fused';

  const stagesForWheel = STAGES_MAP[journeyId] || MONOMYTH_STAGES;

  // Both hooks called unconditionally (React rules); only one is used
  const wheel = useWheelJourney(journeyId || 'unused', stagesForWheel);
  const cosmic = useCosmicAdapter();

  const journey = isCosmic ? cosmic : wheel;
  const stages = isCosmic ? cosmic.stages : stagesForWheel;
  const totalStages = stages.length;
  const config = JOURNEY_CONFIG[journeyId] || JOURNEY_CONFIG.monomyth;

  /* ── Game mode state (non-cosmic only) ── */
  const [gameMode, setGameMode] = useState(null); // null | 'riddle' | 'story' | 'personal'
  const [fusedPhase, setFusedPhase] = useState(0); // 0=monomyth, 1=steel (fused journey only)

  // Cosmic auto-starts; non-cosmic waits for mode selection
  useEffect(() => {
    if (isCosmic) journey.startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMode = (modeId) => {
    setGameMode(modeId);
    journey.startGame();
  };

  /* ── Synthesis state ── */
  const [synthesizedStory, setSynthesizedStory] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);

  /* ── Chat state ── */
  const [inputText, setInputText] = useState('');

  /* ── Voice ── */
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak } = useVoice(setInputText);
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

  // Determine the intro text based on mode
  const fusedModeKey = isFused && gameMode ? `fused-${gameMode}` : null;
  const introText = (fusedModeKey && MODE_INTROS[fusedModeKey]) || (!isCosmic && gameMode && MODE_INTROS[gameMode]) || config.intro;

  /* ── Smoke puff state ── */
  const [smokePuff, setSmokePuff] = useState(false);
  const smokePuffTimer = useRef(null);

  // Dragon head position: ~55° CW from tail (behind the head, on the body side)
  const noseAngle = getStageAngle(Math.max(idx, 0), totalStages) + 55;
  const noseRad = (noseAngle - 90) * Math.PI / 180;
  const noseR = isCosmic ? 32 : 31;
  const noseX = 50 + noseR * Math.cos(noseRad);
  const noseY = 50 + noseR * Math.sin(noseRad);

  // TTS: speak the stage prompt when arriving at a new stage
  const prevIdxRef = useRef(idx);
  const prevFusedPhaseRef = useRef(fusedPhase);
  useEffect(() => {
    if (!voiceEnabled || idx < 0 || idx >= totalStages || stopDone) return;
    const idxChanged = prevIdxRef.current !== idx;
    const phaseChanged = isFused && prevFusedPhaseRef.current !== fusedPhase;
    if (!idxChanged && !phaseChanged) return;
    prevIdxRef.current = idx;
    prevFusedPhaseRef.current = fusedPhase;
    if (stop && messages.length === 0) {
      const prompt = getStagePrompt(gameMode, stop, isCosmic, cosmicChallenge, isFused, fusedPhase);
      speak(prompt);
    }
  }, [voiceEnabled, speak, idx, totalStages, stopDone, stop, messages.length, gameMode, isCosmic, cosmicChallenge, isFused, fusedPhase]);

  /* ── Synthesis trigger ── */
  useEffect(() => {
    if (!isComplete || isCosmic || !gameMode || gameMode === 'riddle') return;
    if (synthesizedStory || synthesizing) return;

    const stageData = stages.map(s => {
      const prog = journey.stopProgress[s.id];
      const userMessages = (prog?.conversations || [])
        .filter(m => m.role === 'user')
        .map(m => m.content);
      return { stageId: s.id, stageLabel: s.label, userMessages };
    });

    setSynthesizing(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'journey-synthesis', journeyId, gameMode, stageData }),
    })
      .then(r => r.json())
      .then(data => { setSynthesizedStory(data.story || 'Atlas could not weave the story.'); })
      .catch(() => { setSynthesizedStory('Something went wrong while weaving your story.'); })
      .finally(() => { setSynthesizing(false); });
  }, [isComplete, isCosmic, gameMode, synthesizedStory, synthesizing, stages, journey.stopProgress, journeyId]);

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
        : {
            messages: next, mode: 'wheel-journey', journeyId, stageId: stop.id, gameMode: gameMode || 'riddle',
            ...(isFused ? { aspect: fusedPhase === 0 ? 'monomyth' : 'steel' } : {}),
          };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const replyText = data.reply || 'No response.';
      const aMsg = { role: 'assistant', content: replyText };
      const updated = [...next, aMsg];
      setMessages(updated);

      // TTS for Atlas reply
      speak(replyText);

      if (data.passed != null) {
        if (isFused && data.passed) {
          // Fused two-phase handling
          if (fusedPhase === 0) {
            journey.recordResult(stop.id, false, updated); // store conversations, don't complete
            setFusedPhase(1);                               // advance to steel phase
            setMessages([]);                                // clear for new prompt
          } else {
            journey.recordResult(stop.id, true, updated);   // complete the stage
            setFusedPhase(0);                               // reset for next stage
            setSmokePuff(true);
            clearTimeout(smokePuffTimer.current);
            smokePuffTimer.current = setTimeout(() => setSmokePuff(false), 2200);
            setMessages([]);
          }
        } else if (isCosmic) {
          journey.recordResult(stop.id, cosmicLevel, data.passed, updated);
          if (data.passed) {
            setSmokePuff(true);
            clearTimeout(smokePuffTimer.current);
            smokePuffTimer.current = setTimeout(() => setSmokePuff(false), 2200);
            setMessages([]);
          }
        } else {
          journey.recordResult(stop.id, data.passed, updated);
          if (data.passed) {
            setSmokePuff(true);
            clearTimeout(smokePuffTimer.current);
            smokePuffTimer.current = setTimeout(() => setSmokePuff(false), 2200);
            setMessages([]);
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, stop, isCosmic, isFused, fusedPhase, journeyId, journey, cosmicLevel, gameMode, speak]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleAdvance = () => { setMessages([]); journey.advanceToNext(); };
  const handleBegin = () => journey.advanceFromIntro();
  const handleExit = () => window.close();

  /* ── Render ── */

  // Mode selector for non-cosmic journeys (before game starts)
  const showModeSelect = !isCosmic && !gameMode;

  return (
    <div className="ouroboros-page">
      {/* Header */}
      <div className="ouroboros-header">
        <h1 className="ouroboros-title">{config.title}</h1>
        <div className="ouroboros-header-controls">
          <button
            className={`ouro-voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
          <button className="ouroboros-exit" onClick={handleExit} title="Exit">{'\u2715'}</button>
        </div>
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

        {/* Smoke puff from dragon's nose on stage pass */}
        {smokePuff && (
          <div
            className="ouro-smoke-puff"
            style={{ left: `${noseX}%`, top: `${noseY}%` }}
          >
            <div className="ouro-smoke-flash" />
            {SMOKE_PARTICLES.map((p, i) => {
              const pAngle = noseAngle + p.a;
              const pRad = (pAngle - 90) * Math.PI / 180;
              return (
                <div
                  key={i}
                  className="ouro-smoke-particle"
                  style={{ width: `${p.s}vmin`, height: `${p.s}vmin` }}
                  ref={el => {
                    if (!el) return;
                    const tx = p.d * Math.cos(pRad);
                    const ty = p.d * Math.sin(pRad);
                    el.animate([
                      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0, filter: 'blur(1px)' },
                      { opacity: 0.85, offset: 0.1 },
                      { opacity: 0.6, offset: 0.35 },
                      { transform: `translate(calc(-50% + ${tx}vmin), calc(-50% + ${ty}vmin)) scale(3)`, opacity: 0, filter: 'blur(8px)' },
                    ], { duration: 2000, easing: 'ease-out', fill: 'forwards', delay: p.ms });
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Central chat circle */}
        <div className="ouroboros-chat-circle">
          {showModeSelect && (
            <div className="ouro-screen ouro-intro">
              <p>Choose your path along the wheel:</p>
              <div className="ouro-mode-select">
                {GAME_MODES.map(m => (
                  <button key={m.id} className="ouro-mode-btn" onClick={() => handleSelectMode(m.id)}>
                    <span className="ouro-mode-btn-label">{m.label}</span>
                    <span className="ouro-mode-btn-desc">{m.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!showModeSelect && isIntro && (
            <div className="ouro-screen ouro-intro">
              {introText.map((p, i) => <p key={i}>{p}</p>)}
              <button className="ouro-btn" onClick={handleBegin}>Begin</button>
            </div>
          )}

          {!showModeSelect && isComplete && (
            <>
              {(!isCosmic && gameMode && gameMode !== 'riddle') ? (
                <div className="ouro-screen ouro-done">
                  <h3>Journey Complete</h3>
                  {synthesizing && (
                    <div className="ouro-synthesis-loading">
                      <div className="ouro-synthesis-spinner" />
                      <p>Atlas is weaving your story...</p>
                    </div>
                  )}
                  {synthesizedStory && (
                    <div className="ouro-synthesis-readout">
                      {synthesizedStory.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  )}
                  {!synthesizing && !synthesizedStory && (
                    <p>{config.completion}</p>
                  )}
                  <button className="ouro-btn" onClick={handleExit}>Return</button>
                </div>
              ) : (
                <div className="ouro-screen ouro-done">
                  <h3>Journey Complete</h3>
                  <p>{config.completion}</p>
                  <p className="ouro-tally">{journey.completedStops} of {journey.totalStops} completed</p>
                  <button className="ouro-btn" onClick={handleExit}>Return</button>
                </div>
              )}
            </>
          )}

          {!showModeSelect && !isIntro && !isComplete && stop && (
            <div className="ouro-screen ouro-active">
              <div className="ouro-stage-bar">
                <span className="ouro-count">{idx + 1}/{totalStages}</span>
                <span className="ouro-name">{stop.label}</span>
                {isCosmic && <span className="ouro-lvl">Lvl {cosmicLevel}/3</span>}
                {isFused && <span className="ouro-lvl">{fusedPhase === 0 ? 'Monomyth' : 'Meteor Steel'}</span>}
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
                        {getStagePrompt(gameMode, stop, isCosmic, cosmicChallenge, isFused, fusedPhase)}
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
                      placeholder={voiceEnabled ? 'Tap mic or type...' : 'Speak your answer...'}
                      rows={2}
                      disabled={loading}
                    />
                    {voiceEnabled && SpeechRecognition && (
                      <button
                        className={`ouro-mic-btn${recording ? ' recording' : ''}`}
                        onClick={recording ? stopListening : startListening}
                        disabled={loading || speaking}
                        title={recording ? 'Stop recording' : 'Start recording'}
                      >
                        {recording ? '\u{23F9}' : '\u{1F3A4}'}
                      </button>
                    )}
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
