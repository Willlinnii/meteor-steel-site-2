import monomythModels from './monomythModels.json';
import monomythCycles from './monomythCycles.json';

export const MONOMYTH_STAGES = [
  { id: 'golden-age', label: 'Surface', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpduuWlv1HDEoVMtrhOhXF_' },
  { id: 'falling-star', label: 'Calling', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jto4aGkJe3hvMfHAvBO6XSxt' },
  { id: 'impact-crater', label: 'Crossing', flipLabel: true, playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtp43zjmPLi4xXkmC3N3yn8p' },
  { id: 'forge', label: 'Initiating', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtoxHSSqRRdiOhinC8Gua8mm' },
  { id: 'quenching', label: 'Nadir', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpw9cTgM3Kj5okUQr2zFK3v' },
  { id: 'integration', label: 'Return', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpSnXrPdWpxjvcrzzJ9dPJ7' },
  { id: 'drawing', label: 'Arrival', flipLabel: true, playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtp6RIa4-lI5UyDHjv0PJHfB' },
  { id: 'new-age', label: 'Renewal', playlist: 'https://youtube.com/playlist?list=PLX31T_KS3jtqspHndrqJQ-LK1kBWklQU0' },
];

export const THEORIST_TO_MODEL = {
  campbell: 'campbell', jung: 'jung', nietzsche: 'nietzsche',
  frobenius: 'frobenius', eliade: 'eliade', plato: 'plato',
  vogler: 'vogler', snyder: 'snyder', aristotle: 'aristotle',
  mckee: 'mckee-field', field: 'mckee-field',
  freud: 'dream', gennep: 'vangennep', murdoch: 'murdock',
  tolkien: 'tolkien', fraser: 'frazer', marks: 'marks',
  propp: 'propp', murdock: 'murdock', vangennep: 'vangennep',
  frazer: 'frazer',
};

export const CYCLE_TO_MODEL = {
  'Solar Day': 'solar-day',
  'Lunar Month': 'lunar-month',
  'Solar Year': 'solar-year',
  'Wake & Sleep': 'wake-sleep',
  'Procreation': 'procreation',
  'Mortality': 'mortality',
};

export function getModelById(id) {
  return monomythModels.models.find(m => m.id === id) || null;
}

export function getCycleById(id) {
  return monomythCycles.cycles.find(c => c.id === id) || null;
}
