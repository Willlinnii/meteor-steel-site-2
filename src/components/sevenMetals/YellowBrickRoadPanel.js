import React, { useState, useCallback } from 'react';
import challengeData from '../../data/yellowBrickRoad.json';

const { challenges } = challengeData;

function getChallenge(entity, phase, level) {
  const phaseKey = phase === 'ascending' ? 'ascending' : phase === 'descending' ? 'descending' : 'zodiac';
  return challenges[entity]?.[phaseKey]?.[level - 1] || null;
}

function EarthStartScreen({ onBegin }) {
  return (
    <div className="ybr-panel ybr-earth-intro">
      <h2 className="ybr-title">The Yellow Brick Road</h2>
      <div className="ybr-intro-text">
        <p>You stand on Earth, beneath the celestial spheres.</p>
        <p>Above you turn the seven planets — Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn — each carrying a metal, a shadow, and a light. Beyond them wheels the zodiac ring, twelve archetypes of lived experience.</p>
        <p>The road ahead ascends through the planets, traverses the zodiac, then descends back through the planets to Earth. Twenty-six encounters. Each celestial entity will test you three times — first to see if you recognize the pattern, then to see how it lives in you, and finally to see if you can hold both shadow and light.</p>
        <p>There are no wrong answers, only deeper ones.</p>
      </div>
      <button className="ybr-begin-btn" onClick={onBegin}>
        Begin the Journey
      </button>
    </div>
  );
}

function JourneyCompleteScreen({ completedStops, totalStops, onExit }) {
  return (
    <div className="ybr-panel ybr-completion">
      <h2 className="ybr-title">Journey Complete</h2>
      <div className="ybr-intro-text">
        <p>You have walked the Yellow Brick Road — ascending through the planetary spheres, traversing the twelve gates of the zodiac, and descending back through the planets carrying what you've gathered.</p>
        <p>The road was never about reaching a destination. It was about seeing — truly seeing — the patterns that turn through you. Every shadow you named became lighter. Every virtue you claimed became more real.</p>
        <p>You began on Earth. You return to Earth. But the Earth is different now, because you are.</p>
        <p className="ybr-summary">{completedStops} of {totalStops} encounters completed.</p>
      </div>
      <button className="ybr-begin-btn" onClick={onExit}>
        Return to Celestial Clocks
      </button>
    </div>
  );
}

function LevelDots({ currentLevel, passed }) {
  return (
    <div className="ybr-level-indicator">
      {[1, 2, 3].map(l => (
        <span
          key={l}
          className={`ybr-level-dot${passed[l - 1] ? ' passed' : l === currentLevel ? ' current' : ' future'}`}
        />
      ))}
    </div>
  );
}

function PreviousExchanges({ conversations, passed }) {
  const completed = [];
  for (let i = 0; i < 3; i++) {
    if (passed[i] && conversations[i]?.length > 0) {
      completed.push({ level: i + 1, msgs: conversations[i] });
    }
  }
  if (completed.length === 0) return null;
  return (
    <div className="ybr-previous-exchanges">
      {completed.map(({ level, msgs }) => (
        <details key={level} className="ybr-exchange-detail">
          <summary className="ybr-exchange-summary">Level {level} — Passed</summary>
          <div className="ybr-exchange-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span className="chat-msg-text">{m.content}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function YellowBrickRoadPanel({
  currentStopIndex,
  stopProgress,
  journeyComplete,
  journeySequence,
  completedStops,
  totalStops,
  onAdvanceFromEarth,
  onRecordResult,
  onAdvanceToNext,
  onExit,
  isStopComplete,
}) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [atlasMode, setAtlasMode] = useState(false);
  const [atlasMessages, setAtlasMessages] = useState([]);
  const [atlasInput, setAtlasInput] = useState('');
  const [atlasLoading, setAtlasLoading] = useState(false);

  // Derive stop data (safe even when currentStopIndex is out of range)
  const stop = (currentStopIndex >= 0 && currentStopIndex < journeySequence.length)
    ? journeySequence[currentStopIndex] : null;
  const progress = stop
    ? (stopProgress[stop.id] || { level: 0, conversations: [[], [], []], passed: [false, false, false] })
    : { level: 0, conversations: [[], [], []], passed: [false, false, false] };
  const currentLevel = progress.passed[0] ? (progress.passed[1] ? (progress.passed[2] ? 3 : 3) : 2) : 1;
  const stopDone = progress.passed.every(p => p);
  const challenge = stop ? getChallenge(stop.entity, stop.phase, currentLevel) : null;
  const phaseLabel = stop?.phase === 'ascending' ? 'Ascending' : stop?.phase === 'descending' ? 'Descending' : 'Zodiac Ring';
  const nextStop = currentStopIndex < 25 ? journeySequence[currentStopIndex + 1] : null;

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || loading || !stop) return;
    const userMsg = { role: 'user', content: inputText.trim() };
    const newMessages = [...currentMessages, userMsg];
    setCurrentMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: 'ybr-challenge',
          challengeStop: stop.id,
          level: currentLevel,
          area: 'celestial-clocks',
        }),
      });
      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.reply || 'No response.' };
      const updatedMessages = [...newMessages, assistantMsg];
      setCurrentMessages(updatedMessages);

      if (data.passed != null) {
        onRecordResult(stop.id, currentLevel, data.passed, updatedMessages);
        if (data.passed) {
          setCurrentMessages([]);
        }
      }
    } catch (err) {
      setCurrentMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, currentMessages, stop, currentLevel, onRecordResult]);

  const handleAtlasSend = useCallback(async () => {
    if (!atlasInput.trim() || atlasLoading || !stop) return;
    const userMsg = { role: 'user', content: atlasInput.trim() };
    const newMessages = [...atlasMessages, userMsg];
    setAtlasMessages(newMessages);
    setAtlasInput('');
    setAtlasLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: 'ybr-atlas-hint',
          challengeStop: stop.id,
          level: currentLevel,
          area: 'celestial-clocks',
        }),
      });
      const data = await res.json();
      setAtlasMessages([...newMessages, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch {
      setAtlasMessages([...newMessages, { role: 'assistant', content: 'Atlas is unavailable right now.' }]);
    } finally {
      setAtlasLoading(false);
    }
  }, [atlasInput, atlasLoading, atlasMessages, stop, currentLevel]);

  const handleKeyDown = (e, sendFn) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFn();
    }
  };

  const handleAdvance = () => {
    setCurrentMessages([]);
    setAtlasMessages([]);
    setAtlasMode(false);
    onAdvanceToNext();
  };

  // Early returns after all hooks
  if (currentStopIndex === -1) {
    return <EarthStartScreen onBegin={onAdvanceFromEarth} />;
  }
  if (journeyComplete || currentStopIndex >= 26) {
    return <JourneyCompleteScreen completedStops={completedStops} totalStops={totalStops} onExit={onExit} />;
  }
  if (!stop) return null;

  return (
    <div className="ybr-panel">
      <div className="ybr-challenge-header">
        <div className="ybr-phase-label">{phaseLabel} · Stop {currentStopIndex + 1} of {totalStops}</div>
        <h2 className="ybr-entity-name">{stop.entity}</h2>
        <div className="ybr-entity-type">{stop.type === 'planet' ? 'Planet' : 'Zodiac Sign'}</div>
        <LevelDots currentLevel={currentLevel} passed={progress.passed} />
      </div>

      <PreviousExchanges conversations={progress.conversations} passed={progress.passed} />

      {stopDone ? (
        <div className="ybr-stop-complete">
          <p className="ybr-farewell">
            {stop.type === 'planet'
              ? `${stop.entity} releases you. The gate opens ahead.`
              : `${stop.entity} nods. The wheel turns onward.`}
          </p>
          <button className="ybr-advance-btn" onClick={handleAdvance}>
            {nextStop ? `Continue to ${nextStop.entity}` : 'Return to Earth'}
          </button>
        </div>
      ) : (
        <>
          {challenge && (
            <div className="ybr-challenge-prompt">
              <div className="ybr-prompt-level">Level {currentLevel}</div>
              <p className="ybr-prompt-text">{challenge.prompt}</p>
            </div>
          )}

          <div className="ybr-chat-panel">
            {currentMessages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span className="chat-msg-text">{m.content}</span>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <span className="chat-msg-text ybr-typing">...</span>
              </div>
            )}
          </div>

          <div className="ybr-input-row">
            <textarea
              className="ybr-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleSend)}
              placeholder="Speak your answer..."
              rows={2}
              disabled={loading}
            />
            <button className="ybr-send-btn" onClick={handleSend} disabled={loading || !inputText.trim()}>
              Send
            </button>
          </div>

          <div className="ybr-atlas-section">
            <button
              className={`ybr-atlas-hint-btn${atlasMode ? ' active' : ''}`}
              onClick={() => setAtlasMode(!atlasMode)}
            >
              {atlasMode ? 'Hide Atlas' : 'Ask Atlas for a hint'}
            </button>

            {atlasMode && (
              <div className="ybr-atlas-panel">
                <div className="ybr-chat-panel ybr-atlas-chat">
                  {atlasMessages.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role}`}>
                      <span className="chat-msg-text">{m.content}</span>
                    </div>
                  ))}
                  {atlasLoading && (
                    <div className="chat-msg assistant">
                      <span className="chat-msg-text ybr-typing">...</span>
                    </div>
                  )}
                </div>
                <div className="ybr-input-row">
                  <textarea
                    className="ybr-input ybr-atlas-input"
                    value={atlasInput}
                    onChange={e => setAtlasInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, handleAtlasSend)}
                    placeholder="Ask Atlas..."
                    rows={1}
                    disabled={atlasLoading}
                  />
                  <button className="ybr-send-btn ybr-atlas-send" onClick={handleAtlasSend} disabled={atlasLoading || !atlasInput.trim()}>
                    Ask
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
