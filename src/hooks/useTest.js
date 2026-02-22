import { useState, useCallback, useRef } from 'react';

/**
 * Reusable test state hook.
 * Manages sequential "select all that apply" questions.
 *
 * @param {Object} opts
 * @param {Array} opts.questions - array of { id, prompt, options, correctIndices }
 * @param {boolean} opts.alreadyCompleted - whether this test was already completed (Firestore)
 * @returns test state and actions
 */
export default function useTest({ questions, alreadyCompleted }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [answeredCount, setAnsweredCount] = useState(0);
  const resetRef = useRef(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;
  const isFinished = alreadyCompleted || (totalQuestions > 0 && answeredCount >= totalQuestions);

  const toggleOption = useCallback((i) => {
    if (feedback === 'correct') return; // locked after correct answer
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }, [feedback]);

  const submit = useCallback(() => {
    if (!currentQuestion || selected.length === 0) return;
    const correct = currentQuestion.correctIndices;
    const isCorrect =
      selected.length === correct.length &&
      selected.every(i => correct.includes(i)) &&
      correct.every(i => selected.includes(i));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setAnsweredCount(prev => prev + 1);
    }
  }, [currentQuestion, selected]);

  const advance = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    setSelected([]);
    setFeedback(null);
  }, []);

  const reset = useCallback(() => {
    resetRef.current += 1;
    setCurrentIndex(0);
    setSelected([]);
    setFeedback(null);
    setAnsweredCount(0);
  }, []);

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    selected,
    feedback,
    isFinished,
    toggleOption,
    submit,
    advance,
    reset,
  };
}
