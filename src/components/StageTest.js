import React from 'react';
import './StageTest.css';

/**
 * Presentational test component.
 * Renders at the bottom of content when coursework mode is on.
 * All state is managed externally via useTest hook.
 */
export default function StageTest({
  questions,
  currentIndex,
  currentQuestion,
  totalQuestions,
  selected,
  feedback,
  isFinished,
  onToggleOption,
  onSubmit,
  onAdvance,
  stageLabel,
}) {
  if (!questions || questions.length === 0) return null;

  if (isFinished) {
    return (
      <div className="test-completed">
        <div className="test-completed-icon">&#10003;</div>
        <div className="test-completed-text">
          {stageLabel ? `${stageLabel} Test Complete` : 'Test Complete'}
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex >= totalQuestions - 1;
  const locked = feedback === 'correct';

  return (
    <>
      <div className="stage-test-heading">Test</div>
      <div className="stage-test">
        <div className="test-progress">
          <span className="test-progress-label">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <div className="test-progress-bar">
            <div
              className="test-progress-fill"
              style={{ width: `${((currentIndex + (locked ? 1 : 0)) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="test-card">
            <div className="test-prompt">{currentQuestion.prompt}</div>
            <div className="test-instruction">Select all that apply</div>

            <div className="test-options">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selected.includes(i);
                const isCorrectOption = locked && currentQuestion.correctIndices.includes(i);
                const cls = [
                  'test-option',
                  isSelected ? 'selected' : '',
                  isCorrectOption ? 'correct' : '',
                  locked ? 'locked' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => onToggleOption(i)}
                    type="button"
                  >
                    <span className="test-checkbox">
                      {(isSelected || isCorrectOption) && <span className="test-checkmark">&#10003;</span>}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div className={`test-feedback ${feedback}`}>
                {feedback === 'correct' ? 'Correct!' : 'Not quite \u2014 try again.'}
              </div>
            )}

            <div className="test-actions">
              {!locked && (
                <button
                  className="test-btn primary"
                  onClick={onSubmit}
                  disabled={selected.length === 0}
                  type="button"
                >
                  Check Answer
                </button>
              )}
              {locked && (
                <button
                  className="test-btn primary"
                  onClick={onAdvance}
                  type="button"
                >
                  {isLastQuestion ? 'Finish' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
