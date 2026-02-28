import library from './mythSalonLibrary.json';
import { resolveOrigin } from './bookOrigins';
import { parseEraString } from '../components/MythicAgesTimeline';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const ALL_BOOKS = buildAllBooks();

function buildAllBooks() {
  const seen = new Map();
  const books = [];

  library.libraries.flatMap(l => l.shelves).forEach(shelf => {
    const items = shelf.books || [];
    items.forEach(book => {
      if (seen.has(book.title)) {
        seen.get(book.title).shelves.push(shelf.id);
        return;
      }
      const origin = resolveOrigin(book, shelf.id);
      const era = parseEraString(String(book.year));
      const entry = {
        id: slugify(book.title),
        title: book.title,
        author: book.author || null,
        tradition: book.tradition || null,
        year: String(book.year),
        era,
        note: book.note || null,
        freeUrl: book.freeUrl || null,
        inSite: book.inSite || false,
        shelves: [shelf.id],
        lat: origin?.lat ?? null,
        lng: origin?.lng ?? null,
        region: origin?.region || 'Unknown',
        originLabel: origin?.label || 'Unknown',
      };
      seen.set(book.title, entry);
      books.push(entry);
    });
  });
  return books;
}

export function getAllBooks() { return ALL_BOOKS; }
