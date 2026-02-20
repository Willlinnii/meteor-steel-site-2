import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import './ContactsPage.css';

const PAGE_SIZE = 50;

// Consolidated list groups — any email list matching these keywords gets folded in
const LIST_GROUPS = {
  clicked:          (name) => /click/i.test(name),
  writers_journey:  (name) => /writer.*journey/i.test(name),
  myth_salon:       (name) => /myth.salon/i.test(name),
};

// Individual lists to keep as-is in the dropdown
const KEEP_LISTS = ['Mythouse Website', 'Zoom', 'climate'];

function getListGroup(name) { // eslint-disable-line no-unused-vars
  for (const [group, test] of Object.entries(LIST_GROUPS)) {
    if (test(name)) return group;
  }
  if (KEEP_LISTS.includes(name)) return null; // keep standalone
  return '__hide'; // hide from dropdown
}

function matchesListGroup(emailLists, group) {
  return emailLists.some(l => LIST_GROUPS[group]?.(l));
}

function getInitials(contact) {
  const f = (contact.firstName || '')[0] || '';
  const l = (contact.lastName || '')[0] || '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sourceLabel(source) {
  if (source === 'constant_contact') return 'CC';
  if (source === 'both') return 'Both';
  return 'Wix';
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [siteMemberEmails, setSiteMemberEmails] = useState(new Set());
  const [siteMemberUsers, setSiteMemberUsers] = useState([]);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Load data on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(process.env.PUBLIC_URL + '/data/contacts.json'),
          fetch(process.env.PUBLIC_URL + '/data/contactsMeta.json'),
        ]);
        const cData = await cRes.json();
        const mData = await mRes.json();
        if (!cancelled) {
          setContacts(cData);
          setMeta(mData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load site members from Firebase Auth via API
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadMembers() {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/list-users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const { users: fbUsers } = await res.json();
        const emails = new Set();
        const userList = [];
        fbUsers.forEach(u => {
          if (u.email) {
            emails.add(u.email.toLowerCase());
            userList.push({ uid: u.uid, email: u.email, displayName: u.displayName || '' });
          }
        });
        if (!cancelled) {
          setSiteMemberEmails(emails);
          setSiteMemberUsers(userList);
        }
      } catch (err) {
        console.error('[ContactsPage] Failed to load site members:', err);
      }
    }
    loadMembers();
    return () => { cancelled = true; };
  }, [user]);

  // Debounce search
  const handleSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val.toLowerCase().trim());
      setPage(0);
    }, 250);
  }, []);

  // Toggle sort
  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return key;
      }
      setSortDir('asc');
      return key;
    });
    setPage(0);
  }, []);

  // Filtered + sorted contacts
  const filtered = useMemo(() => {
    let list = contacts;

    // Unified list filter (sources + consolidated groups + individual lists)
    if (listFilter === 'site_members') {
      // Include contacts that match a Firebase user
      list = list.filter(c => (c.emails || []).some(e => siteMemberEmails.has(e.toLowerCase())));
      // Add Firebase users not in contacts
      const contactEmails = new Set(contacts.flatMap(c => (c.emails || []).map(e => e.toLowerCase())));
      const firebaseOnly = siteMemberUsers
        .filter(u => !contactEmails.has(u.email.toLowerCase()))
        .map(u => {
          const parts = (u.displayName || '').split(' ');
          return {
            id: `fb-${u.uid}`,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            emails: [u.email],
            source: 'site',
            createdAt: null,
          };
        });
      list = [...firebaseOnly, ...list];
    } else if (listFilter === 'wix') {
      list = list.filter(c => c.source === 'wix');
    } else if (listFilter === 'constant_contact') {
      list = list.filter(c => c.source === 'constant_contact');
    } else if (listFilter === 'both') {
      list = list.filter(c => c.source === 'both');
    } else if (LIST_GROUPS[listFilter]) {
      list = list.filter(c => matchesListGroup(c.cc?.emailLists || [], listFilter));
    } else if (listFilter !== 'all') {
      list = list.filter(c => (c.cc?.emailLists || []).includes(listFilter));
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(c => {
        const wixStatus = c.wix?.emailStatus || '';
        const ccStatus = c.cc?.emailStatus || '';
        return wixStatus === statusFilter || ccStatus === statusFilter;
      });
    }

    // Tag filter
    if (tagFilter !== 'all') {
      list = list.filter(c => (c.cc?.tags || []).includes(tagFilter));
    }

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch;
      list = list.filter(c => {
        const name = ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase();
        const email = (c.emails?.[0] || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        return name.includes(q) || email.includes(q) || company.includes(q);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      let aVal, bVal;
      switch (sortKey) {
        case 'name':
          aVal = ((a.firstName || '') + ' ' + (a.lastName || '')).toLowerCase();
          bVal = ((b.firstName || '') + ' ' + (b.lastName || '')).toLowerCase();
          break;
        case 'email':
          aVal = (a.emails?.[0] || '').toLowerCase();
          bVal = (b.emails?.[0] || '').toLowerCase();
          break;
        case 'source':
          aVal = a.source || '';
          bVal = b.source || '';
          break;
        case 'created':
          aVal = a.createdAt || '';
          bVal = b.createdAt || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [contacts, siteMemberEmails, siteMemberUsers, statusFilter, tagFilter, listFilter, debouncedSearch, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageContacts = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Selected contact
  const selected = selectedId != null ? contacts.find(c => c.id === selectedId) : null;

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [statusFilter, tagFilter, listFilter]);

  const exportCSV = useCallback(() => {
    if (filtered.length === 0) return;
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Source', 'Created'];
    const escape = (val) => {
      const s = String(val || '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map(c => [
      escape(c.firstName),
      escape(c.lastName),
      escape(c.emails?.[0]),
      escape(c.phones?.[0]),
      escape(c.company),
      escape(c.source),
      escape(c.createdAt?.split('T')[0]),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${listFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, listFilter]);

  if (loading) {
    return <div className="contacts-loading">Loading contacts...</div>;
  }

  const sortArrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  return (
    <>
      {/* Toolbar */}
      <div className="contacts-toolbar">
        <input
          className="contacts-search"
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select
          className="contacts-filter-select"
          value={listFilter}
          onChange={e => setListFilter(e.target.value)}
        >
          <option value="all">All{meta ? ` (${meta.totalContacts})` : ''}</option>
          <option value="site_members">Site Members{siteMemberEmails.size > 0 ? ` (${siteMemberEmails.size})` : ''}</option>
          <option value="wix">Wix{meta ? ` (${meta.sources.wix})` : ''}</option>
          <option value="constant_contact">CC{meta ? ` (${meta.sources.constant_contact})` : ''}</option>
          <option value="both">Both{meta ? ` (${meta.sources.both})` : ''}</option>
          <option value="clicked">Clicked</option>
          <option value="writers_journey">Writer's Journey</option>
          <option value="myth_salon">Myth Salon</option>
          {KEEP_LISTS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {meta && meta.ccEmailStatuses.length > 0 && (
          <select
            className="contacts-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {[...new Set([...(meta.emailStatuses || []), ...(meta.ccEmailStatuses || [])])].sort().map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {meta && meta.tags.length > 0 && (
          <select
            className="contacts-filter-select"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {meta.tags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats bar */}
      <div className="contacts-stats-bar">
        <span>
          Showing <span className="contacts-stats-highlight">{filtered.length}</span> of{' '}
          <span className="contacts-stats-highlight">{contacts.length}</span> contacts
        </span>
        {meta && (
          <span>
            Wix: {meta.sources.wix} | CC: {meta.sources.constant_contact} | Both: {meta.sources.both}
          </span>
        )}
        <button className="contacts-export-btn" onClick={exportCSV} disabled={filtered.length === 0}>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Main split panel */}
      <div className="contacts-main">
        <div className="contacts-list-panel">
          {/* Column headers */}
          <div className="contacts-list-header">
            <button
              className={`contacts-col-name ${sortKey === 'name' ? 'sorted' : ''}`}
              onClick={() => handleSort('name')}
            >
              Name{sortArrow('name')}
            </button>
            <button
              className={`contacts-col-email ${sortKey === 'email' ? 'sorted' : ''}`}
              onClick={() => handleSort('email')}
            >
              Email{sortArrow('email')}
            </button>
            <span className="contacts-col-member">Member</span>
            <button
              className={`contacts-col-source ${sortKey === 'source' ? 'sorted' : ''}`}
              onClick={() => handleSort('source')}
            >
              Src{sortArrow('source')}
            </button>
            <button
              className={`contacts-col-date ${sortKey === 'created' ? 'sorted' : ''}`}
              onClick={() => handleSort('created')}
            >
              Created{sortArrow('created')}
            </button>
          </div>

          {/* Contact rows */}
          <div className="contacts-list-scroll">
            {pageContacts.map(c => (
              <button
                key={c.id}
                className={`contacts-row ${selectedId === c.id ? 'active' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="contacts-row-name">
                  {c.firstName || c.lastName
                    ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
                    : '(no name)'}
                </span>
                <span className="contacts-row-email">{c.emails?.[0] || '-'}</span>
                <span className="contacts-row-member">
                  {(c.emails || []).some(e => siteMemberEmails.has(e.toLowerCase())) ? '✓' : ''}
                </span>
                <span className="contacts-row-source">
                  <span className={`contacts-source-badge ${c.source}`}>
                    {sourceLabel(c.source)}
                  </span>
                </span>
                <span className="contacts-row-date">{formatDate(c.createdAt)}</span>
              </button>
            ))}
            {pageContacts.length === 0 && (
              <div className="contacts-loading" style={{ height: 120 }}>
                No contacts match your filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="contacts-pagination">
            <button disabled={page === 0} onClick={() => setPage(0)}>
              &laquo;
            </button>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              &lsaquo; Prev
            </button>
            <span className="contacts-pagination-info">
              Page {totalPages > 0 ? page + 1 : 0} of {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next &rsaquo;
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
              &raquo;
            </button>
          </div>
        </div>

        {/* Detail panel */}
        <div className="contacts-detail">
          {selected ? (
            <>
              <div className="contacts-detail-header">
                <div className="contacts-detail-avatar">{getInitials(selected)}</div>
                <div>
                  <h3 className="contacts-detail-name">
                    {selected.firstName || selected.lastName
                      ? `${selected.firstName || ''} ${selected.lastName || ''}`.trim()
                      : '(no name)'}
                  </h3>
                  {(selected.company || selected.jobTitle) && (
                    <p className="contacts-detail-company">
                      {[selected.jobTitle, selected.company].filter(Boolean).join(' at ')}
                    </p>
                  )}
                  <span className={`contacts-source-badge ${selected.source}`} style={{ marginTop: 4 }}>
                    {sourceLabel(selected.source)}
                  </span>
                </div>
              </div>

              {/* Contact info */}
              <div className="contacts-detail-section">
                <h4 className="contacts-detail-section-title">Contact Info</h4>
                {selected.emails?.map((e, i) => (
                  <div key={i} className="contacts-detail-field">
                    <div className="contacts-detail-label">Email {selected.emails.length > 1 ? i + 1 : ''}</div>
                    <div className="contacts-detail-value">{e}</div>
                  </div>
                ))}
                {selected.phones?.map((p, i) => (
                  <div key={i} className="contacts-detail-field">
                    <div className="contacts-detail-label">Phone {selected.phones.length > 1 ? i + 1 : ''}</div>
                    <div className="contacts-detail-value">{p}</div>
                  </div>
                ))}
                {selected.addresses?.map((a, i) => (
                  <div key={i} className="contacts-detail-field">
                    <div className="contacts-detail-label">Address{a.type ? ` (${a.type})` : ''}</div>
                    <div className="contacts-detail-value">
                      {[a.street, a.city, a.state, a.zip, a.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="contacts-detail-section">
                <h4 className="contacts-detail-section-title">Dates</h4>
                <div className="contacts-detail-field">
                  <div className="contacts-detail-label">Created</div>
                  <div className="contacts-detail-value">{formatDate(selected.createdAt)}</div>
                </div>
                {selected.updatedAt && (
                  <div className="contacts-detail-field">
                    <div className="contacts-detail-label">Updated</div>
                    <div className="contacts-detail-value">{formatDate(selected.updatedAt)}</div>
                  </div>
                )}
              </div>

              {/* Wix details */}
              {selected.wix && (
                <div className="contacts-detail-section">
                  <h4 className="contacts-detail-section-title">Wix Details</h4>
                  {selected.wix.emailStatus && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Email Status</div>
                      <div className="contacts-detail-value">{selected.wix.emailStatus}</div>
                    </div>
                  )}
                  {selected.wix.smsStatus && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">SMS Status</div>
                      <div className="contacts-detail-value">{selected.wix.smsStatus}</div>
                    </div>
                  )}
                  {selected.wix.lastActivity && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Last Activity</div>
                      <div className="contacts-detail-value">
                        {selected.wix.lastActivity}
                        {selected.wix.lastActivityDate && ` (${formatDate(selected.wix.lastActivityDate)})`}
                      </div>
                    </div>
                  )}
                  {selected.wix.language && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Language</div>
                      <div className="contacts-detail-value">{selected.wix.language}</div>
                    </div>
                  )}
                  {selected.wix.labels?.length > 0 && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Labels</div>
                      <div className="contacts-chips">
                        {selected.wix.labels.map((l, i) => (
                          <span key={i} className="contacts-chip">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CC details */}
              {selected.cc && (
                <div className="contacts-detail-section">
                  <h4 className="contacts-detail-section-title">Constant Contact Details</h4>
                  {selected.cc.emailStatus && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Email Status</div>
                      <div className="contacts-detail-value">{selected.cc.emailStatus}</div>
                    </div>
                  )}
                  {selected.cc.permissionStatus && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Permission</div>
                      <div className="contacts-detail-value">{selected.cc.permissionStatus}</div>
                    </div>
                  )}
                  {selected.cc.country && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Country</div>
                      <div className="contacts-detail-value">{selected.cc.country}</div>
                    </div>
                  )}
                  {selected.cc.birthday && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Birthday</div>
                      <div className="contacts-detail-value">{selected.cc.birthday}</div>
                    </div>
                  )}
                  {selected.cc.anniversary && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Anniversary</div>
                      <div className="contacts-detail-value">{selected.cc.anniversary}</div>
                    </div>
                  )}
                  {selected.cc.tags?.length > 0 && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Tags</div>
                      <div className="contacts-chips">
                        {selected.cc.tags.map((t, i) => (
                          <span key={i} className="contacts-chip tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.cc.emailLists?.length > 0 && (
                    <div className="contacts-detail-field">
                      <div className="contacts-detail-label">Email Lists</div>
                      <div className="contacts-chips">
                        {selected.cc.emailLists.map((l, i) => (
                          <span key={i} className="contacts-chip list">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="contacts-detail-empty">Select a contact to view details</div>
          )}
        </div>
      </div>
    </>
  );
}
