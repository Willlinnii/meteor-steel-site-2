/**
 * Throwing sticks — 4 binary sticks, each landing flat (0) or round/marked (1).
 * Ancient Egyptian casting-stick tradition.
 * Movement values from Senet (the documented game use of these sticks):
 *   1–4 marked = move 1–4 spaces.
 *   0 marked = move 5 (the bonus throw).
 * Source: Kendall (1978), Piccione (1980).
 */

export const STICK_COUNTS = [
  { round: 0, label: '0 of 4 marked', note: 'Move 5 — the bonus throw.' },
  { round: 1, label: '1 of 4 marked', note: 'Move 1.' },
  { round: 2, label: '2 of 4 marked', note: 'Move 2.' },
  { round: 3, label: '3 of 4 marked', note: 'Move 3.' },
  { round: 4, label: '4 of 4 marked', note: 'Move 4.' },
];
