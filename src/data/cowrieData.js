/**
 * Obi divination — 4 cowrie shells (or kola nut segments), count open (mouth-up) faces.
 * Yoruba / Ifá tradition. Names and verdicts are the standard Obi outcomes.
 */

export const COWRIE_OUTCOMES = [
  { count: 0, name: 'Oyeku',  verdict: 'No',           note: 'All closed. Definite no.' },
  { count: 1, name: 'Okana',  verdict: 'Uncertain',    note: 'One open. Unclear — ask again or wait.' },
  { count: 2, name: 'Ejife',  verdict: 'Definite Yes', note: 'Two open, two closed. Strongest confirmation.' },
  { count: 3, name: 'Etawa',  verdict: 'Probable Yes', note: 'Three open. Favorable, leaning yes.' },
  { count: 4, name: 'Alafia', verdict: 'Peace',        note: 'All open. Blessings — cast again to confirm.' },
];
