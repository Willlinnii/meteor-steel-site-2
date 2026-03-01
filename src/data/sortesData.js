/**
 * Sortes — lot-casting oracle.
 * Based on the Sortes Astrampsychi (Greco-Roman, c. 3rd–5th century CE).
 *
 * The original system: ~92 question categories, each with 10 possible answers.
 * User selects a question, draws a lot number (1–10), cross-references for the answer.
 * Answers are terse, declarative, one line. This is the actual style of the text.
 */

export const SORTES_QUESTIONS = [
  'Will I succeed in my undertaking?',
  'Will I profit from the transaction?',
  'Will I get the money?',
  'Am I to be reconciled?',
  'Will my journey be safe?',
  'Will I recover what was lost?',
  'Will the sick person recover?',
  'Will I win the dispute?',
  'Will I be set free?',
  'Will my petition be granted?',
  'Shall I marry?',
  'Will the absent one return?',
  'Is the rumor true?',
  'Will I escape the danger?',
  'Should I trust this person?',
  'Will I receive the inheritance?',
  'Will my enterprise succeed?',
  'Am I being deceived?',
  'Will there be a change?',
  'Is this the right time to act?',
];

/**
 * Answer pool — terse declarative oracle responses.
 * 10 answers per question, selected by lot (1–10).
 * Style matches the actual Astrampsychi answer tablets.
 */
export const SORTES_ANSWERS = [
  'You will succeed.',
  'Not yet.',
  'After hardship, yes.',
  'The god says no.',
  'Late but certain.',
  'You will not profit.',
  'Expect this with joy.',
  'It is not expedient.',
  'After weeping, relief.',
  'Certainly.',
  'With suffering, yes.',
  'Do not proceed.',
  'You will be set free.',
  'After a time.',
  'No good will come of it.',
  'It will happen unexpectedly.',
  'The stars oppose it.',
  'You will obtain what you desire.',
  'Not in this season.',
  'Yes, and quickly.',
  'Wait for a sign.',
  'The danger passes.',
  'You are being deceived.',
  'It will be granted.',
  'After three days.',
  'The matter is already decided.',
  'You will not recover it.',
  'Yes, through another person.',
  'Only with great effort.',
  'The time is not right.',
  'Fortune favors you.',
  'Abandon this course.',
  'The rumor is false.',
  'You will receive it.',
  'Not without cost.',
  'Yes, but not as you expect.',
  'The absent one returns.',
  'You will suffer loss.',
  'Proceed with confidence.',
  'Not in your lifetime.',
  'The gods are silent.',
  'After long delay, success.',
  'You will be harmed.',
  'Trust no one in this matter.',
  'It is already yours.',
  'Nothing will come of it.',
  'Beyond your control.',
  'The answer is within you.',
  'A favorable outcome.',
  'Grief, then joy.',
];

/**
 * Draw a lot: pick a question category, then draw an answer.
 * Returns { question, answer, questionIndex, answerIndex }.
 */
export function drawLot(questionIndex) {
  const qi = questionIndex != null
    ? questionIndex
    : Math.floor(Math.random() * SORTES_QUESTIONS.length);
  const ai = Math.floor(Math.random() * SORTES_ANSWERS.length);
  return {
    question: SORTES_QUESTIONS[qi],
    answer: SORTES_ANSWERS[ai],
    questionIndex: qi,
    answerIndex: ai + 1,
  };
}

/** Draw a random answer without a question (simple mode). */
export function drawOracle() {
  const i = Math.floor(Math.random() * SORTES_ANSWERS.length);
  return { number: i + 1, text: SORTES_ANSWERS[i] };
}
