/**
 * Throwing sticks — 4 binary sticks, each landing flat (0) or round (1).
 * Ancient Egyptian and West African casting-stick traditions.
 * Traditional reading is by count (how many round/marked sides up), not by position.
 * 0–4 round = 5 outcomes. In Senet, 0 round sometimes counted as 5.
 */

export const STICK_COUNTS = [
  { round: 0, label: '0 of 4 round', note: 'All flat.' },
  { round: 1, label: '1 of 4 round', note: 'One marked.' },
  { round: 2, label: '2 of 4 round', note: 'Two marked.' },
  { round: 3, label: '3 of 4 round', note: 'Three marked.' },
  { round: 4, label: '4 of 4 round', note: 'All round.' },
];
