import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useWheelJourney from '../../hooks/useWheelJourney';
import useMultiLevelJourney from '../../hooks/useMultiLevelJourney';
import useVoice, { SpeechRecognition } from '../../hooks/useVoice';
import useYellowBrickRoad from '../../components/chronosphaera/useYellowBrickRoad';
import challengeData from '../../data/yellowBrickRoad.json';
import JOURNEY_DEFS from '../../data/journeyDefs';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useWritings } from '../../writings/WritingsContext';
import './OuroborosJourneyPage.css';
import { apiFetch } from '../../lib/chatApi';
import ShareCompletionModal from '../../components/fellowship/ShareCompletionModal';
import StageMoments from '../../components/fellowship/StageMoments';

const { challenges } = challengeData;

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

/* ── Geometry helpers ── */

// Two coordinate systems, both 0° = 12 o'clock, measured CW:
//
// DRAGON (original unflipped image):
//   Mouth tip ≈ 76°, Tail tip ≈ 82°, body fills the rest.
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
const TAIL_TIP = 82;

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

function getStagePrompt(gameMode, stop, isMultiLevel, cosmicChallenge, isFusedJourney, fusedPhase) {
  if (isMultiLevel && cosmicChallenge) return cosmicChallenge.prompt;

  if (isFusedJourney) {
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
  const def = JOURNEY_DEFS[journeyId] || JOURNEY_DEFS.monomyth;
  const isMultiLevel = def.challengeMode === 'cosmic';
  const isFusedJourney = !!def.isFused;

  // All 3 hooks called unconditionally (React rules); only one is used
  const wheel = useWheelJourney(journeyId || 'unused', def.stages || []);
  const multiLevel = useMultiLevelJourney(journeyId || 'unused', def.stages || [], def.levelsPerStop || 3);
  const cosmicAdapter = useCosmicAdapter();

  const journey = journeyId === 'cosmic' ? cosmicAdapter : isMultiLevel ? multiLevel : wheel;
  const stages = journeyId === 'cosmic' ? cosmicAdapter.stages : (def.stages || []);
  const totalStages = stages.length;

  const { trackElement, trackTime } = useCoursework();
  const { addJourneySynthesis } = useWritings();

  /* ── Game mode state (non-autoStart only) ── */
  const [gameMode, setGameMode] = useState(null); // null | 'riddle' | 'story' | 'personal'
  const [fusedPhase, setFusedPhase] = useState(0); // 0=monomyth, 1=steel (fused journey only)

  const idx = journey.currentStopIndex;

  // Page visit tracking
  useEffect(() => {
    trackElement(`journeys.${journeyId}.visited`);
  }, [trackElement, journeyId]);

  // Time tracking per stage
  const timeRef = useRef({ idx, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0 && prev.idx >= 0) trackTime(`journeys.${journeyId}.stage.${prev.idx}.time`, elapsed);
    timeRef.current = { idx, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0 && cur.idx >= 0) trackTime(`journeys.${journeyId}.stage.${cur.idx}.time`, secs);
    };
  }, [idx, journeyId, trackTime]);

  // Auto-start journeys start immediately; others wait for mode selection
  useEffect(() => {
    if (def.autoStart) journey.startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMode = (modeId) => {
    trackElement(`journeys.${journeyId}.mode.${modeId}`);
    setGameMode(modeId);
    journey.startGame();
  };

  /* ── Synthesis state ── */
  const [synthesizedStory, setSynthesizedStory] = useState(null);
  const [showFellowshipShare, setShowFellowshipShare] = useState(false);
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
  const stop = (idx >= 0 && idx < totalStages) ? stages[idx] : null;

  const cosmicProg = isMultiLevel && stop
    ? (journey.stopProgress[stop.id] || { passed: Array(def.levelsPerStop).fill(false) })
    : null;
  const cosmicLevel = cosmicProg
    ? Math.min(cosmicProg.passed.filter(Boolean).length + 1, def.levelsPerStop)
    : 1;
  const stopDone = stop && (
    isMultiLevel
      ? journey.isStopComplete(stop.id)
      : !!journey.stopProgress[stop.id]?.passed
  );

  const cosmicChallenge = isMultiLevel && stop
    ? getCosmicChallenge(stop.entity, stop.phase, cosmicLevel)
    : null;

  const isIntro = idx === -1;
  const isComplete = journey.journeyComplete || idx >= totalStages;
  const rotation = getDragonRotation(idx, totalStages);

  // Determine the intro text based on mode
  const fusedModeKey = isFusedJourney && gameMode ? `fused-${gameMode}` : null;
  const introText = (fusedModeKey && MODE_INTROS[fusedModeKey]) || (!def.autoStart && gameMode && MODE_INTROS[gameMode]) || def.intro;

  /* ── Smoke puff state ── */
  const [smokePuff, setSmokePuff] = useState(false);
  const smokePuffTimer = useRef(null);

  // Dragon head position: ~55° CW from tail (behind the head, on the body side)
  const noseAngle = getStageAngle(Math.max(idx, 0), totalStages) + 55;
  const noseRad = (noseAngle - 90) * Math.PI / 180;
  const noseR = def.dotRadius;
  const noseX = 50 + noseR * Math.cos(noseRad);
  const noseY = 50 + noseR * Math.sin(noseRad);

  // TTS: speak the stage prompt when arriving at a new stage
  const prevIdxRef = useRef(idx);
  const prevFusedPhaseRef = useRef(fusedPhase);
  useEffect(() => {
    if (!voiceEnabled || idx < 0 || idx >= totalStages || stopDone) return;
    const idxChanged = prevIdxRef.current !== idx;
    const phaseChanged = isFusedJourney && prevFusedPhaseRef.current !== fusedPhase;
    if (!idxChanged && !phaseChanged) return;
    prevIdxRef.current = idx;
    prevFusedPhaseRef.current = fusedPhase;
    if (stop && messages.length === 0) {
      const prompt = getStagePrompt(gameMode, stop, isMultiLevel, cosmicChallenge, isFusedJourney, fusedPhase);
      speak(prompt);
    }
  }, [voiceEnabled, speak, idx, totalStages, stopDone, stop, messages.length, gameMode, isMultiLevel, cosmicChallenge, isFusedJourney, fusedPhase]);

  // Track journey completion
  const completionTracked = useRef(false);
  useEffect(() => {
    if (isComplete && !completionTracked.current) {
      completionTracked.current = true;
      trackElement(`journeys.${journeyId}.completed`);
    }
  }, [isComplete, journeyId, trackElement]);

  /* ── Synthesis trigger ── */
  useEffect(() => {
    if (!isComplete || isMultiLevel || !gameMode || gameMode === 'riddle') return;
    if (synthesizedStory || synthesizing) return;

    const stageData = stages.map(s => {
      const prog = journey.stopProgress[s.id];
      const userMessages = (prog?.conversations || [])
        .filter(m => m.role === 'user')
        .map(m => m.content);
      return { stageId: s.id, stageLabel: s.label, userMessages };
    });

    setSynthesizing(true);
    apiFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'journey-synthesis', journeyId, gameMode, stageData }),
    })
      .then(r => r.json())
      .then(data => {
        const story = data.story || 'Atlas could not weave the story.';
        setSynthesizedStory(story);
        if (data.story) addJourneySynthesis(journeyId, gameMode, story);
      })
      .catch(() => { setSynthesizedStory('Something went wrong while weaving your story.'); })
      .finally(() => { setSynthesizing(false); });
  }, [isComplete, isMultiLevel, gameMode, synthesizedStory, synthesizing, stages, journey.stopProgress, journeyId, addJourneySynthesis]);

  /* ── Handlers ── */

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || loading || !stop) return;
    const userMsg = { role: 'user', content: inputText.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInputText('');
    setLoading(true);

    const completedStageLabels = stages
      .filter(s => journey.stopProgress[s.id]?.passed)
      .map(s => s.label);
    const journeyState = [
      `Journey: ${def.label}`,
      `Mode: ${gameMode || (isMultiLevel ? 'cosmic challenge' : 'riddle')}`,
      `Current stage: ${stop.label} (${idx + 1}/${totalStages})`,
      `Completed: ${journey.completedStops}/${journey.totalStops}`,
      completedStageLabels.length > 0 ? `Passed: ${completedStageLabels.join(', ')}` : null,
      isFusedJourney ? `Fused phase: ${fusedPhase === 0 ? 'monomyth' : 'steel'}` : null,
      isMultiLevel ? `Cosmic level: ${cosmicLevel}` : null,
    ].filter(Boolean).join('\n');

    try {
      const body = isMultiLevel
        ? { messages: next, mode: 'ybr-challenge', challengeStop: stop.id, level: cosmicLevel, area: 'celestial-clocks', journeyState }
        : {
            messages: next, mode: 'wheel-journey', journeyId, stageId: stop.id, gameMode: gameMode || 'riddle', journeyState,
            ...(isFusedJourney ? { aspect: fusedPhase === 0 ? 'monomyth' : 'steel' } : {}),
          };

      const res = await apiFetch('/api/chat', {
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
        if (isFusedJourney && data.passed) {
          // Fused two-phase handling
          if (fusedPhase === 0) {
            trackElement(`journeys.${journeyId}.stage.${stop.id}.monomyth.passed`);
            journey.recordResult(stop.id, false, updated); // store conversations, don't complete
            setFusedPhase(1);                               // advance to steel phase
            setMessages([]);                                // clear for new prompt
          } else {
            trackElement(`journeys.${journeyId}.stage.${stop.id}.steel.passed`);
            trackElement(`journeys.${journeyId}.stage.${stop.id}.completed`);
            journey.recordResult(stop.id, true, updated);   // complete the stage
            setFusedPhase(0);                               // reset for next stage
            setSmokePuff(true);
            clearTimeout(smokePuffTimer.current);
            smokePuffTimer.current = setTimeout(() => setSmokePuff(false), 2200);
            setMessages([]);
          }
        } else if (isMultiLevel) {
          journey.recordResult(stop.id, cosmicLevel, data.passed, updated);
          if (data.passed) {
            trackElement(`journeys.${journeyId}.${stop.id}.level.${cosmicLevel}.passed`);
            setSmokePuff(true);
            clearTimeout(smokePuffTimer.current);
            smokePuffTimer.current = setTimeout(() => setSmokePuff(false), 2200);
            setMessages([]);
          }
        } else {
          journey.recordResult(stop.id, data.passed, updated);
          if (data.passed) {
            trackElement(`journeys.${journeyId}.stage.${stop.id}.completed`);
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
  }, [inputText, loading, messages, stop, isMultiLevel, isFusedJourney, fusedPhase, journeyId, journey, cosmicLevel, gameMode, speak, trackElement]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleAdvance = () => { setMessages([]); journey.advanceToNext(); };
  const handleBegin = () => journey.advanceFromIntro();
  const handleExit = () => window.close();

  /* ── Render ── */

  // Mode selector for non-autoStart journeys (before game starts)
  const showModeSelect = !def.autoStart && !gameMode;

  return (
    <div className="ouroboros-page">
      {/* Header */}
      <div className="ouroboros-header">
        <h1 className="ouroboros-title">{def.title}</h1>
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

      <div className={`ouroboros-arena${def.cssClass ? ` ${def.cssClass}` : ''}`}>
        {/* Stage nodes — positioned ON the dragon's body */}
        {stages.map((stage, i) => {
          const angle = getStageAngle(i, totalStages);
          const rad = (angle - 90) * Math.PI / 180;
          // ~31% radius places dots on the dragon body centerline
          const r = def.dotRadius;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);

          let state = 'future';
          if (isMultiLevel) {
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
              {(!isMultiLevel && gameMode && gameMode !== 'riddle') ? (
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
                    <p>{def.completion}</p>
                  )}
                  {!synthesizing && (
                    <button className="fellowship-share-btn" onClick={() => setShowFellowshipShare(true)}>Share with your Fellows?</button>
                  )}
                  <button className="ouro-btn" onClick={handleExit}>Return</button>
                  {showFellowshipShare && (
                    <ShareCompletionModal
                      completionType="journey"
                      completionId={`${journeyId}-${gameMode}`}
                      completionLabel={def.title}
                      completionData={{ journeyId, gameMode, synthesizedStory, stages: stages.map(s => s.label), title: def.title }}
                      onClose={() => setShowFellowshipShare(false)}
                      onPosted={() => setShowFellowshipShare(false)}
                    />
                  )}
                </div>
              ) : (
                <div className="ouro-screen ouro-done">
                  <h3>Journey Complete</h3>
                  <p>{def.completion}</p>
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
                {isMultiLevel && <span className="ouro-lvl">Lvl {cosmicLevel}/{def.levelsPerStop}</span>}
                {isFusedJourney && <span className="ouro-lvl">{fusedPhase === 0 ? 'Monomyth' : 'Meteor Steel'}</span>}
              </div>

              <StageMoments journeyId={journeyId} stageId={stop?.id} />

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
                        {getStagePrompt(gameMode, stop, isMultiLevel, cosmicChallenge, isFusedJourney, fusedPhase)}
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
