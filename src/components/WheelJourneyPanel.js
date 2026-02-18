import React, { useState, useCallback } from 'react';

function IntroScreen({ onBegin, introText }) {
  return (
    <div className="ybr-panel ybr-earth-intro">
      <h2 className="ybr-title">Walk the Wheel</h2>
      <div className="ybr-intro-text">
        {introText.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <button className="ybr-begin-btn" onClick={onBegin}>
        Begin the Journey
      </button>
    </div>
  );
}

function JourneyCompleteScreen({ completedStops, totalStops, onExit, completionText, returnLabel }) {
  return (
    <div className="ybr-panel ybr-completion">
      <h2 className="ybr-title">Journey Complete</h2>
      <div className="ybr-intro-text">
        {completionText.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <p className="ybr-summary">{completedStops} of {totalStops} stages completed.</p>
      </div>
      <button className="ybr-begin-btn" onClick={onExit}>
        {returnLabel}
      </button>
    </div>
  );
}

function ProgressDots({ stages, currentStopIndex, stopProgress }) {
  return (
    <div className="ybr-level-indicator">
      {stages.map((s, i) => {
        const passed = stopProgress[s.id]?.passed;
        const isCurrent = i === currentStopIndex;
        return (
          <span
            key={s.id}
            className={`ybr-level-dot${passed ? ' passed' : isCurrent ? ' current' : ' future'}`}
            title={s.label}
          />
        );
      })}
    </div>
  );
}

export default function WheelJourneyPanel({
  journeyId,
  stages,
  currentStopIndex,
  stopProgress,
  journeyComplete,
  completedStops,
  totalStops,
  onAdvanceFromIntro,
  onRecordResult,
  onAdvanceToNext,
  onExit,
  introText,
  completionText,
  returnLabel,
}) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMessages, setCurrentMessages] = useState([]);

  const stop = (currentStopIndex >= 0 && currentStopIndex < stages.length)
    ? stages[currentStopIndex] : null;
  const progress = stop
    ? (stopProgress[stop.id] || { conversations: [], passed: false })
    : { conversations: [], passed: false };
  const stopDone = progress.passed;
  const nextStop = (currentStopIndex < stages.length - 1) ? stages[currentStopIndex + 1] : null;

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
          mode: 'wheel-journey',
          journeyId,
          stageId: stop.id,
        }),
      });
      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.reply || 'No response.' };
      const updatedMessages = [...newMessages, assistantMsg];
      setCurrentMessages(updatedMessages);

      if (data.passed != null) {
        onRecordResult(stop.id, data.passed, updatedMessages);
        if (data.passed) {
          setCurrentMessages([]);
        }
      }
    } catch {
      setCurrentMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, currentMessages, stop, journeyId, onRecordResult]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAdvance = () => {
    setCurrentMessages([]);
    onAdvanceToNext();
  };

  // Intro screen
  if (currentStopIndex === -1) {
    return <IntroScreen onBegin={onAdvanceFromIntro} introText={introText} />;
  }

  // Complete screen
  if (journeyComplete || currentStopIndex >= stages.length) {
    return (
      <JourneyCompleteScreen
        completedStops={completedStops}
        totalStops={totalStops}
        onExit={onExit}
        completionText={completionText}
        returnLabel={returnLabel}
      />
    );
  }

  if (!stop) return null;

  return (
    <div className="ybr-panel">
      <div className="ybr-challenge-header">
        <div className="ybr-phase-label">Stage {currentStopIndex + 1} of {totalStops}</div>
        <h2 className="ybr-entity-name">{stop.label}</h2>
        <ProgressDots stages={stages} currentStopIndex={currentStopIndex} stopProgress={stopProgress} />
      </div>

      {stopDone ? (
        <div className="ybr-stop-complete">
          <p className="ybr-farewell">
            Atlas nods. "Well spoken. The wheel turns onward."
          </p>
          <button className="ybr-advance-btn" onClick={handleAdvance}>
            {nextStop ? `Continue to ${nextStop.label}` : 'Complete the Journey'}
          </button>
        </div>
      ) : (
        <>
          <div className="ybr-challenge-prompt">
            <p className="ybr-prompt-text">
              Atlas looks at you. "Tell me — what happens at the <strong>{stop.label}</strong> stage of the journey? What are the key events, themes, and transformations here?"
            </p>
            <p className="ybr-prompt-text" style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 8 }}>
              Explore this stage's content on the page before answering if you'd like.
            </p>
          </div>

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
              onKeyDown={handleKeyDown}
              placeholder="Describe what happens at this stage..."
              rows={2}
              disabled={loading}
            />
            <button className="ybr-send-btn" onClick={handleSend} disabled={loading || !inputText.trim()}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
