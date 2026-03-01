/**
 * Proxy reader for sacred texts via Wikisource API
 * Two modes:
 *   ?mode=index&page=...  → get table of contents / sections
 *   ?mode=chapter&page=...&section=... → get chapter text
 *
 * Includes Firestore cache for resilience — if Wikisource is down,
 * cached versions are returned with a { stale: true } flag.
 */

const WIKISOURCE_API = 'https://en.wikisource.org/w/api.php';
const { ensureFirebaseAdmin } = require('./_lib/auth');
const admin = require('firebase-admin');

function getCacheDocId(page, section, mode) {
  const raw = `${mode || 'chapter'}:${page}:${section || ''}`;
  return encodeURIComponent(raw).replace(/%/g, '_').slice(0, 1500);
}

async function readCache(docId) {
  try {
    ensureFirebaseAdmin();
    const doc = await admin.firestore().collection('cache').doc('sacred-texts').collection('entries').doc(docId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch { return null; }
}

async function writeCache(docId, payload) {
  try {
    ensureFirebaseAdmin();
    await admin.firestore().collection('cache').doc('sacred-texts').collection('entries').doc(docId).set({
      ...payload,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    console.error('sacred-text cache write error:', err.message);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const { page, section, mode } = req.query;

  if (!page) {
    return res.status(400).json({ error: 'page parameter required' });
  }

  const docId = getCacheDocId(page, section, mode);

  try {
    let result;
    if (mode === 'index') {
      const chapters = await fetchIndex(page);
      result = { chapters };
    } else {
      const text = await fetchChapter(page, section);
      result = { text };
    }

    // Cache successful response (fire-and-forget)
    writeCache(docId, result);

    return res.json(result);
  } catch (err) {
    console.error('sacred-text proxy error:', err.message);

    // Try returning cached version on failure
    const cached = await readCache(docId);
    if (cached) {
      const { fetchedAt, expiresAt, ...payload } = cached;
      return res.json({ ...payload, stale: true, cachedAt: new Date(fetchedAt).toISOString() });
    }

    return res.status(500).json({ error: 'Failed to fetch text' });
  }
};

/**
 * Fetch the table of contents for a Wikisource page.
 * Strategy: first check for sections on the page itself,
 * then fall back to listing sub-pages (most texts use /Book_I style sub-pages).
 */
async function fetchIndex(page) {
  const ws = (url) => fetch(url, {
    headers: { 'User-Agent': 'Mythouse.org/1.0 (educational sacred text reader)' },
  });

  // 1. Try getting sections via the parse API
  const secUrl = `${WIKISOURCE_API}?action=parse&page=${encodeURIComponent(page)}&prop=sections&format=json`;
  const secRes = await ws(secUrl);
  if (!secRes.ok) throw new Error(`Wikisource returned ${secRes.status}`);
  const secData = await secRes.json();

  if (secData.error) {
    throw new Error(secData.error.info || 'Page not found');
  }

  const sections = secData.parse?.sections || [];

  if (sections.length > 0) {
    const chapters = [];
    for (const sec of sections) {
      if (parseInt(sec.level) > 3) continue;
      const label = sec.line.replace(/<[^>]+>/g, '').trim();
      if (!label) continue;
      chapters.push({ label, page, section: sec.index });
    }
    if (chapters.length > 0) return chapters;
  }

  // 2. No sections — try listing sub-pages
  const subPages = await fetchSubPages(page);
  if (subPages.length > 0) return subPages;

  // 3. Fallback: single "Full Text" entry
  return [{ label: 'Full Text', page, section: null }];
}

/**
 * List sub-pages of a Wikisource page (e.g., The_Odyssey_(Butler)/Book_I)
 */
async function fetchSubPages(page) {
  const url = `${WIKISOURCE_API}?action=query&list=allpages&apprefix=${encodeURIComponent(page + '/')}&apnamespace=0&aplimit=500&format=json`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mythouse.org/1.0 (educational sacred text reader)' },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const pages = data.query?.allpages || [];
  if (pages.length === 0) return [];

  // Wikisource returns titles with spaces; our page param uses underscores
  const prefixSpaces = page.replace(/_/g, ' ') + '/';

  // Collect all sub-pages with depth info
  const allEntries = [];
  for (const p of pages) {
    const subPath = p.title.startsWith(prefixSpaces) ? p.title.slice(prefixSpaces.length) : p.title;
    const depth = subPath.split('/').length;
    if (depth > 2) continue;
    allEntries.push({
      label: subPath.replace(/_/g, ' '),
      page: p.title.replace(/ /g, '_'),
      section: null,
      depth,
    });
  }

  // If too many entries, limit to depth-1 only (e.g., Bible books without individual chapters)
  const maxDepth = allEntries.length > 80 ? 1 : 2;
  const chapters = allEntries
    .filter(e => e.depth <= maxDepth)
    .map(({ label, page: pg, section }) => ({ label, page: pg, section }));

  // Sort with Roman numeral awareness
  chapters.sort((a, b) => {
    const na = romanToNum(a.label);
    const nb = romanToNum(b.label);
    if (na !== nb) return na - nb;
    return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
  });

  return chapters;
}

/**
 * Extract a trailing Roman numeral from a label and convert to integer for sorting.
 */
function romanToNum(label) {
  const ROMAN = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  const m = label.match(/\b([IVXLCDM]+)\s*$/);
  if (!m) return 0;
  const s = m[1];
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAN[s[i]] || 0;
    const next = ROMAN[s[i + 1]] || 0;
    n += cur < next ? -cur : cur;
  }
  return n;
}

/**
 * Fetch and clean the text of a specific section
 */
async function fetchChapter(page, section) {
  let url = `${WIKISOURCE_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`;
  if (section != null && section !== 'null') {
    url += `&section=${section}`;
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mythouse.org/1.0 (educational sacred text reader)' },
  });

  if (!response.ok) {
    throw new Error(`Wikisource returned ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.info || 'Failed to parse page');
  }

  const html = data.parse?.text?.['*'] || '';
  const cleaned = cleanHtml(html);

  // Sanity check: if regex stripping removed nearly everything, return raw text
  if (cleaned.length < 50 && html.length > 100) {
    const rawText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return rawText || cleaned;
  }

  return cleaned;
}

/**
 * Convert Wikisource HTML to clean readable text
 */
function cleanHtml(html) {
  let text = html;

  // Remove edit links (may have nested spans), reference markers, hidden elements
  text = text.replace(/<span class="mw-editsection[\s\S]*?(?:<\/span>\s*){1,3}/gi, '');
  text = text.replace(/<sup[\s\S]*?<\/sup>/gi, '');
  text = text.replace(/<div class="noprint[\s\S]*?<\/div>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove navigation/header templates and Wikisource chrome
  text = text.replace(/<table[\s\S]*?<\/table>/gi, '');
  text = text.replace(/<div class="ws-noexport[\s\S]*?<\/div>/gi, '');
  text = text.replace(/<div class="prp-pages-output[\s\S]*?<\/div>/gi, '');
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  // Remove prev/next navigation links (← → arrows)
  text = text.replace(/<div[^>]*class="[^"]*ws-summary[^"]*"[\s\S]*?<\/div>/gi, '');
  text = text.replace(/<div[^>]*class="[^"]*(?:header|footer)(?:template)?[^"]*"[\s\S]*?<\/div>/gi, '');

  // Convert headings to marked lines
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n=== $1 ===\n\n');

  // Convert block elements to newlines
  text = text.replace(/<\/?(p|div|br|blockquote|li|dd|dt)[^>]*>/gi, '\n');
  text = text.replace(/<hr[^>]*>/gi, '\n---\n');

  // Preserve italics and bold as markdown
  text = text.replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, '_$2_');
  text = text.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');

  // Strip all remaining HTML
  text = text.replace(/<[^>]+>/g, '');

  // Decode entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#\d+;/g, '');
  text = text.replace(/&[a-z]+;/gi, '');

  // Clean whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  // Remove [edit] artifacts and stray "edit" text from section headers
  text = text.replace(/\[edit\]/g, '');
  text = text.replace(/\nedit\n/g, '\n');
  text = text.replace(/^[\s\S]*?Layout \d+\n*/m, ''); // "Layout 2" remnant
  text = text.replace(/^←[\s\S]*?→\s*\n*/m, ''); // ← prev ... next → navigation
  text = text.replace(/←\n/g, '');
  text = text.replace(/→\n/g, '');
  text = text.replace(/^Contents\n/m, '');

  // Final whitespace cleanup
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
