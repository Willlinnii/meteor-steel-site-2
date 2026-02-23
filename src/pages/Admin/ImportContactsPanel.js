import React, { useState, useRef, useMemo, useCallback } from 'react';
import parseCSV from './csvParser';

const FIELD_OPTIONS = [
  { value: '', label: 'Skip' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'notes', label: 'Notes' },
];

// Fuzzy-match common header names to field keys
const HEADER_MAP = {
  'first name': 'firstName', 'first_name': 'firstName', 'firstname': 'firstName', 'fname': 'firstName',
  'last name': 'lastName', 'last_name': 'lastName', 'lastname': 'lastName', 'lname': 'lastName',
  'email': 'email', 'email address': 'email', 'email_address': 'email', 'e-mail': 'email',
  'phone': 'phone', 'phone number': 'phone', 'phone_number': 'phone', 'telephone': 'phone', 'mobile': 'phone',
  'company': 'company', 'organization': 'company', 'org': 'company',
  'job title': 'jobTitle', 'job_title': 'jobTitle', 'jobtitle': 'jobTitle', 'title': 'jobTitle',
  'notes': 'notes', 'note': 'notes', 'comments': 'notes', 'comment': 'notes',
};

function autoMapHeaders(headers) {
  return headers.map(h => HEADER_MAP[h.toLowerCase().trim()] || '');
}

export default function ImportContactsPanel({ onImport, onCancel, existingEmails }) {
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState([]); // field key per column
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseCSV(ev.target.result);
        if (result.headers.length === 0) {
          setError('No data found in file.');
          return;
        }
        setParsed(result);
        setMapping(autoMapHeaders(result.headers));
      } catch (err) {
        setError('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const updateMapping = (idx, value) => {
    setMapping(prev => { const next = [...prev]; next[idx] = value; return next; });
  };

  const mappedContacts = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map(row => {
      const contact = { firstName: '', lastName: '', emails: [], phones: [], company: '', jobTitle: '', notes: '' };
      parsed.headers.forEach((h, i) => {
        const field = mapping[i];
        const val = (row[h] || '').trim();
        if (!field || !val) return;
        if (field === 'email') contact.emails = [val.toLowerCase()];
        else if (field === 'phone') contact.phones = [val];
        else contact[field] = val;
      });
      return contact;
    }).filter(c => c.firstName || c.lastName || c.emails.length > 0);
  }, [parsed, mapping]);

  const dupCount = useMemo(() => {
    if (!existingEmails) return 0;
    return mappedContacts.filter(c => c.emails.some(e => existingEmails.has(e))).length;
  }, [mappedContacts, existingEmails]);

  const handleImport = async () => {
    setImporting(true);
    setProgress(`Importing ${mappedContacts.length} contacts...`);
    try {
      await onImport(mappedContacts);
      setProgress(`Done! Imported ${mappedContacts.length} contacts.`);
      setParsed(null);
      setMapping([]);
    } catch (err) {
      setProgress('');
      setError('Import failed: ' + err.message);
    }
    setImporting(false);
  };

  return (
    <div className="contacts-add-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#8a8a9a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Import Contacts
        </span>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: '#6a6a7a', cursor: 'pointer', fontSize: '1.1rem',
        }}>&times;</button>
      </div>

      {!parsed && (
        <div>
          <p style={{ color: '#8a8a9a', fontSize: '0.8rem', marginBottom: '10px' }}>
            Upload a CSV or TSV file. For Excel files, save as CSV first.
          </p>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile}
            style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} className="contacts-form-btn-save">
            Choose File
          </button>
        </div>
      )}

      {error && <p style={{ color: '#d95b5b', fontSize: '0.8rem', marginTop: '8px' }}>{error}</p>}

      {parsed && !importing && !progress.startsWith('Done') && (
        <>
          {/* Column mapping */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ color: '#8a8a9a', fontSize: '0.75rem', marginBottom: '8px' }}>
              Map columns to fields:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {parsed.headers.map((h, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{h}</span>
                  <select value={mapping[i] || ''} onChange={e => updateMapping(i, e.target.value)}
                    className="contacts-form-input" style={{ padding: '3px 6px', fontSize: '0.75rem' }}>
                    {FIELD_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {mappedContacts.length > 0 && (
            <div className="contacts-import-preview">
              <table className="contacts-import-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Phone</th><th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedContacts.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td>{c.firstName} {c.lastName}</td>
                      <td>{c.emails[0] || ''}</td>
                      <td>{c.phones[0] || ''}</td>
                      <td>{c.company}</td>
                    </tr>
                  ))}
                  {mappedContacts.length > 5 && (
                    <tr><td colSpan={4} style={{ color: '#6a6a7a', fontStyle: 'italic' }}>
                      ...and {mappedContacts.length - 5} more
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary + import button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
              {mappedContacts.length} contacts ready
              {dupCount > 0 && <span style={{ color: '#d9a55b' }}> ({dupCount} emails already exist)</span>}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => { setParsed(null); setMapping([]); }} className="contacts-form-btn-cancel">
                Clear
              </button>
              <button onClick={handleImport} disabled={mappedContacts.length === 0}
                className="contacts-form-btn-save">
                Import {mappedContacts.length} Contacts
              </button>
            </div>
          </div>
        </>
      )}

      {importing && <p style={{ color: '#5b8dd9', fontSize: '0.8rem', marginTop: '8px' }}>{progress}</p>}
      {progress.startsWith('Done') && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ color: '#5bd97a', fontSize: '0.8rem' }}>{progress}</p>
          <button onClick={onCancel} className="contacts-form-btn-save" style={{ marginTop: '8px' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
