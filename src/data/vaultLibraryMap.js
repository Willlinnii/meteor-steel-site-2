import libraryData from './mythSalonLibrary.json';

/**
 * Maps each vault tradition ID → array of exact book titles from the
 * "chronosphaera" shelf in mythSalonLibrary.json.
 */
export const VAULT_LIBRARY_MAP = {
  agrippa: ['De Occulta Philosophia'],
  'al-farabi': ['Ara Ahl al-Madina al-Fadila (The Virtuous City)'],
  assyrian: ['Enūma Anu Enlil', "Ashurbanipal's Library Tablets", 'MUL.APIN'],
  babylon: ['MUL.APIN', 'Enūma Anu Enlil', 'Enūma Eliš'],
  'besant-theosophy': ['The Ancient Wisdom'],
  blavatsky: ['Isis Unveiled', 'The Secret Doctrine'],
  'corpus-hermeticum': ['Corpus Hermeticum (Poimandres)'],
  dante: ['The Divine Comedy'],
  ficino: ['De Vita Triplici'],
  genesis: ['Genesis 1:1–2:3'],
  gnostic: ['Apocryphon of John'],
  'golden-dawn': ['Golden Dawn Knowledge Lectures'],
  'ikhwan-al-safa': ["Rasa'il Ikhwan al-Safa"],
  'john-dee': ['Heptarchia Mystica'],
  kabbalah: ['Sefer Yetzirah', 'Zohar'],
  kepler: ['Harmonices Mundi', 'Mysterium Cosmographicum'],
  'leadbeater-theosophy': ['Man Visible and Invisible', 'The Chakras'],
  'manly-p-hall': ['The Secret Teachings of All Ages'],
  mithraic: ['Felicissimus Mithraeum Mosaic'],
  neoplatonist: ['Enneads', 'De Mysteriis'],
  norse: ['Prose Edda'],
  paracelsus: ['De Natura Rerum'],
  'perennial-philosophy': ['The Perennial Philosophy'],
  phoenician: ['Ugaritic Texts (Ras Shamra)'],
  plato: ['Timaeus'],
  ptolemaic: ['Tetrabiblos', 'Anthologiae'],
  pythagorean: ['Introduction to Arithmetic'],
  'ra-law-of-one': ['The Ra Material (The Law of One)'],
  rosicrucian: ['Fama Fraternitatis', 'Chymical Wedding of Christian Rosenkreutz'],
  sabians: ['Picatrix (Ghayat al-Hakim)'],
  steiner: ['An Outline of Occult Science'],
  sumerian: ['Sumerian Star Catalogs and Temple Hymns'],
  tarot: ['Visconti-Sforza Tarot'],
  tolkien: ['The Silmarillion'],
  vedic: ['Brihat Parashara Hora Shastra', 'Surya Siddhanta'],
};

// Build a title→book lookup from the chronosphaera shelf
const chronoShelf = libraryData.libraries.flatMap(l => l.shelves).find(s => s.id === 'chronosphaera');
const booksByTitle = {};
if (chronoShelf) {
  chronoShelf.books.forEach((b, i) => {
    booksByTitle[b.title] = { ...b, _index: i };
  });
}

/**
 * Resolve a vault tradition ID to its matching library book objects.
 * Returns an array of book objects (with _index for shelf position).
 */
export function getLibraryBooks(traditionId) {
  const titles = VAULT_LIBRARY_MAP[traditionId] || [];
  return titles.map(t => booksByTitle[t]).filter(Boolean);
}
