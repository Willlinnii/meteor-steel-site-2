import React, { useState, useCallback } from 'react';
import { SORTES_QUESTIONS, drawLot, drawOracle } from '../../data/sortesData';

export default function SortesPage() {
  const [mode, setMode] = useState('question'); // 'question' or 'simple'
  const [selectedQ, setSelectedQ] = useState(null);
  const [result, setResult] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);

  const handleDraw = useCallback(() => {
    setDrawing(true);
    setResult(null);

    const flickerInterval = setInterval(() => {
      setResult(mode === 'question' && selectedQ !== null ? drawLot(selectedQ) : { ...drawOracle(), question: null });
    }, 100);

    setTimeout(() => {
      clearInterval(flickerInterval);
      const final = mode === 'question' && selectedQ !== null ? drawLot(selectedQ) : drawOracle();
      setResult({ ...final, question: mode === 'question' && selectedQ !== null ? SORTES_QUESTIONS[selectedQ] : null });
      setDrawing(false);
      setHistory(prev => [final.answer || final.text, ...prev].slice(0, 20));
    }, 800);
  }, [mode, selectedQ]);

  const answerText = result ? (result.answer || result.text) : null;

  return (
    <div className="divination-oracle divination-sortes">
      {/* Mode toggle */}
      <div className="sortes-mode-toggle">
        <button
          className={`divination-subtoggle-btn${mode === 'question' ? ' active' : ''}`}
          onClick={() => { setMode('question'); setResult(null); }}
        >
          Ask a Question
        </button>
        <button
          className={`divination-subtoggle-btn${mode === 'simple' ? ' active' : ''}`}
          onClick={() => { setMode('simple'); setResult(null); }}
        >
          Draw Blind
        </button>
      </div>

      {/* Question selector */}
      {mode === 'question' && (
        <div className="sortes-questions">
          {SORTES_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className={`sortes-question-btn${selectedQ === i ? ' active' : ''}`}
              onClick={() => setSelectedQ(i)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Oracle result */}
      <div className="divination-oracle-tray">
        {answerText ? (
          <div className={`sortes-oracle-card${drawing ? ' flickering' : ''}`}>
            {result.question && <div className="sortes-question">{result.question}</div>}
            <div className="sortes-text">{answerText}</div>
          </div>
        ) : (
          <div className="divination-oracle-empty">
            {mode === 'question'
              ? (selectedQ !== null ? 'Draw a lot for the answer' : 'Select a question, then draw')
              : 'Draw a lot'}
          </div>
        )}
      </div>

      <button
        className="divination-roll-btn"
        onClick={handleDraw}
        disabled={drawing || (mode === 'question' && selectedQ === null)}
      >
        {drawing ? 'Drawing...' : 'Draw a Lot'}
      </button>

      {history.length > 0 && (
        <div className="divination-oracle-history">
          {history.map((val, i) => (
            <div key={i} className="divination-oracle-history-item">{val}</div>
          ))}
        </div>
      )}

      <div className="divination-oracle-source">
        Question categories and answer style after the <em>Sortes Astrampsychi</em>{' '}
        (Greco-Roman lot oracle, c. 3rd–5th century CE).
      </div>
    </div>
  );
}
