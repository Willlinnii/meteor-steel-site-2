/**
 * Pure CSV/TSV parser — no dependencies.
 * Handles quoted fields, \r\n line endings, and auto-detects delimiter.
 * Returns { headers: string[], rows: object[] }
 */
export default function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Auto-detect delimiter: if first line has more tabs than commas, use tab
  const firstLine = lines.split('\n')[0] || '';
  const delimiter = (firstLine.split('\t').length > firstLine.split(',').length) ? '\t' : ',';

  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < lines.length; i++) {
    const ch = lines[i];

    if (inQuotes) {
      if (ch === '"') {
        if (lines[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      current.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      current.push(field.trim());
      if (current.some(f => f !== '')) rows.push(current);
      current = [];
      field = '';
    } else {
      field += ch;
    }
  }

  // Last field/row
  current.push(field.trim());
  if (current.some(f => f !== '')) rows.push(current);

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0];
  const dataRows = rows.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
    return obj;
  });

  return { headers, rows: dataRows };
}
