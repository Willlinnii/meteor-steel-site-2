#!/usr/bin/env node
/**
 * mergeContacts.js
 * Parses Wix and Constant Contact CSV exports, normalizes, deduplicates by email,
 * and outputs unified contacts.json + contactsMeta.json to public/data/.
 *
 * Usage: node scripts/mergeContacts.js
 */

const fs = require('fs');
const path = require('path');

// ─── Paths ───────────────────────────────────────────────────────────────────
const WIX_CSV = path.join(__dirname, '..', '..', 'Downloads', 'contacts.csv');
const CC_CSV = path.join(__dirname, '..', '..', 'Downloads', 'contact_export_1134551190518_021826_133957.csv');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUT_CONTACTS = path.join(OUT_DIR, 'contacts.json');
const OUT_META = path.join(OUT_DIR, 'contactsMeta.json');

// ─── RFC 4180 CSV Parser ────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    while (i < len) {
      let value = '';
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            value += text[i];
            i++;
          }
        }
      } else {
        // Unquoted field
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          value += text[i];
          i++;
        }
      }
      row.push(value);

      if (i < len && text[i] === ',') {
        i++; // skip comma
      } else {
        break; // end of row
      }
    }
    // Skip line ending
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;

    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row);
    }
  }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (row[idx] || '').trim();
    });
    return obj;
  });
}

// ─── Normalization helpers ──────────────────────────────────────────────────
function titleCase(str) {
  if (!str) return '';
  return str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function formatPhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return digits || null;
}

function toISO(dateStr) {
  if (!dateStr) return null;
  // Handle "2022-01-10 16:35" (Wix) and "2020-09-25 16:45:13 -0400" (CC)
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function cleanName(name) {
  if (!name) return '';
  // Remove literal "" and empty-string patterns from Wix
  const cleaned = name.replace(/^""+$/, '').trim();
  return titleCase(cleaned);
}

function splitCommaList(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// ─── Parse Wix contact ─────────────────────────────────────────────────────
function parseWixContact(row) {
  const emails = [row['Email 1'], row['Email 2']].map(e => (e || '').toLowerCase().trim()).filter(Boolean);
  if (emails.length === 0) return null;

  const phones = [row['Phone 1'], row['Phone 2'], row['Phone 3'], row['Phone 4']]
    .map(formatPhone).filter(Boolean);

  const addresses = [];
  for (let n = 1; n <= 3; n++) {
    const type = row[`Address ${n} - Type`];
    const street = row[`Address ${n} - Street`];
    const city = row[`Address ${n} - City`];
    const state = row[`Address ${n} - State/Region`];
    const zip = row[`Address ${n} - Zip`];
    const country = row[`Address ${n} - Country`];
    if (street || city || state || zip || country) {
      addresses.push({ type: type || '', street: street || '', city: city || '', state: state || '', zip: zip || '', country: country || '' });
    }
  }

  return {
    firstName: cleanName(row['First Name']),
    lastName: cleanName(row['Last Name']),
    emails,
    phones,
    company: (row['Company'] || '').trim(),
    jobTitle: '',
    addresses,
    source: 'wix',
    wix: {
      labels: splitCommaList(row['Labels']),
      emailStatus: (row['Email subscriber status'] || '').trim(),
      smsStatus: (row['SMS subscriber status'] || '').trim(),
      lastActivity: (row['Last Activity'] || '').trim(),
      lastActivityDate: toISO(row['Last Activity Date (UTC+0)']),
      language: (row['Language'] || '').trim(),
      createdAt: toISO(row['Created At (UTC+0)']),
    },
    cc: null,
    createdAt: toISO(row['Created At (UTC+0)']),
    updatedAt: toISO(row['Created At (UTC+0)']),
  };
}

// ─── Parse Constant Contact contact ─────────────────────────────────────────
function parseCCContact(row) {
  const email = (row['Email address'] || '').toLowerCase().trim();
  if (!email) return null;

  const phones = [formatPhone(row['Phone - home'])].filter(Boolean);

  return {
    firstName: cleanName(row['First name']),
    lastName: cleanName(row['Last name']),
    emails: [email],
    phones,
    company: (row['Company'] || '').trim(),
    jobTitle: (row['Job title'] || '').trim(),
    addresses: [],
    source: 'constant_contact',
    wix: null,
    cc: {
      emailStatus: (row['Email status'] || '').trim(),
      permissionStatus: (row['Email permission status'] || '').trim(),
      tags: splitCommaList(row['Tags']),
      emailLists: splitCommaList(row['Email Lists']),
      country: (row['Country - Home'] || '').trim(),
      birthday: (row['Birthday'] || '').trim(),
      anniversary: (row['Anniversary'] || '').trim(),
      createdAt: toISO(row['Created At']),
      updatedAt: toISO(row['Updated At']),
    },
    createdAt: toISO(row['Created At']),
    updatedAt: toISO(row['Updated At']),
  };
}

// ─── Merge two contacts ─────────────────────────────────────────────────────
function mergeContacts(existing, incoming) {
  const merged = { ...existing };
  merged.source = 'both';

  // Best name: prefer longer / non-empty
  if (!merged.firstName && incoming.firstName) merged.firstName = incoming.firstName;
  if (!merged.lastName && incoming.lastName) merged.lastName = incoming.lastName;
  if (incoming.firstName && incoming.firstName.length > merged.firstName.length) {
    merged.firstName = incoming.firstName;
  }
  if (incoming.lastName && incoming.lastName.length > merged.lastName.length) {
    merged.lastName = incoming.lastName;
  }

  // Merge emails (unique)
  const emailSet = new Set([...merged.emails, ...incoming.emails]);
  merged.emails = [...emailSet];

  // Merge phones (unique)
  const phoneSet = new Set([...merged.phones, ...incoming.phones]);
  merged.phones = [...phoneSet];

  // Merge addresses
  merged.addresses = [...(merged.addresses || []), ...(incoming.addresses || [])];

  // Company / jobTitle: prefer non-empty
  if (!merged.company && incoming.company) merged.company = incoming.company;
  if (!merged.jobTitle && incoming.jobTitle) merged.jobTitle = incoming.jobTitle;

  // Merge source-specific data
  if (incoming.wix) merged.wix = incoming.wix;
  if (incoming.cc) merged.cc = incoming.cc;

  // Earliest createdAt, latest updatedAt
  if (incoming.createdAt && (!merged.createdAt || incoming.createdAt < merged.createdAt)) {
    merged.createdAt = incoming.createdAt;
  }
  if (incoming.updatedAt && (!merged.updatedAt || incoming.updatedAt > merged.updatedAt)) {
    merged.updatedAt = incoming.updatedAt;
  }

  return merged;
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
  console.log('--- Contacts Merge Script ---\n');

  // Read CSVs
  console.log('Reading Wix CSV...');
  const wixText = fs.readFileSync(WIX_CSV, 'utf-8');
  const wixRows = csvToObjects(wixText);
  console.log(`  Parsed ${wixRows.length} Wix rows`);

  console.log('Reading Constant Contact CSV...');
  const ccText = fs.readFileSync(CC_CSV, 'utf-8');
  const ccRows = csvToObjects(ccText);
  console.log(`  Parsed ${ccRows.length} CC rows`);

  // Build dedup map keyed by primary email
  const contactMap = new Map(); // email -> contact
  let wixCount = 0;
  let ccCount = 0;
  let dupeCount = 0;

  // Process Wix first
  for (const row of wixRows) {
    const contact = parseWixContact(row);
    if (!contact) continue;
    wixCount++;
    const key = contact.emails[0];
    if (contactMap.has(key)) {
      contactMap.set(key, mergeContacts(contactMap.get(key), contact));
      dupeCount++;
    } else {
      contactMap.set(key, contact);
    }
  }

  // Process CC
  for (const row of ccRows) {
    const contact = parseCCContact(row);
    if (!contact) continue;
    ccCount++;
    const key = contact.emails[0];
    if (contactMap.has(key)) {
      contactMap.set(key, mergeContacts(contactMap.get(key), contact));
      dupeCount++;
    } else {
      contactMap.set(key, contact);
    }
  }

  // Assign IDs and collect into array
  const contacts = [];
  let idCounter = 1;
  for (const contact of contactMap.values()) {
    contacts.push({ id: idCounter++, ...contact });
  }

  // Sort by createdAt descending
  contacts.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Build metadata
  const meta = {
    totalContacts: contacts.length,
    sources: { wix: 0, constant_contact: 0, both: 0 },
    tags: new Set(),
    emailLists: new Set(),
    labels: new Set(),
    emailStatuses: new Set(),
    ccEmailStatuses: new Set(),
    ccPermissionStatuses: new Set(),
    countries: new Set(),
  };

  for (const c of contacts) {
    meta.sources[c.source]++;
    if (c.wix) {
      (c.wix.labels || []).forEach(l => meta.labels.add(l));
      if (c.wix.emailStatus) meta.emailStatuses.add(c.wix.emailStatus);
    }
    if (c.cc) {
      (c.cc.tags || []).forEach(t => meta.tags.add(t));
      (c.cc.emailLists || []).forEach(l => meta.emailLists.add(l));
      if (c.cc.emailStatus) meta.ccEmailStatuses.add(c.cc.emailStatus);
      if (c.cc.permissionStatus) meta.ccPermissionStatuses.add(c.cc.permissionStatus);
      if (c.cc.country) meta.countries.add(c.cc.country);
    }
  }

  const metaOutput = {
    totalContacts: meta.totalContacts,
    sources: meta.sources,
    tags: [...meta.tags].sort(),
    emailLists: [...meta.emailLists].sort(),
    labels: [...meta.labels].sort(),
    emailStatuses: [...meta.emailStatuses].sort(),
    ccEmailStatuses: [...meta.ccEmailStatuses].sort(),
    ccPermissionStatuses: [...meta.ccPermissionStatuses].sort(),
    countries: [...meta.countries].sort(),
  };

  // Strip empty values to reduce file size
  function compact(obj) {
    if (Array.isArray(obj)) return obj.map(compact);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
        out[k] = compact(v);
      }
      return out;
    }
    return obj;
  }
  const compactContacts = contacts.map(compact);

  // Write output
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_CONTACTS, JSON.stringify(compactContacts));
  fs.writeFileSync(OUT_META, JSON.stringify(metaOutput, null, 2));

  const contactsSize = (fs.statSync(OUT_CONTACTS).size / 1024 / 1024).toFixed(2);
  const metaSize = (fs.statSync(OUT_META).size / 1024).toFixed(1);

  console.log('\n--- Stats ---');
  console.log(`  Wix contacts parsed:  ${wixCount}`);
  console.log(`  CC contacts parsed:   ${ccCount}`);
  console.log(`  Duplicates merged:    ${dupeCount}`);
  console.log(`  Final contact count:  ${contacts.length}`);
  console.log(`  Source breakdown:     Wix=${meta.sources.wix}, CC=${meta.sources.constant_contact}, Both=${meta.sources.both}`);
  console.log(`  Unique tags:          ${metaOutput.tags.length}`);
  console.log(`  Unique email lists:   ${metaOutput.emailLists.length}`);
  console.log(`  Unique labels:        ${metaOutput.labels.length}`);
  console.log(`\n  contacts.json:        ${contactsSize} MB`);
  console.log(`  contactsMeta.json:    ${metaSize} KB`);
  console.log('\nDone!');
}

main();
