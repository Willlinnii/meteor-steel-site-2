import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { COURSES, checkRequirement, requirementProgress } from '../../coursework/courseEngine';
import { validate360File, upload360Media, delete360Media } from '../../lib/media360Upload';
import use360Media from '../../hooks/use360Media';
import { serverTimestamp } from 'firebase/firestore';

import campaignData from '../../data/campaigns/mythicYear.json';
import LEGAL_DOCUMENTS from '../../data/legalDocuments';
import './AdminPage.css';

const ContactsPage = lazy(() => import('./ContactsPage'));
const PanoViewer = lazy(() => import('../../components/PanoViewer'));

const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const POST_TYPE_ICONS = {
  monthIntro: '\uD83D\uDCC5',
  zodiacIntro: '\u2728',
  culturalSpotlight: '\uD83C\uDFDB\uFE0F',
  holidayPost: '\uD83C\uDF89',
  ctaPost: '\uD83D\uDD17',
};

const POST_TYPE_LABELS = {
  monthIntro: 'Month Intro',
  zodiacIntro: 'Zodiac Intro',
  culturalSpotlight: 'Cultural Spotlight',
  holidayPost: 'Holiday Post',
  ctaPost: 'CTA',
};

const ALL_CULTURES = ['Roman', 'Greek', 'Babylonian', 'Vedic', 'Norse', 'Islamic', 'Medieval'];

const STATUSES = ['draft', 'prepared', 'scheduled', 'posted'];

const STATUS_CONFIG = {
  draft:     { color: '#6a6a7a', label: 'Draft' },
  prepared:  { color: '#5b8dd9', label: 'Prepared' },
  scheduled: { color: '#d9a55b', label: 'Scheduled' },
  posted:    { color: '#5bd97a', label: 'Posted' },
};

const CAMPAIGNS = [
  {
    id: 'mythicYear',
    name: 'The Mythic Year',
    description: '12-month zodiac journey through world mythology',
    platform: 'Instagram',
    data: campaignData,
  },
];

// --- Custom hook for post status persistence ---
function usePostStatuses(campaignId) {
  const key = `campaign-statuses-${campaignId}`;
  const [statuses, setStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(statuses));
  }, [key, statuses]);

  const getStatus = useCallback((postId) => statuses[postId] || 'draft', [statuses]);

  const setStatus = useCallback((postId, status) => {
    setStatuses(prev => ({ ...prev, [postId]: status }));
  }, []);

  const setBulkStatus = useCallback((postIds, status) => {
    setStatuses(prev => {
      const next = { ...prev };
      postIds.forEach(id => { next[id] = status; });
      return next;
    });
  }, []);

  return { getStatus, setStatus, setBulkStatus };
}

// --- Filing tracker hook (localStorage persistence) ---
function useFilingTracker() {
  const key = 'ip-filing-tracker';
  const [tracker, setTracker] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(tracker));
  }, [tracker]);

  const getItemData = useCallback((itemId) => tracker[itemId] || {
    status: 'unregistered', filingDate: '', confirmationNumber: '', registrationNumber: '', notes: ''
  }, [tracker]);

  const updateItemData = useCallback((itemId, field, value) => {
    setTracker(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status: 'unregistered', filingDate: '', confirmationNumber: '', registrationNumber: '', notes: '', ...prev[itemId], [field]: value }
    }));
  }, []);

  return { tracker, getItemData, updateItemData };
}

// --- Status dot component ---
function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  if (status === 'posted') {
    return (
      <span className="admin-status-dot posted" style={{ color: cfg.color }} title={cfg.label}>
        &#10003;
      </span>
    );
  }
  return (
    <span
      className={`admin-status-dot ${status === 'draft' ? 'hollow' : 'filled'}`}
      style={{ '--dot-color': cfg.color }}
      title={cfg.label}
    />
  );
}

// --- Campaign List View ---
function CampaignListView({ campaigns, onSelect, getStatusForCampaign }) {
  return (
      <div className="admin-campaign-list">
        <h2 className="admin-campaign-list-title">CAMPAIGN MANAGER</h2>
        <div className="admin-campaign-grid">
          {campaigns.map(campaign => {
            const progress = getStatusForCampaign(campaign);
            return (
              <div key={campaign.id} className="admin-campaign-card">
                <h3 className="admin-campaign-card-name">{campaign.name.toUpperCase()}</h3>
                <p className="admin-campaign-card-desc">{campaign.description}</p>
                <div className="admin-campaign-card-meta">
                  <span className="admin-badge">{campaign.platform}</span>
                  <span className="admin-badge">{campaign.data.length} posts</span>
                </div>
                <div className="admin-campaign-progress">
                  <div className="admin-progress-bar">
                    {STATUSES.map(s => {
                      const pct = progress.total > 0 ? (progress.counts[s] / progress.total) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={s}
                          className="admin-progress-segment"
                          style={{ width: `${pct}%`, background: STATUS_CONFIG[s].color }}
                        />
                      );
                    })}
                  </div>
                  <span className="admin-progress-label">
                    {progress.nonDraft > 0
                      ? `${Math.round((progress.nonDraft / progress.total) * 100)}% progressed`
                      : 'All drafts'}
                  </span>
                </div>
                <button className="admin-campaign-open" onClick={() => onSelect(campaign.id)}>
                  Open Campaign &rarr;
                </button>
              </div>
            );
          })}
          <div className="admin-campaign-card placeholder">
            <h3 className="admin-campaign-card-name">+ NEW CAMPAIGN</h3>
            <p className="admin-campaign-card-desc">(placeholder for future campaigns)</p>
          </div>
        </div>
      </div>
  );
}

// --- Section tabs ---
const SECTIONS = [
  { id: 'plan', label: 'Plan' },
  { id: 'discover', label: 'Discover Page \u2197', href: '/discover' },
  { id: 'campaigns', label: 'Campaign Manager' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'coursework', label: 'Coursework' },
  { id: '360-media', label: '360 Media' },
  { id: 'ip-registry', label: 'IP Registry' },
  { id: 'legal', label: 'Legal' },
  { id: 'services', label: 'Services' },
  { id: 'dev-tools', label: 'Dev Tools' },
  { id: 'system-health', label: 'System Health' },
];

// --- Campaign Manager content (extracted for tab switching) ---
function CampaignManagerSection() {
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const campaign = CAMPAIGNS.find(c => c.id === activeCampaignId);
  const data = useMemo(() => campaign ? campaign.data : [], [campaign]);

  const { getStatus, setStatus, setBulkStatus } = usePostStatuses(activeCampaignId || '__none');

  // Build a progress summary for a campaign (used by list view)
  const getStatusForCampaign = useCallback((camp) => {
    const key = `campaign-statuses-${camp.id}`;
    let saved = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) saved = JSON.parse(raw);
    } catch { /* ignore */ }
    const counts = { draft: 0, prepared: 0, scheduled: 0, posted: 0 };
    camp.data.forEach(post => {
      const s = saved[post.id] || 'draft';
      counts[s]++;
    });
    return {
      total: camp.data.length,
      counts,
      nonDraft: counts.prepared + counts.scheduled + counts.posted,
    };
  }, []);

  const months = useMemo(() => {
    const grouped = {};
    data.forEach(post => {
      if (!grouped[post.campaignMonth]) {
        grouped[post.campaignMonth] = {
          num: post.campaignMonth,
          sign: post.zodiacSign,
          calMonth: post.calendarMonth,
          startDate: post.startDate,
          endDate: post.endDate,
          posts: [],
        };
      }
      grouped[post.campaignMonth].posts.push(post);
    });
    return grouped;
  }, [data]);

  const currentMonth = months[selectedMonth];
  const currentPosts = useMemo(() => currentMonth ? currentMonth.posts : [], [currentMonth]);

  // Apply status filter
  const filteredPosts = statusFilter === 'all'
    ? currentPosts
    : currentPosts.filter(p => getStatus(p.id) === statusFilter);

  const selectedPost = selectedPostId
    ? data.find(p => p.id === selectedPostId)
    : filteredPosts[0] || null;

  const stats = useMemo(() => {
    const types = {};
    const cultureSet = new Set();
    data.forEach(p => {
      types[p.postType] = (types[p.postType] || 0) + 1;
      if (p.cultures) p.cultures.forEach(c => cultureSet.add(c));
    });
    return { total: data.length, types, cultures: cultureSet.size };
  }, [data]);

  // Status counts for current month
  const monthStatusCounts = useMemo(() => {
    const counts = { draft: 0, prepared: 0, scheduled: 0, posted: 0 };
    currentPosts.forEach(p => { counts[getStatus(p.id)]++; });
    return counts;
  }, [currentPosts, getStatus]);

  // Overall campaign status counts
  const campaignStatusCounts = useMemo(() => {
    const counts = { draft: 0, prepared: 0, scheduled: 0, posted: 0 };
    data.forEach(p => { counts[getStatus(p.id)]++; });
    return counts;
  }, [data, getStatus]);

  // Filter counts for current month
  const filterCounts = useMemo(() => {
    const counts = { all: currentPosts.length, draft: 0, prepared: 0, scheduled: 0, posted: 0 };
    currentPosts.forEach(p => { counts[getStatus(p.id)]++; });
    return counts;
  }, [currentPosts, getStatus]);

  // Month progress for timeline badges
  const monthProgress = useMemo(() => {
    const prog = {};
    Object.values(months).forEach(m => {
      const counts = { draft: 0, prepared: 0, scheduled: 0, posted: 0 };
      m.posts.forEach(p => { counts[getStatus(p.id)]++; });
      prog[m.num] = { total: m.posts.length, counts };
    });
    return prog;
  }, [months, getStatus]);

  const monthCultures = currentMonth
    ? [...new Set(currentPosts.flatMap(p => p.cultures || []))]
    : [];

  const activeCulturesCount = currentMonth
    ? ALL_CULTURES.filter(c => monthCultures.includes(c)).length
    : 0;

  // --- Campaign list view ---
  if (!activeCampaignId) {
    return (
      <CampaignListView
        campaigns={CAMPAIGNS}
        onSelect={setActiveCampaignId}
        getStatusForCampaign={getStatusForCampaign}
      />
    );
  }

  // --- Campaign detail view ---
  return (
    <>
      <div className="admin-campaign-back-row">
        <button className="admin-back" onClick={() => setActiveCampaignId(null)}>
          &larr; Back to Campaigns
        </button>
      </div>

      <div className="admin-campaign-header">
        <div className="admin-campaign-info">
          <h2 className="admin-campaign-name">{campaign.name.toUpperCase()}</h2>
          <p className="admin-campaign-desc">{campaign.description}</p>
          <div className="admin-campaign-meta">
            <span className="admin-badge">{campaign.platform}</span>
            <span className="admin-badge">{stats.total} posts</span>
            {STATUSES.map(s => (
              <span key={s} className="admin-badge" style={{ borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color }}>
                {campaignStatusCounts[s]} {STATUS_CONFIG[s].label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-timeline">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
          const m = months[num];
          if (!m) return null;
          const prog = monthProgress[num];
          return (
            <button
              key={num}
              className={`admin-month-badge ${selectedMonth === num ? 'active' : ''}`}
              onClick={() => { setSelectedMonth(num); setSelectedPostId(null); setStatusFilter('all'); }}
              title={`${m.calMonth} \u2014 ${m.sign}`}
            >
              <span className="admin-month-symbol">{ZODIAC_SYMBOLS[m.sign]}</span>
              <span className="admin-month-label">{m.calMonth.substring(0, 3)}</span>
              {prog && (
                <div className="admin-month-progress-bar">
                  {STATUSES.map(s => {
                    const pct = prog.total > 0 ? (prog.counts[s] / prog.total) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={s}
                        className="admin-month-progress-seg"
                        style={{ width: `${pct}%`, background: STATUS_CONFIG[s].color }}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="admin-main">
        <div className="admin-post-list">
          <div className="admin-month-header">
            <div className="admin-month-header-top">
              <div>
                <h3>{currentMonth?.calMonth} &mdash; {currentMonth?.sign} {ZODIAC_SYMBOLS[currentMonth?.sign]}</h3>
                <p className="admin-month-cultures">
                  Cultures: {monthCultures.filter(c => c !== 'All').join(', ') || 'All'}
                </p>
                <p className="admin-month-count">
                  {currentPosts.length} posts &mdash;{' '}
                  {STATUSES.filter(s => monthStatusCounts[s] > 0).map(s =>
                    `${monthStatusCounts[s]} ${STATUS_CONFIG[s].label.toLowerCase()}`
                  ).join(', ')}
                </p>
              </div>
              <div className="admin-bulk-actions">
                <label className="admin-bulk-label">Mark all as:</label>
                <select
                  className="admin-bulk-select"
                  value=""
                  onChange={e => {
                    if (e.target.value) {
                      setBulkStatus(currentPosts.map(p => p.id), e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>Choose...</option>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-status-filters">
              <button
                className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({filterCounts.all})
              </button>
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`admin-filter-btn ${statusFilter === s ? 'active' : ''}`}
                  style={statusFilter === s ? { borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color } : {}}
                  onClick={() => setStatusFilter(s)}
                >
                  {STATUS_CONFIG[s].label} ({filterCounts[s]})
                </button>
              ))}
            </div>
          </div>

          <div className="admin-posts-scroll">
            {filteredPosts.map(post => (
              <button
                key={post.id}
                className={`admin-post-card ${selectedPost?.id === post.id ? 'active' : ''}`}
                onClick={() => setSelectedPostId(post.id)}
              >
                <StatusDot status={getStatus(post.id)} />
                <div className="admin-post-card-content">
                  <div className="admin-post-card-header">
                    <span className="admin-post-icon">{POST_TYPE_ICONS[post.postType]}</span>
                    <span className="admin-post-type">{POST_TYPE_LABELS[post.postType]}</span>
                    <span className="admin-post-week">W{post.weekNumber} {post.dayOfWeek}</span>
                  </div>
                  <div className="admin-post-card-title">{post.title}</div>
                  {post.holiday && <div className="admin-post-holiday">{post.holiday}</div>}
                </div>
              </button>
            ))}
            {filteredPosts.length === 0 && (
              <div className="admin-no-posts">No posts match this filter.</div>
            )}
          </div>
        </div>

        <div className="admin-preview">
          {selectedPost ? (
            <>
              <div className="admin-preview-header">
                <h3>POST PREVIEW</h3>
                <span className="admin-preview-id">#{selectedPost.id}</span>
              </div>

              <div className="admin-preview-status-row">
                <label className="admin-preview-status-label">Status:</label>
                <select
                  className="admin-preview-status-select"
                  value={getStatus(selectedPost.id)}
                  onChange={e => setStatus(selectedPost.id, e.target.value)}
                  style={{ borderColor: STATUS_CONFIG[getStatus(selectedPost.id)].color }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              <div className="admin-preview-badge-row">
                <span className="admin-badge type">{POST_TYPE_LABELS[selectedPost.postType]}</span>
                {selectedPost.cultures?.map(c => (
                  <span key={c} className="admin-badge culture">{c}</span>
                ))}
              </div>
              <h4 className="admin-preview-title">{selectedPost.title}</h4>
              <div className="admin-preview-caption">
                {selectedPost.caption.split('\n').map((line, i) => (
                  line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
                ))}
              </div>
              <div className="admin-preview-meta">
                <span>{selectedPost.caption.length} / 2,200 chars</span>
                <span>{selectedPost.hashtags?.length || 0} hashtags</span>
              </div>
              <div className="admin-preview-hashtags">
                {selectedPost.hashtags?.join(' ')}
              </div>
              {selectedPost.stone && (
                <div className="admin-preview-extra">Stone: {selectedPost.stone}</div>
              )}
              {selectedPost.flower && (
                <div className="admin-preview-extra">Flower: {selectedPost.flower}</div>
              )}
            </>
          ) : (
            <div className="admin-preview-empty">Select a post to preview</div>
          )}
        </div>
      </div>

      <div className="admin-footer-stats">
        <div className="admin-stat">
          <span className="admin-stat-value">{currentPosts.length}</span>
          <span className="admin-stat-label">posts this month</span>
        </div>
        {STATUSES.map(s => (
          <div key={s} className="admin-stat">
            <span className="admin-stat-value" style={{ color: STATUS_CONFIG[s].color }}>
              {campaignStatusCounts[s]}
            </span>
            <span className="admin-stat-label">{STATUS_CONFIG[s].label.toLowerCase()}</span>
          </div>
        ))}
        <div className="admin-stat">
          <span className="admin-stat-value">{activeCulturesCount} of 7</span>
          <span className="admin-stat-label">cultures active</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.total}</span>
          <span className="admin-stat-label">total posts</span>
        </div>
      </div>
    </>
  );
}

// --- Main Admin Page with section tabs ---
// --- Coursework Manager Section ---
function CourseworkManagerSection() {
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]?.id || null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const course = COURSES.find(c => c.id === selectedCourse);

  const loadUserStats = useCallback(async () => {
    if (!firebaseConfigured || !db) return;
    setLoadingStats(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const stats = { totalUsers: 0, courseCompletions: {}, userDetails: [] };

      for (const userDoc of usersSnap.docs) {
        stats.totalUsers++;
        const uid = userDoc.id;
        const userData = userDoc.data();

        // Load progress for this user
        const progressSnap = await getDocs(collection(db, 'users', uid, 'progress'));
        const progress = {};
        progressSnap.forEach(doc => { progress[doc.id] = doc.data(); });

        // Load certificates
        let certs = {};
        try {
          const certSnap = await getDocs(collection(db, 'users', uid, 'meta'));
          certSnap.forEach(doc => {
            if (doc.id === 'certificates') certs = doc.data().completed || {};
          });
        } catch { /* no certs */ }

        const userCourseStates = COURSES.map(c => ({
          courseId: c.id,
          completed: !!certs[c.id],
          progress: c.requirements.reduce((sum, req) => sum + requirementProgress(req, progress), 0) / Math.max(c.requirements.length, 1),
          reqDetails: c.requirements.map(req => ({
            id: req.id,
            description: req.description,
            met: checkRequirement(req, progress),
            progress: requirementProgress(req, progress),
          })),
        }));

        stats.userDetails.push({
          uid,
          email: userData.email || uid,
          displayName: userData.displayName || '',
          courses: userCourseStates,
        });

        for (const cs of userCourseStates) {
          if (cs.completed) {
            stats.courseCompletions[cs.courseId] = (stats.courseCompletions[cs.courseId] || 0) + 1;
          }
        }
      }

      setUserStats(stats);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
    setLoadingStats(false);
  }, []);

  return (
    <div className="admin-coursework">
      <h2 className="admin-coursework-title">COURSE MANAGEMENT</h2>

      <div className="admin-coursework-selector">
        <label className="admin-coursework-label">Select Course:</label>
        <select
          className="admin-coursework-select"
          value={selectedCourse || ''}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          {COURSES.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.active ? '' : '(inactive)'}</option>
          ))}
        </select>
      </div>

      {course && (
        <div className="admin-coursework-detail">
          <div className="admin-coursework-info">
            <h3 className="admin-coursework-course-name">{course.name}</h3>
            <span className={`admin-coursework-badge ${course.active ? 'active' : 'inactive'}`}>
              {course.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="admin-coursework-desc">{course.description}</p>

          <h4 className="admin-coursework-req-title">Requirements ({course.requirements.length})</h4>
          <div className="admin-coursework-req-list">
            {course.requirements.map(req => (
              <div key={req.id} className="admin-coursework-req">
                <span className="admin-coursework-req-id">{req.id}</span>
                <span className="admin-coursework-req-type">{req.type}</span>
                <span className="admin-coursework-req-desc">{req.description}</span>
                {req.elements && (
                  <span className="admin-coursework-req-count">{req.elements.length} elements</span>
                )}
                {req.threshold && (
                  <span className="admin-coursework-req-count">threshold: {req.threshold}</span>
                )}
                {req.percent && (
                  <span className="admin-coursework-req-count">{req.percent}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-coursework-analytics">
        <h4 className="admin-coursework-req-title">User Analytics</h4>
        <button
          className="admin-coursework-load-btn"
          onClick={loadUserStats}
          disabled={loadingStats}
        >
          {loadingStats ? 'Loading...' : 'Load User Data'}
        </button>

        {userStats && (
          <div className="admin-coursework-stats">
            <div className="admin-coursework-stat-row">
              <span>Total users:</span>
              <strong>{userStats.totalUsers}</strong>
            </div>
            {COURSES.map(c => (
              <div key={c.id} className="admin-coursework-stat-row">
                <span>{c.name} completions:</span>
                <strong>{userStats.courseCompletions[c.id] || 0}</strong>
              </div>
            ))}

            {selectedCourse && (
              <div className="admin-coursework-users">
                <h4 className="admin-coursework-req-title">
                  User Progress: {course?.name}
                </h4>
                {userStats.userDetails.map(u => {
                  const cs = u.courses.find(c => c.courseId === selectedCourse);
                  if (!cs) return null;
                  const pct = Math.round(cs.progress * 100);
                  return (
                    <div key={u.uid} className="admin-coursework-user-row">
                      <span className="admin-coursework-user-email">{u.email}</span>
                      <span className={`admin-coursework-user-status ${cs.completed ? 'done' : pct > 0 ? 'progress' : 'none'}`}>
                        {cs.completed ? 'Completed' : `${pct}%`}
                      </span>
                      <div className="admin-coursework-user-bar">
                        <div className="admin-coursework-user-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Mentor Manager Section ---
function MentorManagerSection() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const loadApplications = useCallback(async () => {
    if (!firebaseConfigured || !db) return;
    setLoadingApps(true);
    try {
      const q = query(collection(db, 'mentor-applications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const apps = [];
      snap.forEach(doc => apps.push({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load mentor applications:', err);
    }
    setLoadingApps(false);
  }, []);

  const handleAction = async (appId, action) => {
    setActionLoading(appId);
    try {
      const token = await user.getIdToken();
      const body = { applicationId: appId, action };
      if (action === 'reject' && rejectReason.trim()) {
        body.rejectionReason = rejectReason.trim();
      }
      const res = await fetch('/api/mentor-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh the list
        await loadApplications();
        setRejectReason('');
      }
    } catch (err) {
      console.error('Mentor admin action failed:', err);
    }
    setActionLoading(null);
  };

  // Sort: pending first, then by date
  const sorted = useMemo(() => {
    return [...applications].sort((a, b) => {
      if (a.status === 'pending-admin' && b.status !== 'pending-admin') return -1;
      if (b.status === 'pending-admin' && a.status !== 'pending-admin') return 1;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [applications]);

  const STATUS_COLORS = {
    'pending-admin': '#d9a55b',
    'approved': '#5bd97a',
    'rejected': '#d95b5b',
  };

  return (
    <div className="admin-coursework">
      <h2 className="admin-coursework-title">MENTOR APPLICATIONS</h2>

      <button
        className="admin-coursework-load-btn"
        onClick={loadApplications}
        disabled={loadingApps}
      >
        {loadingApps ? 'Loading...' : 'Load Applications'}
      </button>

      {sorted.length > 0 && (
        <div className="admin-coursework-stats">
          <div className="admin-coursework-stat-row">
            <span>Total applications:</span>
            <strong>{sorted.length}</strong>
          </div>
          <div className="admin-coursework-stat-row">
            <span>Pending:</span>
            <strong>{sorted.filter(a => a.status === 'pending-admin').length}</strong>
          </div>
        </div>
      )}

      <div className="admin-coursework-users">
        {sorted.map(app => {
          const expanded = expandedApp === app.id;
          return (
            <div key={app.id} className="admin-coursework-user-row" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }} onClick={() => setExpandedApp(expanded ? null : app.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="admin-coursework-user-email">{app.displayName || app.email || app.uid}</span>
                <span className="admin-badge" style={{ borderColor: STATUS_COLORS[app.status], color: STATUS_COLORS[app.status] }}>
                  {app.status}
                </span>
                <span className="admin-badge">{app.mentorType}</span>
                <span className="admin-coursework-req-count">L{app.credentialLevel}</span>
              </div>

              {expanded && (
                <div style={{ marginTop: '12px', paddingLeft: '8px' }}>
                  <div className="admin-coursework-req-desc" style={{ marginBottom: '8px' }}>
                    <strong>Credential:</strong> {app.credentialDetails || 'No details'}
                  </div>
                  <div className="admin-coursework-req-desc" style={{ marginBottom: '8px' }}>
                    <strong>Statement:</strong> {app.applicationSummary}
                  </div>
                  {app.atlasScreening && (
                    <div className="admin-coursework-req-desc" style={{ marginBottom: '8px' }}>
                      <strong>Atlas Assessment:</strong> {app.atlasScreening.passed ? 'Passed' : 'Failed'} — {app.atlasScreening.notes}
                    </div>
                  )}
                  {app.documentUrl && (
                    <div style={{ marginBottom: '8px' }}>
                      <a href={app.documentUrl} target="_blank" rel="noopener noreferrer" className="admin-badge" style={{ borderColor: '#5b8dd9', color: '#5b8dd9' }}>
                        View Document: {app.documentName || 'Download'}
                      </a>
                    </div>
                  )}
                  {app.rejectionReason && (
                    <div className="admin-coursework-req-desc" style={{ marginBottom: '8px' }}>
                      <strong>Rejection Reason:</strong> {app.rejectionReason}
                    </div>
                  )}

                  {app.status === 'pending-admin' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="admin-coursework-load-btn"
                        style={{ background: '#1a3a1a', borderColor: '#5bd97a', color: '#5bd97a' }}
                        onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'approve'); }}
                        disabled={actionLoading === app.id}
                      >
                        Approve
                      </button>
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="admin-coursework-select"
                        style={{ flex: 1, minWidth: '200px' }}
                      />
                      <button
                        className="admin-coursework-load-btn"
                        style={{ background: '#3a1a1a', borderColor: '#d95b5b', color: '#d95b5b' }}
                        onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'reject'); }}
                        disabled={actionLoading === app.id}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Subscribers Section ---
const SUBSCRIPTION_ITEMS = [
  { id: 'ybr', name: 'Yellow Brick Road' },
  { id: 'forge', name: 'Story Forge' },
  { id: 'coursework', name: 'Coursework' },
  { id: 'xr', name: 'VR / XR' },
];

const PURCHASE_ITEMS = [
  { id: 'fallen-starlight', name: 'Fallen Starlight' },
  { id: 'story-of-stories', name: 'Story of Stories' },
  { id: 'starlight-bundle', name: 'Starlight Bundle' },
];

function SubscribersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('any');

  const loadSubscribers = useCallback(async () => {
    if (!firebaseConfigured || !db) return;
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const results = [];

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        let profileData = {};
        try {
          const metaSnap = await getDocs(collection(db, 'users', uid, 'meta'));
          metaSnap.forEach(doc => {
            if (doc.id === 'profile') profileData = doc.data();
          });
        } catch { /* no profile */ }

        const subs = profileData.subscriptions || {};
        const purchases = profileData.purchases || {};
        const activeSubs = SUBSCRIPTION_ITEMS.filter(s => subs[s.id]);
        const activePurchases = PURCHASE_ITEMS.filter(p => purchases[p.id]);

        results.push({
          uid,
          email: userData.email || uid,
          displayName: userData.displayName || '',
          subscriptions: activeSubs,
          purchases: activePurchases,
          hasAnything: activeSubs.length > 0 || activePurchases.length > 0,
          subCount: activeSubs.length,
          purchaseCount: activePurchases.length,
        });
      }

      results.sort((a, b) => (b.subCount + b.purchaseCount) - (a.subCount + a.purchaseCount));
      setUsers(results);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    }
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'any') return users.filter(u => u.hasAnything);
    if (filter === 'all') return users;
    if (filter === 'none') return users.filter(u => !u.hasAnything);
    // Filter by specific subscription or purchase id
    return users.filter(u =>
      u.subscriptions.some(s => s.id === filter) || u.purchases.some(p => p.id === filter)
    );
  }, [users, filter]);

  // Summary counts
  const subCounts = useMemo(() => {
    const counts = {};
    SUBSCRIPTION_ITEMS.forEach(s => { counts[s.id] = 0; });
    PURCHASE_ITEMS.forEach(p => { counts[p.id] = 0; });
    users.forEach(u => {
      u.subscriptions.forEach(s => { counts[s.id]++; });
      u.purchases.forEach(p => { counts[p.id]++; });
    });
    return counts;
  }, [users]);

  const totalWithAnything = users.filter(u => u.hasAnything).length;

  return (
    <div className="admin-coursework">
      <h2 className="admin-coursework-title">SUBSCRIBERS &amp; PURCHASES</h2>

      <button
        className="admin-coursework-load-btn"
        onClick={loadSubscribers}
        disabled={loading}
      >
        {loading ? 'Loading...' : users.length > 0 ? 'Refresh' : 'Load Subscriber Data'}
      </button>

      {users.length > 0 && (
        <>
          <div className="admin-subscribers-summary">
            <div className="admin-subscribers-summary-header">
              <span>{users.length} total users</span>
              <span className="admin-subscribers-highlight">{totalWithAnything} with active subscriptions or purchases</span>
            </div>

            <div className="admin-subscribers-counts">
              <div className="admin-subscribers-counts-group">
                <span className="admin-subscribers-group-label">Subscriptions</span>
                {SUBSCRIPTION_ITEMS.map(s => (
                  <button
                    key={s.id}
                    className={`admin-subscribers-count-btn ${filter === s.id ? 'active' : ''}`}
                    onClick={() => setFilter(f => f === s.id ? 'any' : s.id)}
                  >
                    <span className="admin-subscribers-count-name">{s.name}</span>
                    <span className="admin-subscribers-count-num">{subCounts[s.id]}</span>
                  </button>
                ))}
              </div>
              <div className="admin-subscribers-counts-group">
                <span className="admin-subscribers-group-label">Purchases</span>
                {PURCHASE_ITEMS.map(p => (
                  <button
                    key={p.id}
                    className={`admin-subscribers-count-btn purchase ${filter === p.id ? 'active' : ''}`}
                    onClick={() => setFilter(f => f === p.id ? 'any' : p.id)}
                  >
                    <span className="admin-subscribers-count-name">{p.name}</span>
                    <span className="admin-subscribers-count-num">{subCounts[p.id]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-subscribers-filter-row">
              <label className="admin-subscribers-filter-label">Show:</label>
              <select
                className="admin-coursework-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="any">Users with subscriptions/purchases</option>
                <option value="all">All users</option>
                <option value="none">Users with nothing active</option>
                {SUBSCRIPTION_ITEMS.map(s => (
                  <option key={s.id} value={s.id}>{s.name} subscribers</option>
                ))}
                {PURCHASE_ITEMS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} owners</option>
                ))}
              </select>
              <span className="admin-subscribers-result-count">{filtered.length} users</span>
            </div>
          </div>

          <div className="admin-subscribers-list">
            {filtered.map(u => (
              <div key={u.uid} className="admin-subscribers-row">
                <div className="admin-subscribers-user">
                  <span className="admin-subscribers-email">{u.displayName || u.email}</span>
                  {u.displayName && <span className="admin-subscribers-uid">{u.email}</span>}
                </div>
                <div className="admin-subscribers-badges">
                  {u.subscriptions.map(s => (
                    <span key={s.id} className="admin-subscribers-badge sub">{s.name}</span>
                  ))}
                  {u.purchases.map(p => (
                    <span key={p.id} className="admin-subscribers-badge purchase">{p.name}</span>
                  ))}
                  {!u.hasAnything && (
                    <span className="admin-subscribers-badge none">No active items</span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="admin-no-posts">No users match this filter.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Services data ---
const SERVICES = [
  // ── Paid ──────────────────────────────────────────────
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    url: 'https://console.anthropic.com',
    category: 'AI / LLM',
    usedFor: 'Atlas chat, mentor review',
    paid: 'Paid',
    status: 'Active',
    envVars: ['ANTHROPIC_API_KEY'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    url: 'https://platform.openai.com',
    category: 'AI / LLM',
    usedFor: 'Persona voices',
    paid: 'Paid',
    status: 'Active',
    envVars: ['OPENAI_API_KEY'],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    url: 'https://replicate.com',
    category: 'AI / TTS',
    usedFor: 'Chatterbox voice synthesis for Atlas TTS',
    paid: 'Paid',
    status: 'Active',
    envVars: ['REPLICATE_API_TOKEN'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io',
    category: 'AI / TTS',
    usedFor: 'Text-to-speech voice generation',
    paid: 'Paid',
    status: 'Configured',
    envVars: ['ELEVENLABS_API_KEY'],
  },
  {
    id: 'hostinger',
    name: 'Hostinger',
    url: 'https://hostinger.com',
    category: 'Domain / DNS',
    usedFor: 'Domain registration & DNS management',
    paid: 'Paid',
    status: 'Active',
    envVars: [],
  },
  // ── Free tier (subscription) ──────────────────────────
  {
    id: 'firebase',
    name: 'Firebase',
    url: 'https://firebase.google.com',
    category: 'Database / Auth / Storage',
    usedFor: 'User auth, Firestore DB, file storage',
    paid: 'Free tier',
    status: 'Active',
    envVars: ['REACT_APP_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_PROJECT_ID'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    url: 'https://vercel.com',
    category: 'Hosting',
    usedFor: 'Frontend + serverless API hosting',
    paid: 'Free tier',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'google_maps',
    name: 'Google Maps',
    url: 'https://console.cloud.google.com/google/maps-apis/home?project=mythouse-site',
    category: 'Mapping / 360 VR',
    usedFor: 'Street View 360 panoramas on Mythic Earth sites, Maps Embed API',
    paid: 'Free tier',
    status: 'Active',
    envVars: ['REACT_APP_GOOGLE_MAPS_API_KEY'],
    clientEnvCheck: 'REACT_APP_GOOGLE_MAPS_API_KEY',
  },
  {
    id: 'arcgis',
    name: 'ArcGIS',
    url: 'https://arcgis.com',
    category: 'Satellite Imagery',
    usedFor: 'Globe imagery tiles',
    paid: 'Free tier',
    status: 'Active',
    envVars: [],
  },
  // ── Free / Open Source ────────────────────────────────
  {
    id: 'google_oauth',
    name: 'Google OAuth',
    url: 'https://console.cloud.google.com',
    category: 'Authentication',
    usedFor: 'Google sign-in',
    paid: 'Free',
    status: 'Active',
    envVars: ['REACT_APP_FIREBASE_AUTH_DOMAIN'],
    clientEnvCheck: 'REACT_APP_FIREBASE_AUTH_DOMAIN',
  },
  {
    id: 'cesium',
    name: 'Cesium.js',
    url: 'https://cesium.com',
    category: '3D Mapping',
    usedFor: 'Mythic Earth globe',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: ['REACT_APP_CESIUM_TOKEN'],
    clientEnvCheck: 'REACT_APP_CESIUM_TOKEN',
  },
  {
    id: 'threejs',
    name: 'Three.js',
    url: 'https://threejs.org',
    category: '3D Graphics',
    usedFor: 'Orbital diagrams, VR scenes',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'astronomy_engine',
    name: 'Astronomy Engine',
    url: 'https://github.com/cosinekitty/astronomy',
    category: 'Calculations',
    usedFor: 'Planetary positions, moon phases',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'wikisource',
    name: 'Wikisource',
    url: 'https://wikisource.org',
    category: 'Text API',
    usedFor: 'Sacred/classic text access',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com',
    category: 'Video',
    usedFor: 'Mythology Channel playlists, embedded video content',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    url: 'https://soundcloud.com',
    category: 'Audio',
    usedFor: 'Embedded music on Fallen Starlight page',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'openlibrary',
    name: 'Open Library',
    url: 'https://openlibrary.org',
    category: 'Book Data',
    usedFor: 'Book search, covers, and metadata for Library',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'worldtimeapi',
    name: 'WorldTimeAPI',
    url: 'https://worldtimeapi.org',
    category: 'Utilities',
    usedFor: 'Timezone detection for orbital diagrams',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    id: 'ipwho',
    name: 'IPWho',
    url: 'https://ipwho.is',
    category: 'Utilities',
    usedFor: 'IP geolocation for natal chart defaults',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
];

const SERVICE_STATUS_COLORS = {
  Active: '#5bd97a',
  Configured: '#5b8dd9',
  Unused: '#6a6a7a',
};

const SERVICE_PAID_COLORS = {
  Paid: '#d95b5b',
  'Free tier': '#5bd97a',
  Free: '#5bd97a',
  'Free (OSS)': '#7a7ab8',
};

const HEALTH_BADGE_CONFIG = {
  live:           { color: '#5bd97a', border: '#5bd97a' },
  error:          { color: '#d95b5b', border: '#d95b5b' },
  not_configured: { color: '#d95b5b', border: '#d95b5b' },
  bundled:        { color: '#6a6a7a', border: '#6a6a7a' },
  no_api:         { color: '#6a6a7a', border: '#6a6a7a' },
  checking:       { color: '#d9a55b', border: '#d9a55b' },
};

function HealthBadge({ result, svc }) {
  if (!result) return null;

  // Static / bundled packages
  if (result.checkType === 'static') {
    const cfg = HEALTH_BADGE_CONFIG.bundled;
    return (
      <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }}>
        Bundled
      </span>
    );
  }

  // No API to ping
  if (result.checkType === 'no_api') {
    const cfg = HEALTH_BADGE_CONFIG.no_api;
    return (
      <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }}>
        No API
      </span>
    );
  }

  // Client env — check on frontend since server can't see REACT_APP_* vars
  if (result.checkType === 'client_env') {
    const envKey = svc.clientEnvCheck;
    const isSet = envKey && !!process.env[envKey];
    const cfg = isSet ? HEALTH_BADGE_CONFIG.live : HEALTH_BADGE_CONFIG.not_configured;
    return (
      <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }}>
        {isSet ? 'Configured' : 'Not configured'}
      </span>
    );
  }

  // Not configured (env var missing on server)
  if (result.configured === false) {
    const cfg = HEALTH_BADGE_CONFIG.not_configured;
    return (
      <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }} title={result.error}>
        Not configured
      </span>
    );
  }

  // Live
  if (result.live) {
    const cfg = HEALTH_BADGE_CONFIG.live;
    return (
      <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }}>
        Live ({result.latencyMs}ms)
      </span>
    );
  }

  // Error (configured but failed)
  const cfg = HEALTH_BADGE_CONFIG.error;
  return (
    <span className="admin-health-badge" style={{ color: cfg.color, borderColor: cfg.border }} title={result.error}>
      Error
    </span>
  );
}

function UsagePanel({ svcId, usage }) {
  if (!usage) return null;

  // Services that show nothing extra
  const FREE_IDS = new Set([
    'hostinger', 'arcgis', 'google_oauth', 'cesium', 'threejs',
    'astronomy_engine', 'wikisource', 'youtube', 'soundcloud',
    'openlibrary', 'worldtimeapi', 'ipwho',
  ]);
  if (FREE_IDS.has(svcId)) return null;

  // Unavailable — show reason
  if (usage.available === false) {
    return (
      <div className="admin-usage-panel">
        <span className="admin-usage-unavailable">{usage.reason || usage.error || 'Unavailable'}</span>
      </div>
    );
  }

  // Anthropic / OpenAI — cost summary + model table
  if (svcId === 'anthropic' || svcId === 'openai') {
    return (
      <div className="admin-usage-panel">
        <div className="admin-usage-costs">
          <div className="admin-usage-cost-item">
            <span className="admin-usage-cost-label">30-day spend</span>
            <span className="admin-usage-cost-value">${(usage.cost30d || 0).toFixed(2)}</span>
          </div>
          <div className="admin-usage-cost-item">
            <span className="admin-usage-cost-label">Today</span>
            <span className="admin-usage-cost-value">${(usage.todayCost || 0).toFixed(2)}</span>
          </div>
        </div>
        {usage.topModels && usage.topModels.length > 0 && (
          <table className="admin-usage-model-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Tokens</th>
                {usage.topModels[0].cost != null && <th>Cost</th>}
              </tr>
            </thead>
            <tbody>
              {usage.topModels.map((m, i) => (
                <tr key={i}>
                  <td className="admin-usage-model-name">{m.model}</td>
                  <td>{(m.tokens || 0).toLocaleString()}</td>
                  {m.cost != null && <td>${m.cost.toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {usage.error && <span className="admin-usage-error">{usage.error}</span>}
      </div>
    );
  }

  // ElevenLabs — character usage bar + tier
  if (svcId === 'elevenlabs') {
    const pct = usage.characterLimit > 0
      ? Math.min(100, Math.round((usage.charactersUsed / usage.characterLimit) * 100))
      : 0;
    const barColor = pct > 90 ? '#d95b5b' : pct > 70 ? '#d9a55b' : '#5bd97a';
    return (
      <div className="admin-usage-panel">
        <div className="admin-usage-bar-row">
          <span className="admin-usage-bar-label">
            Characters: {(usage.charactersUsed || 0).toLocaleString()} / {(usage.characterLimit || 0).toLocaleString()}
          </span>
          <span className="admin-usage-bar-pct">{pct}%</span>
        </div>
        <div className="admin-usage-bar">
          <div className="admin-usage-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="admin-usage-meta-row">
          <span>Voices: {usage.voiceSlotsUsed}/{usage.voiceLimit}</span>
          <span>Tier: {usage.tier}</span>
          {usage.resetsAt && <span>Resets: {new Date(usage.resetsAt).toLocaleDateString()}</span>}
        </div>
        {usage.error && <span className="admin-usage-error">{usage.error}</span>}
      </div>
    );
  }

  // Vercel — charges summary
  if (svcId === 'vercel') {
    const charges = Array.isArray(usage.charges) ? usage.charges : [];
    const total = charges.reduce((sum, c) => sum + (c.amount || c.total || 0), 0);
    return (
      <div className="admin-usage-panel">
        <div className="admin-usage-costs">
          <div className="admin-usage-cost-item">
            <span className="admin-usage-cost-label">30-day charges</span>
            <span className="admin-usage-cost-value">
              {total > 0 ? `$${(total / 100).toFixed(2)}` : '$0.00'}
            </span>
          </div>
          {charges.length > 0 && (
            <div className="admin-usage-cost-item">
              <span className="admin-usage-cost-label">Line items</span>
              <span className="admin-usage-cost-value">{charges.length}</span>
            </div>
          )}
        </div>
        {usage.error && <span className="admin-usage-error">{usage.error}</span>}
      </div>
    );
  }

  return null;
}

function ServicesSection() {
  const { user } = useAuth();
  const [healthResults, setHealthResults] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [usageResults, setUsageResults] = useState(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageError, setUsageError] = useState(null);

  const runHealthCheck = useCallback(async () => {
    if (!user) return;
    setChecking(true);
    setCheckError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/health-check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Index results by id for quick lookup
      const map = {};
      for (const r of data.results) map[r.id] = r;
      setHealthResults(map);
    } catch (err) {
      setCheckError(err.message);
    }
    setChecking(false);
  }, [user]);

  const runUsageCheck = useCallback(async () => {
    if (!user) return;
    setCheckingUsage(true);
    setUsageError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/service-usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsageResults(data.results || {});
    } catch (err) {
      setUsageError(err.message);
    }
    setCheckingUsage(false);
  }, [user]);

  return (
    <div className="admin-services">
      <div className="admin-services-header-row">
        <div>
          <h2 className="admin-services-title">SERVICES &amp; INTEGRATIONS</h2>
          <p className="admin-services-subtitle">
            External subscriptions, APIs, and third-party tools used by the site.
          </p>
        </div>
        <div className="admin-services-btn-group">
          <button
            className="admin-health-check-btn"
            onClick={runHealthCheck}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check All'}
          </button>
          <button
            className="admin-health-check-btn admin-usage-check-btn"
            onClick={runUsageCheck}
            disabled={checkingUsage}
          >
            {checkingUsage ? 'Loading...' : 'Check Usage'}
          </button>
        </div>
      </div>
      {checkError && (
        <p className="admin-health-error">Health check failed: {checkError}</p>
      )}
      {usageError && (
        <p className="admin-health-error">Usage check failed: {usageError}</p>
      )}
      <div className="admin-services-grid">
        {SERVICES.map(svc => {
          const result = healthResults ? healthResults[svc.id] : null;
          const usage = usageResults ? usageResults[svc.id] : null;
          return (
            <div key={svc.id} className="admin-service-card">
              <div className="admin-service-header">
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-service-name"
                >
                  {svc.name}
                </a>
                <div className="admin-service-badges">
                  <span
                    className="admin-service-status"
                    style={{ color: SERVICE_STATUS_COLORS[svc.status] || '#6a6a7a', borderColor: SERVICE_STATUS_COLORS[svc.status] || '#6a6a7a' }}
                  >
                    {svc.status}
                  </span>
                  {checking && !result && (
                    <span
                      className="admin-health-badge"
                      style={{ color: HEALTH_BADGE_CONFIG.checking.color, borderColor: HEALTH_BADGE_CONFIG.checking.border }}
                    >
                      ...
                    </span>
                  )}
                  <HealthBadge result={result} svc={svc} />
                </div>
              </div>
              <span className="admin-service-category">{svc.category}</span>
              <p className="admin-service-usage">{svc.usedFor}</p>
              <div className="admin-service-footer">
                <span
                  className="admin-service-paid"
                  style={{ color: SERVICE_PAID_COLORS[svc.paid] || '#8a8aa0', borderColor: SERVICE_PAID_COLORS[svc.paid] || '#8a8aa0' }}
                >
                  {svc.paid}
                </span>
                {svc.envVars.length > 0 && (
                  <div className="admin-service-envvars">
                    {svc.envVars.map(v => (
                      <code key={v} className="admin-service-env">{v}</code>
                    ))}
                  </div>
                )}
              </div>
              <UsagePanel svcId={svc.id} usage={usage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- IP Registry data ---
const IP_CATEGORIES = [
  { id: 'creative-works', name: 'Creative Works' },
  { id: 'game-designs', name: 'Game Designs' },
  { id: 'data-compilations', name: 'Data Compilations' },
  { id: 'ai-personas', name: 'AI Personas' },
  { id: 'algorithms', name: 'Algorithms' },
  { id: 'brand-elements', name: 'Brand Elements' },
];

const IP_REGISTRY = [
  // Creative Works
  { id: 'fallen-starlight', category: 'creative-works', name: 'Fallen Starlight', description: 'Original novel — mythic fantasy blending alchemy, tarot, and the monomyth', type: 'copyright', source: ['src/pages/FallenStarlight/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'story-of-stories', category: 'creative-works', name: 'Story of Stories', description: 'Original novel — meta-narrative exploring the monomyth across world traditions', type: 'copyright', source: ['src/pages/StoryOfStories/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'monomyth-overviews', category: 'creative-works', name: 'Monomyth Overviews', description: 'Original educational essays on hero\'s journey stages, theorists, and cycles', type: 'copyright', source: ['src/pages/Monomyth/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'sacred-site-desc', category: 'creative-works', name: 'Sacred Site Descriptions', description: 'Original written descriptions and curated data for 100+ mythic earth locations', type: 'copyright', source: ['src/data/sites/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'ancient-game-histories', category: 'creative-works', name: 'Ancient Game Histories', description: 'Original research essays on the history and mythology of ancient board games', type: 'copyright', source: ['src/pages/Games/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'mythic-calendar', category: 'creative-works', name: 'Mythic Calendar', description: 'Original mythological calendar system mapping zodiac, culture, and seasonal cycles', type: 'copyright', source: ['src/data/campaigns/mythicYear.json'], status: 'unregistered', protection: 'medium', year: 2025 },
  { id: 'yellow-brick-road', category: 'creative-works', name: 'Yellow Brick Road', description: 'Original guided journey framework — structured mythological curriculum', type: 'copyright', source: ['src/pages/YellowBrickRoad/'], status: 'unregistered', protection: 'high', year: 2024 },

  // Game Designs
  { id: 'mythouse-board-game', category: 'game-designs', name: 'Mythouse Board Game', description: 'Original board game design — mythological journey game with alchemical mechanics', type: 'copyright', source: ['src/pages/Games/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'major-arcana', category: 'game-designs', name: 'Major Arcana Card Game', description: 'Original card game — 154 unique cards based on tarot archetypes and mythology', type: 'copyright', source: ['src/pages/Games/', 'src/data/cards/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'minor-arcana', category: 'game-designs', name: 'Minor Arcana Card Game', description: 'Original card game extension — elemental suits tied to alchemical traditions', type: 'copyright', source: ['src/pages/Games/', 'src/data/cards/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'game-senet', category: 'game-designs', name: 'Senet (Digital)', description: 'Digital adaptation of ancient Egyptian Senet with original AI and UI', type: 'copyright', source: ['src/pages/Games/Senet/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'game-ur', category: 'game-designs', name: 'Royal Game of Ur (Digital)', description: 'Digital adaptation of Mesopotamian Ur with original AI and UI', type: 'copyright', source: ['src/pages/Games/Ur/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'game-pachisi', category: 'game-designs', name: 'Pachisi (Digital)', description: 'Digital adaptation of Vedic Pachisi with original AI and UI', type: 'copyright', source: ['src/pages/Games/Pachisi/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'game-mehen', category: 'game-designs', name: 'Mehen (Digital)', description: 'Digital adaptation of ancient Egyptian serpent game with original AI and UI', type: 'copyright', source: ['src/pages/Games/Mehen/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'game-jackals', category: 'game-designs', name: 'Jackals & Hounds (Digital)', description: 'Digital adaptation of ancient Egyptian race game with original AI and UI', type: 'copyright', source: ['src/pages/Games/JackalsAndHounds/'], status: 'unregistered', protection: 'medium', year: 2024 },

  // Data Compilations
  { id: 'seven-metals', category: 'data-compilations', name: 'Seven Metals System', description: 'Original data compilation — planetary metals, correspondences, mythology across 13 data files', type: 'copyright', source: ['src/data/chronosphaera/', 'src/pages/Chronosphaera/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'monomyth-extended', category: 'data-compilations', name: 'Monomyth Extended Data', description: 'Original structured data — stages, theorists, cycles, cultural examples across 8 data files', type: 'copyright', source: ['src/data/monomyth/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'constellation-systems', category: 'data-compilations', name: 'Constellation Systems', description: 'Original curated data — zodiac constellations, star lore, cultural mappings across 5 data files', type: 'copyright', source: ['src/data/constellations/'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'medicine-wheels', category: 'data-compilations', name: 'Medicine Wheels', description: 'Original data compilation — directional symbolism and cultural wheel systems', type: 'copyright', source: ['src/data/wheels/'], status: 'unregistered', protection: 'medium', year: 2024 },

  // AI Personas
  { id: 'planetary-voices', category: 'ai-personas', name: 'Planetary Voice Definitions', description: 'Original AI persona system — 7 planetary archetypes with distinct voice, knowledge, and personality', type: 'trade-secret', source: ['api/chat.js', 'src/data/personas/'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'atlas-system-prompt', category: 'ai-personas', name: 'Atlas System Prompt', description: 'Original AI system prompt — Atlas guide persona with mythological knowledge base', type: 'trade-secret', source: ['api/chat.js'], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'fallen-starlight-atlas', category: 'ai-personas', name: 'Fallen Starlight Atlas', description: 'Original AI persona — novel-specific Atlas with in-world knowledge and character voice', type: 'trade-secret', source: ['api/chat.js'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'story-of-stories-atlas', category: 'ai-personas', name: 'Story of Stories Atlas', description: 'Original AI persona — novel-specific Atlas for meta-narrative guidance', type: 'trade-secret', source: ['api/chat.js'], status: 'unregistered', protection: 'medium', year: 2024 },

  // Algorithms
  { id: 'course-engine', category: 'algorithms', name: 'Course Engine', description: 'Original algorithm — requirement checking, progress tracking, certificate logic', type: 'trade-secret', source: ['src/coursework/courseEngine.js'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'mentor-engine', category: 'algorithms', name: 'Mentor Engine', description: 'Original algorithm — multi-stage mentor application screening with AI assessment', type: 'trade-secret', source: ['api/mentor-apply.js', 'src/pages/Mentors/'], status: 'unregistered', protection: 'medium', year: 2025 },
  { id: 'profile-engine', category: 'algorithms', name: 'Profile Engine', description: 'Original algorithm — user rank progression, subscription gating, achievement tracking', type: 'trade-secret', source: ['src/pages/Profile/ProfilePage.js'], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'numerology-engine', category: 'algorithms', name: 'Numerology Engine', description: 'Original algorithm — Pythagorean and Chaldean numerology calculations', type: 'trade-secret', source: ['src/pages/Chronosphaera/'], status: 'unregistered', protection: 'low', year: 2024 },
  { id: 'natal-chart', category: 'algorithms', name: 'Natal Chart Calculator', description: 'Original algorithm — astronomical position calculations for birth chart generation', type: 'trade-secret', source: ['src/pages/Chronosphaera/'], status: 'unregistered', protection: 'low', year: 2024 },
  { id: 'game-ai-core', category: 'algorithms', name: 'Game AI Core', description: 'Original algorithm — AI opponents for ancient board games with difficulty scaling', type: 'trade-secret', source: ['src/pages/Games/'], status: 'unregistered', protection: 'medium', year: 2024 },

  // Brand Elements
  { id: 'site-names', category: 'brand-elements', name: 'Site Names', description: 'Mythouse, Meteor Steel — primary brand names', type: 'trademark', source: [], status: 'unregistered', protection: 'high', year: 2024 },
  { id: 'feature-names', category: 'brand-elements', name: 'Feature Names', description: 'Atlas, Mythic Earth, Story Forge, Mythology Channel — feature brand names', type: 'trademark', source: [], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'course-names', category: 'brand-elements', name: 'Course Names', description: 'Yellow Brick Road, Fallen Starlight, Story of Stories — course and content titles', type: 'trademark', source: [], status: 'unregistered', protection: 'medium', year: 2024 },
  { id: 'rank-names', category: 'brand-elements', name: 'Rank System Names', description: 'Mythic rank progression names — Lead through Gold tier naming', type: 'trademark', source: [], status: 'unregistered', protection: 'low', year: 2024 },
];

const IP_TYPE_COLORS = {
  copyright: { color: '#7ab87a', bg: 'rgba(122, 184, 122, 0.12)', border: 'rgba(122, 184, 122, 0.3)' },
  trademark: { color: '#7a7ab8', bg: 'rgba(122, 122, 184, 0.12)', border: 'rgba(122, 122, 184, 0.3)' },
  'trade-secret': { color: '#d9a55b', bg: 'rgba(217, 165, 91, 0.12)', border: 'rgba(217, 165, 91, 0.3)' },
};

const IP_STATUS_COLORS = {
  registered: { color: '#5bd97a', bg: 'rgba(91, 217, 122, 0.12)', border: 'rgba(91, 217, 122, 0.3)' },
  unregistered: { color: '#8a8aa0', bg: 'rgba(138, 138, 160, 0.12)', border: 'rgba(138, 138, 160, 0.3)' },
  pending: { color: '#d9a55b', bg: 'rgba(217, 165, 91, 0.12)', border: 'rgba(217, 165, 91, 0.3)' },
};

const IP_PROTECTION_COLORS = {
  high: { color: '#d95b5b', bg: 'rgba(217, 91, 91, 0.12)', border: 'rgba(217, 91, 91, 0.3)' },
  medium: { color: '#d9a55b', bg: 'rgba(217, 165, 91, 0.12)', border: 'rgba(217, 165, 91, 0.3)' },
  low: { color: '#8a8aa0', bg: 'rgba(138, 138, 160, 0.12)', border: 'rgba(138, 138, 160, 0.3)' },
};

const IP_FILING_STATUSES = ['unregistered', 'preparing', 'filed', 'pending-review', 'registered'];

const IP_FILING_STATUS_COLORS = {
  unregistered:    { color: '#6a6a7a', bg: 'rgba(106, 106, 122, 0.12)', border: 'rgba(106, 106, 122, 0.3)' },
  preparing:       { color: '#5b8dd9', bg: 'rgba(91, 141, 217, 0.12)', border: 'rgba(91, 141, 217, 0.3)' },
  filed:           { color: '#d9a55b', bg: 'rgba(217, 165, 91, 0.12)', border: 'rgba(217, 165, 91, 0.3)' },
  'pending-review':{ color: '#b87ab8', bg: 'rgba(184, 122, 184, 0.12)', border: 'rgba(184, 122, 184, 0.3)' },
  registered:      { color: '#5bd97a', bg: 'rgba(91, 217, 122, 0.12)', border: 'rgba(91, 217, 122, 0.3)' },
};

const IP_COST_ESTIMATES = {
  copyright: { min: 55, max: 65 },
  trademark: { min: 250, max: 350 },
  'trade-secret': { min: 0, max: 0 },
};

const IP_SPECIMEN_URLS = {
  'site-names': [
    { url: '/', label: 'Homepage — "Mythouse" brand display' },
    { url: '/chronosphaera', label: 'Chronosphaera — "Meteor Steel" in header' },
  ],
  'feature-names': [
    { url: '/atlas', label: 'Atlas page — "Atlas" brand in use' },
    { url: '/mythic-earth', label: 'Mythic Earth — feature name displayed' },
    { url: '/story-forge', label: 'Story Forge — feature name displayed' },
    { url: '/mythology-channel', label: 'Mythology Channel — feature name displayed' },
  ],
  'course-names': [
    { url: '/yellow-brick-road', label: 'Yellow Brick Road — course name in use' },
    { url: '/fallen-starlight', label: 'Fallen Starlight — title displayed' },
    { url: '/story-of-stories', label: 'Story of Stories — title displayed' },
  ],
  'rank-names': [
    { url: '/profile', label: 'Profile page — rank names displayed' },
  ],
};

function formatSubmissionText(items) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const copyrightItems = items.filter(i => i.type === 'copyright');
  const trademarkItems = items.filter(i => i.type === 'trademark');
  const tradeSecretItems = items.filter(i => i.type === 'trade-secret');
  const catName = (id) => IP_CATEGORIES.find(c => c.id === id)?.name || id;

  let text = `INTELLECTUAL PROPERTY SUBMISSION INVENTORY\nPrepared: ${today}\nOwner: Mythouse / Meteor Steel\nTotal Items: ${items.length}\n`;
  text += `Copyright: ${copyrightItems.length} | Trademark: ${trademarkItems.length} | Trade Secret: ${tradeSecretItems.length}\n`;
  text += '\n' + '='.repeat(72) + '\n';

  if (copyrightItems.length > 0) {
    text += '\nSECTION 1: COPYRIGHT REGISTRATIONS\n';
    text += '-'.repeat(72) + '\n\n';
    copyrightItems.forEach((item, i) => {
      text += `${i + 1}. ${item.name}\n`;
      text += `   Title of Work:      ${item.name}\n`;
      text += `   Author / Claimant:  Mythouse / Meteor Steel\n`;
      text += `   Year of Creation:   ${item.year}\n`;
      text += `   Category:           ${catName(item.category)}\n`;
      text += `   Type of Work:       ${item.category === 'game-designs' ? 'Visual Arts / Game Design' : item.category === 'data-compilations' ? 'Compilation / Database' : 'Literary Work'}\n`;
      text += `   Description:        ${item.description}\n`;
      text += `   Protection Priority: ${item.protection.charAt(0).toUpperCase() + item.protection.slice(1)}\n`;
      text += `   Registration Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}\n`;
      if (item.source.length > 0) {
        text += `   Source Files:       ${item.source.join(', ')}\n`;
      }
      text += '\n';
    });
    text += '='.repeat(72) + '\n';
  }

  if (trademarkItems.length > 0) {
    text += '\nSECTION 2: TRADEMARK REGISTRATIONS\n';
    text += '-'.repeat(72) + '\n\n';
    trademarkItems.forEach((item, i) => {
      text += `${i + 1}. ${item.name}\n`;
      text += `   Mark:               ${item.name}\n`;
      text += `   Owner:              Mythouse / Meteor Steel\n`;
      text += `   Date of First Use:  ${item.year}\n`;
      text += `   Class:              IC 041 — Education and Entertainment Services\n`;
      text += `   Goods / Services:   ${item.description}\n`;
      text += `   Protection Priority: ${item.protection.charAt(0).toUpperCase() + item.protection.slice(1)}\n`;
      text += `   Registration Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}\n`;
      text += '\n';
    });
    text += '='.repeat(72) + '\n';
  }

  if (tradeSecretItems.length > 0) {
    text += '\nSECTION 3: TRADE SECRET DECLARATIONS\n';
    text += '-'.repeat(72) + '\n\n';
    tradeSecretItems.forEach((item, i) => {
      text += `${i + 1}. ${item.name}\n`;
      text += `   Title:              ${item.name}\n`;
      text += `   Owner:              Mythouse / Meteor Steel\n`;
      text += `   Year Created:       ${item.year}\n`;
      text += `   Category:           ${catName(item.category)}\n`;
      text += `   Description:        ${item.description}\n`;
      text += `   Secrecy Measures:   Access-controlled source code; not publicly disclosed;\n`;
      text += `                       server-side execution only; no client-side exposure\n`;
      text += `   Protection Priority: ${item.protection.charAt(0).toUpperCase() + item.protection.slice(1)}\n`;
      text += `   Registration Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}\n`;
      if (item.source.length > 0) {
        text += `   Source Files:       ${item.source.join(', ')}\n`;
      }
      text += '\n';
    });
    text += '='.repeat(72) + '\n';
  }

  text += `\nEND OF INVENTORY — ${items.length} items total\n`;
  return text;
}

function formatFilingDrafts(items) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const catName = (id) => IP_CATEGORIES.find(c => c.id === id)?.name || id;

  const workType = (item) => {
    if (item.category === 'game-designs') return 'Visual Arts — Game Design';
    if (item.category === 'data-compilations') return 'Compilation / Database';
    return 'Literary Work';
  };

  const copyrightItems = items.filter(i => i.type === 'copyright');
  const trademarkItems = items.filter(i => i.type === 'trademark');
  const tradeSecretItems = items.filter(i => i.type === 'trade-secret');

  const drafts = [];

  copyrightItems.forEach(item => {
    const isAdaptation = item.id.startsWith('game-') && !item.id.includes('board') && !item.id.includes('arcana');
    let text = '';
    text += `${'='.repeat(72)}\n`;
    text += `U.S. COPYRIGHT OFFICE — REGISTRATION APPLICATION DRAFT\n`;
    text += `Prepared: ${today}\n`;
    text += `${'='.repeat(72)}\n\n`;

    text += `1.  TITLE OF WORK\n`;
    text += `    ${item.name}\n\n`;

    text += `2.  COMPLETION / PUBLICATION\n`;
    text += `    Year of Completion:  ${item.year}\n`;
    text += `    Date of Publication: ${item.year}, published via mythouse.org\n`;
    text += `    Nation of Publication: United States\n\n`;

    text += `3.  TYPE OF AUTHORSHIP\n`;
    text += `    ${workType(item)}\n`;
    if (item.category === 'game-designs') {
      text += `    Authorship includes: game rules, visual layout, UI design,\n`;
      text += `    original artwork, and computer program (source code)\n`;
    } else if (item.category === 'data-compilations') {
      text += `    Authorship includes: selection, coordination, and arrangement\n`;
      text += `    of data; original textual descriptions and annotations\n`;
    } else {
      text += `    Authorship includes: text, selection, arrangement, and\n`;
      text += `    original expression throughout\n`;
    }
    text += '\n';

    text += `4.  AUTHOR\n`;
    text += `    Name:       [Your Full Legal Name]\n`;
    text += `    Pseudonym:  None\n`;
    text += `    Citizenship: United States\n`;
    text += `    Work Made for Hire: No\n\n`;

    text += `5.  COPYRIGHT CLAIMANT\n`;
    text += `    Name:    [Your Full Legal Name]\n`;
    text += `    Address: [Your Address]\n`;
    text += `    d/b/a Mythouse / Meteor Steel\n\n`;

    text += `6.  DESCRIPTION OF WORK\n`;
    text += `    ${item.description}\n\n`;
    text += `    Category: ${catName(item.category)}\n`;
    text += `    The work is an original ${workType(item).toLowerCase()} first\n`;
    text += `    created in ${item.year} and published on the mythouse.org\n`;
    text += `    web platform.\n\n`;

    if (isAdaptation) {
      text += `7.  PREEXISTING MATERIAL / NEW MATERIAL\n`;
      text += `    Preexisting: Historical game concept (public domain)\n`;
      text += `    New Material: All original code, AI opponent logic, user\n`;
      text += `    interface design, visual assets, and digital adaptation\n\n`;
    }

    const nextNum = isAdaptation ? 8 : 7;
    text += `${nextNum}.  DEPOSIT MATERIAL\n`;
    if (item.source.length > 0) {
      text += `    Source code and digital content files:\n`;
      item.source.forEach(s => {
        text += `      - ${s}\n`;
      });
    } else {
      text += `    Digital publication accessible at mythouse.org\n`;
    }
    text += `\n    Deposit: Best-edition digital copy (source code printout\n`;
    text += `    or PDF of rendered pages, per Circular 66 guidelines)\n\n`;

    text += `${nextNum + 1}.  FEE & FILING\n`;
    text += `    Filing Method: Electronic via eCO (copyright.gov)\n`;
    text += `    Current Fee:   $65 (single author, single work)\n`;
    text += `                   $55 (online literary work, single author)\n\n`;

    text += `${'-'.repeat(72)}\n`;

    drafts.push({ item, text, type: 'copyright' });
  });

  trademarkItems.forEach(item => {
    let text = '';
    text += `${'='.repeat(72)}\n`;
    text += `USPTO — TRADEMARK APPLICATION DRAFT (TEAS Plus)\n`;
    text += `Prepared: ${today}\n`;
    text += `${'='.repeat(72)}\n\n`;

    text += `1.  MARK\n`;
    text += `    ${item.name}\n`;
    text += `    Mark Type: Standard Character Mark\n\n`;

    text += `2.  APPLICANT\n`;
    text += `    Name:       [Your Full Legal Name]\n`;
    text += `    Entity Type: Individual\n`;
    text += `    Address:    [Your Address]\n`;
    text += `    d/b/a Mythouse / Meteor Steel\n\n`;

    text += `3.  FILING BASIS\n`;
    text += `    Section 1(a) — Use in Commerce\n`;
    text += `    The mark is currently in use in interstate commerce\n`;
    text += `    via the mythouse.org website, accessible nationwide.\n\n`;

    text += `4.  INTERNATIONAL CLASS\n`;
    text += `    IC 041 — Education and Entertainment Services\n\n`;

    text += `5.  IDENTIFICATION OF GOODS / SERVICES\n`;
    text += `    ${item.description}\n\n`;
    text += `    Suggested Description for USPTO:\n`;
    text += `    "Entertainment services, namely, providing an interactive\n`;
    text += `    website featuring educational and entertainment content in\n`;
    text += `    the fields of mythology, storytelling, and ancient games;\n`;
    text += `    educational services, namely, providing online courses and\n`;
    text += `    curricula in the field of world mythology"\n\n`;

    text += `6.  DATES OF USE\n`;
    text += `    Date of First Use Anywhere:    ${item.year}\n`;
    text += `    Date of First Use in Commerce: ${item.year}\n\n`;

    text += `7.  SPECIMEN\n`;
    text += `    Screenshot(s) of the mark as displayed on mythouse.org\n`;
    text += `    showing the mark in connection with the identified services.\n\n`;

    text += `8.  DECLARATION\n`;
    text += `    The applicant believes they are the owner of the mark.\n`;
    text += `    The mark is in use in commerce on or in connection with\n`;
    text += `    the goods/services identified above.\n`;
    text += `    No other person has the right to use the mark in commerce.\n\n`;

    text += `9.  FEE & FILING\n`;
    text += `    Filing Method: Electronic via TEAS Plus (uspto.gov)\n`;
    text += `    Current Fee:   $250 per class (TEAS Plus)\n`;
    text += `                   $350 per class (TEAS Standard)\n\n`;

    text += `${'-'.repeat(72)}\n`;

    drafts.push({ item, text, type: 'trademark' });
  });

  tradeSecretItems.forEach(item => {
    let text = '';
    text += `${'='.repeat(72)}\n`;
    text += `TRADE SECRET IDENTIFICATION & PROTECTION RECORD\n`;
    text += `Prepared: ${today}\n`;
    text += `${'='.repeat(72)}\n\n`;

    text += `1.  IDENTIFICATION\n`;
    text += `    Name:     ${item.name}\n`;
    text += `    Category: ${catName(item.category)}\n`;
    text += `    Created:  ${item.year}\n\n`;

    text += `2.  DESCRIPTION OF TRADE SECRET\n`;
    text += `    ${item.description}\n\n`;
    text += `    This constitutes a trade secret under the Defend Trade\n`;
    text += `    Secrets Act (DTSA), 18 U.S.C. § 1836, and applicable\n`;
    text += `    state Uniform Trade Secrets Act (UTSA) provisions.\n\n`;

    text += `3.  ECONOMIC VALUE\n`;
    text += `    The trade secret derives independent economic value from\n`;
    text += `    not being generally known to, and not being readily\n`;
    text += `    ascertainable through proper means by, other persons who\n`;
    text += `    can obtain economic value from its disclosure or use.\n\n`;
    text += `    Specifically: the ${item.category === 'ai-personas' ? 'AI persona definitions, system prompts, and personality configurations' : 'proprietary algorithms and computational methods'}\n`;
    text += `    represent significant original development effort and\n`;
    text += `    provide competitive advantage to the Mythouse platform.\n\n`;

    text += `4.  REASONABLE MEASURES TO MAINTAIN SECRECY\n`;
    text += `    a) Source code is stored in a private repository with\n`;
    text += `       access limited to authorized personnel only\n`;
    text += `    b) ${item.category === 'ai-personas' ? 'AI prompts and persona definitions are executed server-side\n       only; never transmitted to the client browser' : 'Algorithm logic executes server-side or in obfuscated\n       compiled bundles; core logic not exposed in source form'}\n`;
    text += `    c) No public documentation or disclosure of the\n`;
    text += `       proprietary methods or configurations\n`;
    text += `    d) Employment/contractor agreements include NDA and\n`;
    text += `       non-disclosure provisions (recommended)\n`;
    text += `    e) Access logging and version control audit trails\n\n`;

    text += `5.  ACCESS CONTROL\n`;
    text += `    Persons with Access: Site owner / administrator only\n`;
    text += `    Access Method:       Private GitHub repository; Vercel\n`;
    text += `                         environment variables for API keys\n`;
    if (item.source.length > 0) {
      text += `    Source Locations:\n`;
      item.source.forEach(s => {
        text += `      - ${s}\n`;
      });
    }
    text += '\n';

    text += `6.  RECOMMENDED ACTIONS\n`;
    text += `    [ ] Execute NDA with any contractors or collaborators\n`;
    text += `    [ ] Add trade secret notice headers to source files\n`;
    text += `    [ ] Document access log review schedule\n`;
    text += `    [ ] Consider provisional patent if algorithm is novel\n`;
    text += `    [ ] Maintain dated records of development (git history)\n\n`;

    text += `${'-'.repeat(72)}\n`;

    drafts.push({ item, text, type: 'trade-secret' });
  });

  return drafts;
}

function generateTradeSecretHeader(item) {
  return `/* ================================================================
 * CONFIDENTIAL — TRADE SECRET
 * ${item.name}
 * Owner: Mythouse / Meteor Steel
 * Created: ${item.year}
 *
 * This file contains proprietary trade secret information owned by
 * Mythouse / Meteor Steel. Unauthorized copying, disclosure, or
 * distribution of this material is strictly prohibited and may
 * result in legal action under the Defend Trade Secrets Act (DTSA),
 * 18 U.S.C. § 1836, and applicable state trade secret laws.
 *
 * Access to this file is restricted to authorized personnel only.
 * ================================================================ */`;
}

function generateNDAText(tradeSecretItems) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const itemList = tradeSecretItems.map((item, i) => `   ${i + 1}. ${item.name} — ${item.description}`).join('\n');

  return `NON-DISCLOSURE AGREEMENT (NDA)

Date: ${today}

PARTIES

   Disclosing Party:  [Your Full Legal Name]
                      d/b/a Mythouse / Meteor Steel
                      ("Discloser")

   Receiving Party:   [Recipient Full Legal Name]
                      [Recipient Address]
                      ("Recipient")

RECITALS

   The Discloser possesses certain confidential and proprietary
   information relating to the Mythouse / Meteor Steel platform,
   including but not limited to the trade secrets identified below.
   The Recipient desires to receive access to such information for
   the purpose of [PURPOSE — e.g., collaboration, evaluation,
   development work].

1. DEFINITION OF CONFIDENTIAL INFORMATION

   "Confidential Information" means all non-public information
   disclosed by the Discloser to the Recipient, whether orally, in
   writing, or by inspection of tangible or digital objects, including
   but not limited to the following trade secrets:

${itemList}

   Confidential Information also includes any notes, analyses,
   compilations, or derivative works prepared by the Recipient that
   contain or reflect the above information.

2. OBLIGATIONS OF RECIPIENT

   The Recipient agrees to:
   a) Hold all Confidential Information in strict confidence;
   b) Not disclose Confidential Information to any third party
      without prior written consent of the Discloser;
   c) Use Confidential Information solely for the stated purpose;
   d) Protect Confidential Information using at least the same
      degree of care used to protect its own confidential information,
      but in no event less than reasonable care;
   e) Limit access to Confidential Information to those employees
      or agents who have a need to know and who are bound by
      obligations of confidentiality at least as restrictive as
      those contained herein.

3. EXCLUSIONS

   Confidential Information does not include information that:
   a) Is or becomes publicly available through no fault of Recipient;
   b) Was known to Recipient prior to disclosure by Discloser;
   c) Is independently developed by Recipient without use of or
      reference to Confidential Information;
   d) Is disclosed to Recipient by a third party not under an
      obligation of confidentiality to Discloser.

4. TERM

   This Agreement shall remain in effect for a period of three (3)
   years from the date first written above. The obligations of
   confidentiality shall survive termination of this Agreement with
   respect to Confidential Information disclosed during the term.

5. REMEDIES

   The Recipient acknowledges that unauthorized disclosure of
   Confidential Information may cause irreparable harm to the
   Discloser. The Discloser shall be entitled to seek injunctive
   relief in addition to any other remedies available at law or
   in equity, including damages under the Defend Trade Secrets
   Act (DTSA), 18 U.S.C. § 1836.

6. RETURN OF MATERIALS

   Upon termination of this Agreement or upon request by the
   Discloser, the Recipient shall promptly return or destroy all
   copies of Confidential Information in its possession and
   certify in writing that it has done so.

7. GENERAL PROVISIONS

   a) Governing Law: This Agreement shall be governed by the
      laws of the State of [STATE].
   b) Entire Agreement: This Agreement constitutes the entire
      understanding between the parties regarding the subject
      matter hereof.
   c) Amendment: This Agreement may only be amended by written
      instrument signed by both parties.
   d) Severability: If any provision is found unenforceable, the
      remaining provisions shall remain in full force and effect.

SIGNATURES

_______________________________     Date: _______________
[Your Full Legal Name]
Discloser


_______________________________     Date: _______________
[Recipient Full Legal Name]
Recipient
`;
}

function IPRegistrySection() {
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [viewMode, setViewMode] = useState('registry'); // 'registry' | 'inventory' | 'filings' | 'workflow'
  const [copied, setCopied] = useState(false);
  const [expandedFiling, setExpandedFiling] = useState({});
  const [workflowCollapsed, setWorkflowCollapsed] = useState({});

  const { tracker, getItemData, updateItemData } = useFilingTracker();

  const filtered = useMemo(() => {
    return IP_REGISTRY.filter(item => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const byType = { copyright: 0, trademark: 0, 'trade-secret': 0 };
    const byProtection = { high: 0, medium: 0, low: 0 };
    IP_REGISTRY.forEach(item => {
      byType[item.type]++;
      byProtection[item.protection]++;
    });
    return { total: IP_REGISTRY.length, byType, byProtection };
  }, []);

  const submissionText = useMemo(() => formatSubmissionText(filtered), [filtered]);
  const filingDrafts = useMemo(() => formatFilingDrafts(filtered), [filtered]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text || submissionText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [submissionText]);

  const allFilingsText = useMemo(() => filingDrafts.map(d => d.text).join('\n\n'), [filingDrafts]);

  const toggleCategory = (catId) => {
    setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Workflow memos
  const priorityQueue = useMemo(() => {
    const po = { high: 0, medium: 1, low: 2 };
    const to = { copyright: 0, trademark: 1, 'trade-secret': 2 };
    return [...IP_REGISTRY].sort((a, b) => {
      const pDiff = po[a.protection] - po[b.protection];
      if (pDiff !== 0) return pDiff;
      return to[a.type] - to[b.type];
    });
  }, []);

  const filingProgress = useMemo(() => {
    const counts = {};
    IP_FILING_STATUSES.forEach(s => { counts[s] = 0; });
    IP_REGISTRY.forEach(item => {
      const s = (tracker[item.id] && tracker[item.id].status) || 'unregistered';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [tracker]);

  const costSummary = useMemo(() => {
    let min = 0, max = 0;
    IP_REGISTRY.forEach(item => {
      const s = (tracker[item.id] && tracker[item.id].status) || 'unregistered';
      if (s !== 'registered' && s !== 'filed' && s !== 'pending-review') {
        const cost = IP_COST_ESTIMATES[item.type];
        if (cost) { min += cost.min; max += cost.max; }
      }
    });
    return { min, max };
  }, [tracker]);

  const downloadTextFile = useCallback((content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const generateDepositManifest = useCallback((item) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `COPYRIGHT DEPOSIT MANIFEST\n`;
    text += `${'='.repeat(56)}\n`;
    text += `Title:    ${item.name}\n`;
    text += `Author:   Mythouse / Meteor Steel\n`;
    text += `Created:  ${item.year}\n`;
    text += `Prepared: ${today}\n\n`;
    text += `SOURCE FILES TO INCLUDE IN DEPOSIT:\n`;
    text += `${'-'.repeat(56)}\n`;
    if (item.source.length > 0) {
      item.source.forEach(s => { text += `  ${s}\n`; });
    } else {
      text += `  (No source files specified — use published website)\n`;
    }
    text += `\nCOLLECTION INSTRUCTIONS:\n`;
    text += `${'-'.repeat(56)}\n`;
    text += `1. Print or PDF the source code from the paths above\n`;
    text += `2. Include first and last 25 pages of each source file\n`;
    text += `   (per Copyright Office Circular 61 guidelines)\n`;
    text += `3. Redact any trade secret content (API keys, prompts)\n`;
    text += `4. Upload as a single PDF via eCO (copyright.gov)\n`;
    text += `5. Label deposit: "${item.name} — Source Code"\n`;
    return text;
  }, []);

  return (
    <div className="admin-ip-registry">
      <h2 className="admin-ip-title">IP REGISTRY</h2>
      <p className="admin-ip-subtitle">
        Intellectual property inventory — creative works, designs, data, and brand elements.
      </p>

      <div className="admin-ip-stats">
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value">{stats.total}</span>
          <span className="admin-ip-stat-label">Total Items</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_TYPE_COLORS.copyright.color }}>{stats.byType.copyright}</span>
          <span className="admin-ip-stat-label">Copyright</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_TYPE_COLORS.trademark.color }}>{stats.byType.trademark}</span>
          <span className="admin-ip-stat-label">Trademark</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_TYPE_COLORS['trade-secret'].color }}>{stats.byType['trade-secret']}</span>
          <span className="admin-ip-stat-label">Trade Secret</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_PROTECTION_COLORS.high.color }}>{stats.byProtection.high}</span>
          <span className="admin-ip-stat-label">High Priority</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_PROTECTION_COLORS.medium.color }}>{stats.byProtection.medium}</span>
          <span className="admin-ip-stat-label">Medium</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: IP_PROTECTION_COLORS.low.color }}>{stats.byProtection.low}</span>
          <span className="admin-ip-stat-label">Low</span>
        </div>
      </div>

      <div className="admin-ip-actions">
        <button
          className={`admin-ip-submit-btn ${viewMode === 'inventory' ? 'active' : ''}`}
          onClick={() => { setViewMode(viewMode === 'inventory' ? 'registry' : 'inventory'); setCopied(false); }}
        >
          {viewMode === 'inventory' ? 'Back to Registry' : 'Submission Inventory'}
        </button>
        <button
          className={`admin-ip-submit-btn admin-ip-filings-btn ${viewMode === 'filings' ? 'active' : ''}`}
          onClick={() => { setViewMode(viewMode === 'filings' ? 'registry' : 'filings'); setCopied(false); setExpandedFiling({}); }}
        >
          {viewMode === 'filings' ? 'Back to Registry' : 'Draft IP Filings'}
        </button>
        <button
          className={`admin-ip-submit-btn admin-ip-workflow-btn ${viewMode === 'workflow' ? 'active' : ''}`}
          onClick={() => { setViewMode(viewMode === 'workflow' ? 'registry' : 'workflow'); setCopied(false); }}
        >
          {viewMode === 'workflow' ? 'Back to Registry' : 'Filing Workflow'}
        </button>
      </div>

      {viewMode === 'inventory' ? (
        <div className="admin-ip-submission-view">
          <div className="admin-ip-submission-header">
            <h3 className="admin-ip-submission-title">IP SUBMISSION DOCUMENT</h3>
            <button className={`admin-ip-copy-btn ${copied ? 'copied' : ''}`} onClick={() => handleCopy()}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <pre className="admin-ip-submission-text">{submissionText}</pre>
        </div>
      ) : viewMode === 'filings' ? (
        <div className="admin-ip-filings-view">
          <div className="admin-ip-submission-header">
            <h3 className="admin-ip-submission-title">DRAFT IP FILINGS</h3>
            <button className={`admin-ip-copy-btn ${copied ? 'copied' : ''}`} onClick={() => handleCopy(allFilingsText)}>
              {copied ? 'Copied!' : 'Copy All Filings'}
            </button>
          </div>
          <p className="admin-ip-filings-intro">
            {filingDrafts.length} draft filing{filingDrafts.length !== 1 ? 's' : ''} generated. Click any item to expand its full application draft.
          </p>

          {['copyright', 'trademark', 'trade-secret'].map(filingType => {
            const typeDrafts = filingDrafts.filter(d => d.type === filingType);
            if (typeDrafts.length === 0) return null;
            const typeLabel = filingType === 'copyright' ? 'Copyright Registrations' : filingType === 'trademark' ? 'Trademark Applications' : 'Trade Secret Declarations';
            const tc = IP_TYPE_COLORS[filingType];
            return (
              <div key={filingType} className="admin-ip-filing-group">
                <h4 className="admin-ip-filing-group-title" style={{ color: tc.color }}>
                  {typeLabel} ({typeDrafts.length})
                </h4>
                {typeDrafts.map(draft => {
                  const isExpanded = expandedFiling[draft.item.id];
                  return (
                    <div key={draft.item.id} className="admin-ip-filing-item">
                      <button
                        className={`admin-ip-filing-item-header ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedFiling(prev => ({ ...prev, [draft.item.id]: !prev[draft.item.id] }))}
                      >
                        <span className="admin-ip-category-arrow">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                        <span className="admin-ip-filing-item-name">{draft.item.name}</span>
                        <span className="admin-ip-badge" style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}>
                          {filingType === 'trade-secret' ? 'Trade Secret' : filingType.charAt(0).toUpperCase() + filingType.slice(1)}
                        </span>
                        <span className="admin-ip-filing-item-year">{draft.item.year}</span>
                      </button>
                      {isExpanded && (
                        <div className="admin-ip-filing-item-body">
                          <button
                            className="admin-ip-copy-single-btn"
                            onClick={() => { navigator.clipboard.writeText(draft.text); }}
                          >
                            Copy This Filing
                          </button>
                          <pre className="admin-ip-filing-text">{draft.text}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'workflow' ? (
        <div className="admin-ip-workflow-view">
          {/* Section 1: Filing Tracker */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, tracker: !p.tracker }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.tracker ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">Filing Tracker</span>
              <span className="admin-ip-category-count">{IP_REGISTRY.length} items</span>
            </button>
            {!workflowCollapsed.tracker && (
              <div className="admin-ip-wf-section-body">
                <div className="admin-ip-wf-progress">
                  {IP_FILING_STATUSES.map(s => {
                    const pct = IP_REGISTRY.length > 0 ? (filingProgress[s] / IP_REGISTRY.length) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div key={s} className="admin-progress-segment" style={{ width: `${pct}%`, background: IP_FILING_STATUS_COLORS[s].color }} />
                    );
                  })}
                </div>
                <div className="admin-ip-wf-legend">
                  {IP_FILING_STATUSES.map(s => (
                    <span key={s} className="admin-ip-wf-legend-item">
                      <span className="admin-ip-wf-dot" style={{ background: IP_FILING_STATUS_COLORS[s].color }} />
                      {s.replace('-', ' ')} ({filingProgress[s]})
                    </span>
                  ))}
                </div>
                {IP_REGISTRY.map(item => {
                  const data = getItemData(item.id);
                  const tc = IP_TYPE_COLORS[item.type];
                  const pc = IP_PROTECTION_COLORS[item.protection];
                  return (
                    <div key={item.id} className="admin-ip-wf-tracker-row">
                      <div className="admin-ip-wf-tracker-info">
                        <span className="admin-ip-wf-tracker-name">{item.name}</span>
                        <span className="admin-ip-badge" style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}>
                          {item.type === 'trade-secret' ? 'Trade Secret' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                        <span className="admin-ip-badge" style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                          {item.protection.charAt(0).toUpperCase() + item.protection.slice(1)}
                        </span>
                      </div>
                      <div className="admin-ip-wf-tracker-fields">
                        <select
                          value={data.status}
                          onChange={e => updateItemData(item.id, 'status', e.target.value)}
                          style={{ borderColor: IP_FILING_STATUS_COLORS[data.status]?.color || '#2a2a3a' }}
                        >
                          {IP_FILING_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace('-', ' ')}</option>
                          ))}
                        </select>
                        <input type="date" placeholder="Filing date" value={data.filingDate} onChange={e => updateItemData(item.id, 'filingDate', e.target.value)} />
                        <input type="text" placeholder="Confirmation #" value={data.confirmationNumber} onChange={e => updateItemData(item.id, 'confirmationNumber', e.target.value)} />
                        <input type="text" placeholder="Registration #" value={data.registrationNumber} onChange={e => updateItemData(item.id, 'registrationNumber', e.target.value)} />
                        <input type="text" placeholder="Notes" value={data.notes} onChange={e => updateItemData(item.id, 'notes', e.target.value)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Priority Filing Queue */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, queue: !p.queue }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.queue ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">Priority Filing Queue</span>
              <span className="admin-ip-category-count">{IP_REGISTRY.length} items</span>
            </button>
            {!workflowCollapsed.queue && (
              <div className="admin-ip-wf-section-body">
                <div className="admin-ip-wf-cost-summary">
                  Estimated remaining cost: ${costSummary.min.toLocaleString()}&ndash;${costSummary.max.toLocaleString()}
                </div>
                {priorityQueue.map((item, i) => {
                  const data = getItemData(item.id);
                  const isDone = data.status === 'filed' || data.status === 'pending-review' || data.status === 'registered';
                  const tc = IP_TYPE_COLORS[item.type];
                  const pc = IP_PROTECTION_COLORS[item.protection];
                  const cost = IP_COST_ESTIMATES[item.type];
                  return (
                    <div key={item.id} className={`admin-ip-wf-queue-row ${isDone ? 'done' : ''}`}>
                      <span className="admin-ip-wf-queue-rank">{isDone ? '\u2713' : `#${i + 1}`}</span>
                      <span className="admin-ip-wf-queue-name">{item.name}</span>
                      <span className="admin-ip-badge" style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}>
                        {item.type === 'trade-secret' ? 'Trade Secret' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="admin-ip-badge" style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                        {item.protection.charAt(0).toUpperCase() + item.protection.slice(1)}
                      </span>
                      <span className="admin-ip-wf-queue-cost">
                        {cost.max > 0 ? `$${cost.min}\u2013${cost.max}` : 'No fee'}
                      </span>
                    </div>
                  );
                })}
                <div className="admin-ip-wf-queue-total">
                  Total estimated: ${(() => { let min = 0, max = 0; IP_REGISTRY.forEach(item => { const c = IP_COST_ESTIMATES[item.type]; min += c.min; max += c.max; }); return `${min.toLocaleString()}\u2013${max.toLocaleString()}`; })()}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Deposit Copy Generator */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, deposit: !p.deposit }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.deposit ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">Deposit Copy Generator</span>
              <span className="admin-ip-category-count">{IP_REGISTRY.filter(i => i.type === 'copyright').length} items</span>
            </button>
            {!workflowCollapsed.deposit && (
              <div className="admin-ip-wf-section-body">
                <p className="admin-ip-filings-intro" style={{ margin: '0 0 12px' }}>
                  Generate deposit manifests for copyright registration. Each manifest lists the source files to include and collection instructions per Copyright Office guidelines.
                </p>
                {IP_REGISTRY.filter(i => i.type === 'copyright').map(item => (
                  <div key={item.id} className="admin-ip-wf-deposit-row">
                    <span className="admin-ip-wf-deposit-name">{item.name}</span>
                    <span className="admin-ip-wf-deposit-sources">{item.source.length > 0 ? item.source.join(', ') : '(no sources)'}</span>
                    <button
                      className="admin-ip-wf-download-btn"
                      onClick={() => downloadTextFile(generateDepositManifest(item), `deposit-${item.id}.txt`)}
                    >
                      Download Manifest
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Specimen URL Guide */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, specimen: !p.specimen }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.specimen ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">Specimen URL Guide</span>
              <span className="admin-ip-category-count">{IP_REGISTRY.filter(i => i.type === 'trademark').length} items</span>
            </button>
            {!workflowCollapsed.specimen && (
              <div className="admin-ip-wf-section-body">
                <p className="admin-ip-filings-intro" style={{ margin: '0 0 12px' }}>
                  Specimen requirements: full-page screenshot showing the mark in use with the identified services. Format: JPEG or PDF, max 5 MB per specimen.
                </p>
                {IP_REGISTRY.filter(i => i.type === 'trademark').map(item => {
                  const urls = IP_SPECIMEN_URLS[item.id] || [];
                  return (
                    <div key={item.id} className="admin-ip-wf-specimen-group">
                      <div className="admin-ip-wf-specimen-name">{item.name}</div>
                      <div className="admin-ip-wf-specimen-desc">{item.description}</div>
                      {urls.length > 0 ? urls.map((u, i) => (
                        <a key={i} className="admin-ip-wf-specimen-url" href={u.url} target="_blank" rel="noopener noreferrer">
                          {u.url} &mdash; {u.label}
                        </a>
                      )) : (
                        <span className="admin-ip-wf-specimen-url" style={{ color: '#6a6a7a' }}>No specimen URLs configured</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Trade Secret Headers */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, headers: !p.headers }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.headers ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">Trade Secret Headers</span>
              <span className="admin-ip-category-count">{IP_REGISTRY.filter(i => i.type === 'trade-secret').length} items</span>
            </button>
            {!workflowCollapsed.headers && (
              <div className="admin-ip-wf-section-body">
                <p className="admin-ip-filings-intro" style={{ margin: '0 0 12px' }}>
                  Add these confidentiality headers to the top of trade secret source files to establish and document secrecy measures.
                </p>
                {IP_REGISTRY.filter(i => i.type === 'trade-secret').map(item => {
                  const header = generateTradeSecretHeader(item);
                  return (
                    <div key={item.id} className="admin-ip-wf-header-block">
                      <div className="admin-ip-wf-header-info">
                        <span className="admin-ip-wf-tracker-name">{item.name}</span>
                        {item.source.length > 0 && (
                          <span className="admin-ip-wf-deposit-sources">{item.source.join(', ')}</span>
                        )}
                      </div>
                      <div className="admin-ip-wf-code-wrap">
                        <button
                          className="admin-ip-copy-single-btn"
                          onClick={() => navigator.clipboard.writeText(header)}
                        >
                          Copy Header
                        </button>
                        <pre className="admin-ip-wf-code">{header}</pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 6: NDA Template */}
          <div className="admin-ip-wf-section">
            <button className="admin-ip-wf-section-header" onClick={() => setWorkflowCollapsed(p => ({ ...p, nda: !p.nda }))}>
              <span className="admin-ip-category-arrow">{workflowCollapsed.nda ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">NDA Template</span>
            </button>
            {!workflowCollapsed.nda && (() => {
              const tsItems = IP_REGISTRY.filter(i => i.type === 'trade-secret');
              const ndaText = generateNDAText(tsItems);
              const previewLines = ndaText.split('\n').slice(0, 25).join('\n') + '\n...';
              return (
                <div className="admin-ip-wf-section-body">
                  <p className="admin-ip-filings-intro" style={{ margin: '0 0 12px' }}>
                    Download a pre-filled NDA covering all {tsItems.length} trade secret items. Review and customize before use.
                  </p>
                  <button
                    className="admin-ip-wf-download-btn"
                    onClick={() => downloadTextFile(ndaText, 'mythouse-nda.txt')}
                  >
                    Download NDA (.txt)
                  </button>
                  <pre className="admin-ip-wf-nda-preview">{previewLines}</pre>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
      <div className="admin-ip-filters">
        <span className="admin-ip-filter-label">Type:</span>
        {['copyright', 'trademark', 'trade-secret'].map(t => (
          <button
            key={t}
            className={`admin-ip-filter-btn ${typeFilter === t ? 'active' : ''}`}
            style={typeFilter === t ? { borderColor: IP_TYPE_COLORS[t].color, color: IP_TYPE_COLORS[t].color } : {}}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {t === 'trade-secret' ? 'Trade Secret' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="admin-ip-filter-label">Status:</span>
        {['registered', 'unregistered', 'pending'].map(s => (
          <button
            key={s}
            className={`admin-ip-filter-btn ${statusFilter === s ? 'active' : ''}`}
            style={statusFilter === s ? { borderColor: IP_STATUS_COLORS[s].color, color: IP_STATUS_COLORS[s].color } : {}}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {(typeFilter || statusFilter) && (
          <button
            className="admin-ip-filter-btn admin-ip-clear-btn"
            onClick={() => { setTypeFilter(null); setStatusFilter(null); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {IP_CATEGORIES.map(cat => {
        const items = filtered.filter(item => item.category === cat.id);
        if (items.length === 0) return null;
        const isCollapsed = collapsed[cat.id];
        return (
          <div key={cat.id} className="admin-ip-category">
            <button className="admin-ip-category-header" onClick={() => toggleCategory(cat.id)}>
              <span className="admin-ip-category-arrow">{isCollapsed ? '\u25B6' : '\u25BC'}</span>
              <span className="admin-ip-category-name">{cat.name}</span>
              <span className="admin-ip-category-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </button>
            {!isCollapsed && (
              <div className="admin-ip-card-grid">
                {items.map(item => {
                  const tc = IP_TYPE_COLORS[item.type];
                  const sc = IP_STATUS_COLORS[item.status];
                  const pc = IP_PROTECTION_COLORS[item.protection];
                  return (
                    <div key={item.id} className="admin-ip-card">
                      <div className="admin-ip-card-header">
                        <h4 className="admin-ip-card-name">{item.name}</h4>
                        <span className="admin-ip-card-year">{item.year}</span>
                      </div>
                      <p className="admin-ip-card-desc">{item.description}</p>
                      <div className="admin-ip-card-badges">
                        <span className="admin-ip-badge" style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}>
                          {item.type === 'trade-secret' ? 'Trade Secret' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                        <span className="admin-ip-badge" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className="admin-ip-badge" style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                          {item.protection.charAt(0).toUpperCase() + item.protection.slice(1)} Priority
                        </span>
                      </div>
                      {item.source.length > 0 && (
                        <div className="admin-ip-card-sources">
                          {item.source.map(s => (
                            <code key={s} className="admin-ip-source">{s}</code>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
        </>
      )}
    </div>
  );
}

// --- 360 Media Slot Definitions ---
const MEDIA_360_SLOTS = [
  { key: 'monomyth.golden-age', label: 'Surface (Golden Age)' },
  { key: 'monomyth.falling-star', label: 'Calling (Falling Star)' },
  { key: 'monomyth.impact-crater', label: 'Crossing (Impact Crater)' },
  { key: 'monomyth.forge', label: 'Initiating (Forge)' },
  { key: 'monomyth.quenching', label: 'Nadir (Quenching)' },
  { key: 'monomyth.integration', label: 'Return (Integration)' },
  { key: 'monomyth.drawing', label: 'Arrival (Drawing)' },
  { key: 'monomyth.new-age', label: 'Renewal (New Age)' },
];

function Media360Section() {
  const { slots, getSlot } = use360Media();
  const [uploading, setUploading] = useState({});
  const [previewSlot, setPreviewSlot] = useState(null);
  const [editFields, setEditFields] = useState({});
  const debounceTimers = useRef({});

  const handleUpload = async (slotKey, file) => {
    const validation = validate360File(file);
    if (!validation.valid) { alert(validation.error); return; }

    setUploading(p => ({ ...p, [slotKey]: true }));
    try {
      const result = await upload360Media(slotKey, file);
      const docRef = doc(db, 'site-content', '360-media');
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data().slots || {} : {};
      existing[slotKey] = {
        url: result.url,
        storagePath: result.storagePath,
        type: result.type,
        title: getSlot(slotKey)?.title || '',
        description: getSlot(slotKey)?.description || '',
        uploadedAt: serverTimestamp(),
      };
      await setDoc(docRef, { slots: existing }, { merge: true });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(p => ({ ...p, [slotKey]: false }));
  };

  const handleDelete = async (slotKey) => {
    const slot = getSlot(slotKey);
    if (!slot) return;
    if (!window.confirm(`Delete 360 media for "${slotKey}"?`)) return;
    try {
      await delete360Media(slot.storagePath);
      const docRef = doc(db, 'site-content', '360-media');
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data().slots || {} : {};
      delete existing[slotKey];
      await setDoc(docRef, { slots: existing });
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleFieldChange = (slotKey, field, value) => {
    setEditFields(p => ({ ...p, [`${slotKey}.${field}`]: value }));
    clearTimeout(debounceTimers.current[`${slotKey}.${field}`]);
    debounceTimers.current[`${slotKey}.${field}`] = setTimeout(async () => {
      try {
        const docRef = doc(db, 'site-content', '360-media');
        const snap = await getDoc(docRef);
        const existing = snap.exists() ? snap.data().slots || {} : {};
        if (!existing[slotKey]) return;
        existing[slotKey][field] = value;
        await setDoc(docRef, { slots: existing }, { merge: true });
      } catch (err) {
        console.error('Failed to update field:', err);
      }
    }, 800);
  };

  const getFieldValue = (slotKey, field) => {
    const editKey = `${slotKey}.${field}`;
    if (editKey in editFields) return editFields[editKey];
    return getSlot(slotKey)?.[field] || '';
  };

  return (
    <div className="admin-360-media">
      <h2 className="admin-360-title">360 MEDIA MANAGER</h2>
      <p className="admin-360-subtitle">Upload equirectangular images/videos for 360 panorama viewing</p>
      <div className="admin-360-grid">
        {MEDIA_360_SLOTS.map(({ key, label }) => {
          const slot = getSlot(key);
          const isUploading = uploading[key];
          return (
            <div key={key} className={`admin-360-card${slot ? ' has-media' : ''}`}>
              <div className="admin-360-card-header">
                <h3 className="admin-360-card-name">{label}</h3>
                {slot && (
                  <span className="admin-360-card-type">{slot.type}</span>
                )}
              </div>

              {slot ? (
                <>
                  <div
                    className="admin-360-preview-thumb"
                    onClick={() => setPreviewSlot(key)}
                    title="Click to preview in 360"
                  >
                    {slot.type === 'image' ? (
                      <img src={slot.url} alt={label} />
                    ) : (
                      <video src={slot.url} muted />
                    )}
                    <div className="admin-360-preview-badge">360</div>
                  </div>

                  <input
                    className="admin-360-input"
                    type="text"
                    placeholder="Title"
                    value={getFieldValue(key, 'title')}
                    onChange={e => handleFieldChange(key, 'title', e.target.value)}
                  />
                  <input
                    className="admin-360-input"
                    type="text"
                    placeholder="Description"
                    value={getFieldValue(key, 'description')}
                    onChange={e => handleFieldChange(key, 'description', e.target.value)}
                  />

                  <div className="admin-360-actions">
                    <label className="admin-360-replace-btn">
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files[0]) handleUpload(key, e.target.files[0]); }}
                      />
                    </label>
                    <button className="admin-360-delete-btn" onClick={() => handleDelete(key)}>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <label className={`admin-360-upload-zone${isUploading ? ' uploading' : ''}`}>
                  {isUploading ? (
                    <span className="admin-360-uploading">Uploading...</span>
                  ) : (
                    <>
                      <span className="admin-360-upload-icon">+</span>
                      <span className="admin-360-upload-text">Upload 360 media</span>
                      <span className="admin-360-upload-hint">JPEG, PNG, WebP, MP4, WebM</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    style={{ display: 'none' }}
                    disabled={isUploading}
                    onChange={e => { if (e.target.files[0]) handleUpload(key, e.target.files[0]); }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {previewSlot && getSlot(previewSlot) && (
        <div className="admin-360-modal" onClick={() => setPreviewSlot(null)}>
          <div className="admin-360-modal-content" onClick={e => e.stopPropagation()}>
            <button className="admin-360-modal-close" onClick={() => setPreviewSlot(null)}>
              &times;
            </button>
            <Suspense fallback={<div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8aa0' }}>Loading viewer...</div>}>
              <PanoViewer src={getSlot(previewSlot).url} type={getSlot(previewSlot).type} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Legal Section ---

const LEGAL_CONTRACTS = [
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    category: 'contract',
    scope: 'All Users',
    trigger: 'Account creation / first login',
    description: 'Master agreement governing use of the Mythouse platform. Covers account creation, acceptable use, content guidelines, service availability, limitation of liability, and dispute resolution.',
    covers: ['Account registration & authentication (Firebase Auth)', 'Site browsing & content access', 'Atlas AI chat interactions', 'Game play (Senet, Pachisi, Ur, Mehen, Snakes & Ladders, Mythouse)', 'Journeys & Yellow Brick Road participation', 'Profile data (handle, birth date, natal chart, numerology, lucky number, photo)'],
    status: 'draft',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    category: 'contract',
    scope: 'All Users',
    trigger: 'Account creation / first login',
    description: 'Data collection, usage, storage, and sharing practices. Required by GDPR, CCPA, and Firebase/Google terms.',
    covers: ['Personal data: email, display name, birth date/time, profile photo', 'Behavioral data: coursework progress, page visits, element tracking, game completions', 'AI interaction data: Atlas conversations, Story Forge drafts, mentor application chats', 'Natal chart & numerology data', 'BYOK API keys (encrypted storage)', 'Third-party services: Firebase/Google, Anthropic, OpenAI, Vercel, YouTube embeds, Google Maps/Street View', 'Cookies & localStorage (session persistence, last-path recall)'],
    status: 'draft',
  },
  {
    id: 'mentor-agreement',
    title: 'Mentor Agreement',
    category: 'contract',
    scope: 'Mentors',
    trigger: 'After mentor application approval (before activation)',
    description: 'Agreement between Mythouse and approved mentors. Covers mentor responsibilities, student relationship guidelines, capacity commitments, code of conduct, content ownership, termination, and liability.',
    covers: ['Mentor qualifications & ongoing requirements (Level 2+ credential)', 'Student pairing acceptance & capacity limits (default 5)', 'Bio & directory listing consent', 'Communication standards & boundaries', 'Consulting rate setting & session conduct', 'Content ownership of mentor-created materials', 'Termination & unpublishing process', 'Guild participation guidelines'],
    status: 'draft',
  },
  {
    id: 'subscription-agreement',
    title: 'Subscription & Purchase Agreement',
    category: 'contract',
    scope: 'Paying Users',
    trigger: 'First purchase or subscription activation',
    description: 'Terms for paid features including subscriptions and one-time purchases. Covers billing, refunds, access levels, and cancellation.',
    covers: ['Chronosphaera subscription tiers (Active Buttons, Clock/Body Buttons, Atlas)', 'Monomyth + Meteor Steel access', 'Fallen Starlight + Story of Stories access', 'Medicine Wheels access', 'Mythosphaera access', 'Coursework subscription activation', 'Payment processing & billing', 'Refund & cancellation policy', 'Feature availability & changes'],
    status: 'draft',
  },
  {
    id: 'byok-agreement',
    title: 'BYOK (Bring Your Own Key) Agreement',
    category: 'contract',
    scope: 'BYOK Users',
    trigger: 'When user enters their own API key',
    description: 'Terms for users who provide their own Anthropic or OpenAI API keys. Covers key storage, usage, billing responsibility, and data handling.',
    covers: ['API key encrypted storage in Firestore (owner-only access)', 'Key usage limited to Mythouse AI features (Atlas, Story Forge)', 'User responsible for their own API billing', 'No sharing or exposure of keys to other users', 'Key deletion on request', 'Mythouse not liable for API charges incurred'],
    status: 'draft',
  },
  {
    id: 'consulting-agreement',
    title: 'Consulting Services Agreement',
    category: 'contract',
    scope: 'Consulting Mentors & Clients',
    trigger: 'When a consulting session is booked',
    description: 'Three-party agreement governing paid consulting sessions between mentors, clients, and Mythouse as platform.',
    covers: ['Session scheduling & cancellation', 'Payment terms & platform fee', 'Mentor as independent contractor (not employee)', 'Confidentiality of session content', 'Liability & professional disclaimers', 'Dispute resolution between mentor and client'],
    status: 'draft',
  },
  {
    id: 'story-forge-content',
    title: 'User Content & Story Forge License',
    category: 'contract',
    scope: 'Content Creators',
    trigger: 'First Story Forge draft or writing save',
    description: 'Content ownership and licensing terms for user-generated material including Story Forge narratives, personal stories, and Atlas conversation exports.',
    covers: ['User retains ownership of their original content', 'Limited license to Mythouse for platform display & AI processing', 'AI-generated content co-ownership / usage rights', 'Story Forge drafts & assembled narratives', 'Writings (personal stories, reflections)', 'Atlas conversation history', 'Right to export & delete user content'],
    status: 'draft',
  },
];

const LEGAL_POLICIES = [
  {
    id: 'ai-disclaimer',
    title: 'AI Usage Disclaimer',
    category: 'policy',
    scope: 'All Users',
    description: 'Disclaimer that Atlas and AI features provide educational/entertainment content, not professional advice. Covers mythology, psychology, astrology, and spiritual content.',
    covers: ['Atlas chat is not therapy, medical, legal, or financial advice', 'Natal chart readings are educational/entertainment', 'Numerology & tarot readings are cultural exploration, not prediction', 'AI-generated story content may contain inaccuracies', 'Mentor interactions are not licensed professional services (unless explicitly stated)'],
    status: 'draft',
  },
  {
    id: 'content-disclaimer',
    title: 'Educational Content Disclaimer',
    category: 'policy',
    scope: 'All Users',
    description: 'Disclaimer covering the mythological, psychological, and spiritual content throughout the site.',
    covers: ['Monomyth & hero\'s journey content is educational interpretation', 'Seven Metals / Celestial Clocks presents historical & symbolic systems', 'Documentary content (Myths series) represents interview perspectives', 'Game content draws on historical/mythological sources', 'Library recommendations are curated, not endorsed'],
    status: 'draft',
  },
  {
    id: 'copyright-notice',
    title: 'Copyright & Attribution Notice',
    category: 'policy',
    scope: 'Public',
    description: 'Site-wide copyright notice and attribution for third-party content, open-source data, and creative commons materials.',
    covers: ['Mythouse original content copyright', 'Will Linn interview content (Myths series)', 'Stith Thompson Motif-Index (Apache 2.0 license, fbkarsdorp/tmi)', 'YouTube embedded content (playlist fair use)', 'Google Maps / Street View embeds', 'Wikisource text reader content (public domain)', 'Open-source library attributions'],
    status: 'draft',
  },
  {
    id: 'community-guidelines',
    title: 'Community Guidelines',
    category: 'policy',
    scope: 'All Users',
    description: 'Behavioral expectations for multiplayer interactions, mentor-student relationships, and Guild participation.',
    covers: ['Multiplayer game conduct (real-time board games)', 'Mentor-student communication standards', 'Guild discussion guidelines', 'Prohibited content & behavior', 'Reporting & enforcement process'],
    status: 'draft',
  },
  {
    id: 'data-retention',
    title: 'Data Retention & Deletion Policy',
    category: 'policy',
    scope: 'All Users',
    description: 'How long user data is kept and how users can request deletion. Required for GDPR compliance.',
    covers: ['Firestore data retention periods', 'Account deletion process & data purge', 'Coursework progress retention', 'Conversation history retention', 'BYOK key deletion guarantees', 'Backup & recovery limitations'],
    status: 'draft',
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services Notice',
    category: 'policy',
    scope: 'All Users',
    description: 'Disclosure of third-party services and their respective terms that apply when using the Mythouse.',
    covers: ['Firebase / Google Cloud (authentication, database, storage)', 'Anthropic Claude API (Atlas AI, journey synthesis)', 'OpenAI API (Story Forge narrative generation, persona voices)', 'Vercel (hosting, serverless functions)', 'YouTube (embedded video playlists)', 'Google Maps / Street View (Mythic Earth, Sacred Sites 360)', 'Wikisource (sacred text reader)'],
    status: 'draft',
  },
];

const LEGAL_STATUS_CONFIG = {
  'draft-needed': { label: 'Draft Needed', color: '#d9a55b' },
  'drafting': { label: 'Drafting', color: '#5b8dd9' },
  'review': { label: 'Under Review', color: '#b35bd9' },
  'final': { label: 'Final', color: '#5bd97a' },
  'active': { label: 'Active', color: '#5bd97a' },
};

function renderLegalDocument(text) {
  if (!text) return null;
  return text.trim().split('\n').map((line, i) => {
    const trimmed = line.trimEnd();
    if (!trimmed) return <br key={i} />;
    // Title lines (all caps, first non-empty line)
    if (/^MYTHOUSE\s/.test(trimmed)) return <h3 key={i} className="admin-legal-doc-title">{trimmed}</h3>;
    // Section headers like "1. ACCEPTANCE" or "1.1 Account"
    if (/^\d+\.\s+[A-Z]/.test(trimmed)) return <h4 key={i} className="admin-legal-doc-section">{trimmed}</h4>;
    if (/^\d+\.\d+\s/.test(trimmed)) return <p key={i} className="admin-legal-doc-subsection">{trimmed}</p>;
    // Bullet points
    if (/^- /.test(trimmed)) return <li key={i} className="admin-legal-doc-bullet">{trimmed.slice(2)}</li>;
    // "Last Updated" line
    if (/^Last Updated/.test(trimmed)) return <p key={i} className="admin-legal-doc-date">{trimmed}</p>;
    // Normal paragraph text
    return <p key={i} className="admin-legal-doc-para">{trimmed}</p>;
  });
}

function LegalSection() {
  const [viewMode, setViewMode] = useState('contracts');
  const [expandedItem, setExpandedItem] = useState(null);

  const items = viewMode === 'contracts' ? LEGAL_CONTRACTS : LEGAL_POLICIES;

  return (
    <div className="admin-legal">
      <h2 className="admin-legal-title">LEGAL</h2>
      <p className="admin-legal-subtitle">
        Contracts, agreements, policies, and disclaimers for the Mythouse platform.
      </p>

      <div className="admin-legal-stats">
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value">{LEGAL_CONTRACTS.length}</span>
          <span className="admin-ip-stat-label">Contracts</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value">{LEGAL_POLICIES.length}</span>
          <span className="admin-ip-stat-label">Policies</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: '#5b8dd9' }}>
            {[...LEGAL_CONTRACTS, ...LEGAL_POLICIES].filter(i => i.status === 'draft').length}
          </span>
          <span className="admin-ip-stat-label">Drafted</span>
        </div>
        <div className="admin-ip-stat">
          <span className="admin-ip-stat-value" style={{ color: '#5bd97a' }}>
            {[...LEGAL_CONTRACTS, ...LEGAL_POLICIES].filter(i => i.status === 'active' || i.status === 'final').length}
          </span>
          <span className="admin-ip-stat-label">Active</span>
        </div>
      </div>

      <div className="admin-legal-tabs">
        <button
          className={`admin-section-tab ${viewMode === 'contracts' ? 'active' : ''}`}
          onClick={() => { setViewMode('contracts'); setExpandedItem(null); }}
        >
          Contracts & Agreements ({LEGAL_CONTRACTS.length})
        </button>
        <button
          className={`admin-section-tab ${viewMode === 'policies' ? 'active' : ''}`}
          onClick={() => { setViewMode('policies'); setExpandedItem(null); }}
        >
          Policies & Disclaimers ({LEGAL_POLICIES.length})
        </button>
      </div>

      <div className="admin-legal-list">
        {items.map(item => {
          const isExpanded = expandedItem === item.id;
          const statusConf = LEGAL_STATUS_CONFIG[item.status] || LEGAL_STATUS_CONFIG['draft-needed'];
          return (
            <div key={item.id} className={`admin-legal-item${isExpanded ? ' expanded' : ''}`}>
              <button className="admin-legal-item-header" onClick={() => setExpandedItem(isExpanded ? null : item.id)}>
                <div className="admin-legal-item-title-row">
                  <span className="admin-legal-item-title">{item.title}</span>
                  <span className="admin-legal-item-scope">{item.scope}</span>
                </div>
                <div className="admin-legal-item-meta">
                  <span className="admin-legal-item-status" style={{ color: statusConf.color, borderColor: statusConf.color }}>
                    {statusConf.label}
                  </span>
                  <span className="admin-legal-item-chevron">{isExpanded ? '\u25BE' : '\u25B8'}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="admin-legal-item-body">
                  <p className="admin-legal-item-desc">{item.description}</p>
                  {item.trigger && (
                    <div className="admin-legal-item-trigger">
                      <span className="admin-legal-field-label">Trigger:</span> {item.trigger}
                    </div>
                  )}
                  <div className="admin-legal-item-covers">
                    <span className="admin-legal-field-label">Covers:</span>
                    <ul>
                      {item.covers.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="admin-legal-item-draft-area">
                    {LEGAL_DOCUMENTS[item.id] ? (
                      <div className="admin-legal-doc">
                        {renderLegalDocument(LEGAL_DOCUMENTS[item.id])}
                      </div>
                    ) : (
                      <div className="admin-legal-draft-placeholder">
                        Document draft not yet available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- System Health / Refresh Key ---
// =============================================
// STRATEGIC PLAN SECTION
// =============================================

const PLAN_PHASES = [
  {
    id: 'phase-0',
    phase: '0',
    title: 'Revenue Unlock',
    subtitle: 'Turn the site into a business',
    timeline: 'Immediate',
    color: '#e74c3c',
    icon: '\u26A1',
    initiatives: [
      { id: 'stripe', name: 'Stripe Integration', status: 'not-started', description: 'Payment processing for subscriptions and one-time purchases', priority: 'critical' },
      { id: 'pricing', name: 'Pricing Page', status: 'not-started', description: 'Public-facing page with tier comparison and CTAs', priority: 'critical' },
      { id: 'paywall', name: 'Paywall Gates', status: 'in-progress', description: 'Gate premium content (YBR, Forge, Starlight, Medicine Wheel) — toggles exist, need real payment', priority: 'critical' },
      { id: 'trial', name: 'Free Trial / Freemium Boundary', status: 'not-started', description: 'Define exactly what\'s free vs. paid. Give enough to hook, gate enough to convert.', priority: 'high' },
    ],
  },
  {
    id: 'phase-1',
    phase: '1',
    title: 'First Experience & Conversion',
    subtitle: 'Turn visitors into users into paying members',
    timeline: 'Q1 2026',
    color: '#f39c12',
    icon: '\u2728',
    initiatives: [
      { id: 'onboarding', name: 'Guided Onboarding Flow', status: 'not-started', description: '3-minute experience: archetype quiz \u2192 natal snapshot \u2192 personalized journey recommendation', priority: 'critical' },
      { id: 'landing-seo', name: 'SEO Landing Pages', status: 'not-started', description: 'Each major section (Monomyth, Chronosphaera, Story Forge, Games) needs its own optimized entry point', priority: 'high' },
      { id: 'email-capture', name: 'Email Capture & Lead Magnet', status: 'not-started', description: '"Your Mythic Profile" — free natal chart + archetype result in exchange for email', priority: 'high' },
      { id: 'discover-polish', name: 'Discover Starlight Landing', status: 'in-progress', description: 'Polish the front door — conversion-focused hero, social proof, clear value prop', priority: 'high' },
      { id: 'stub-pages', name: 'Complete Stub Pages', status: 'in-progress', description: 'XR, Sacred Sites 360, Mythic Earth, Guild — finish or remove from nav', priority: 'medium' },
      { id: 'mobile', name: 'Mobile Optimization', status: 'not-started', description: 'Responsive pass on all pages, especially Chronosphaera orbital diagram', priority: 'high' },
    ],
  },
  {
    id: 'phase-2',
    phase: '2',
    title: 'Content Flywheel & Marketing',
    subtitle: 'Build the engine that grows itself',
    timeline: 'Q2 2026',
    color: '#2ecc71',
    icon: '\u267B',
    initiatives: [
      { id: 'mythic-year-execute', name: 'Execute Mythic Year Campaign', status: 'in-progress', description: 'The 12-month zodiac Instagram campaign — infrastructure built, now execute', priority: 'critical' },
      { id: 'email-sequences', name: 'Email Automation', status: 'not-started', description: 'Welcome drip, course nudges, re-engagement sequences, purchase follow-ups', priority: 'high' },
      { id: 'seo-content', name: 'Blog / SEO Articles', status: 'not-started', description: '57 data files = 57+ articles waiting to be written. Monomyth stages, planet mythology, game history.', priority: 'high' },
      { id: 'youtube', name: 'YouTube / Mythology Channel', status: 'in-progress', description: 'Video content from Mythology Channel page — series, shows, educational content', priority: 'medium' },
      { id: 'forge-viral', name: 'Story Forge Sharing', status: 'not-started', description: 'Users create myths \u2192 share publicly \u2192 bring new users. Social proof + content generation.', priority: 'high' },
      { id: 'referral', name: 'Referral Program', status: 'not-started', description: 'Invite friends, earn free months or purchase credits', priority: 'medium' },
    ],
  },
  {
    id: 'phase-3',
    phase: '3',
    title: 'Community & Retention',
    subtitle: 'Keep members engaged and coming back',
    timeline: 'Q3 2026',
    color: '#3498db',
    icon: '\u26ED',
    initiatives: [
      { id: 'guild-activate', name: 'Guild System Activation', status: 'not-started', description: 'Challenges, leaderboards, collaborative journeys, guild quests', priority: 'high' },
      { id: 'mentor-marketplace', name: 'Mentor Marketplace', status: 'in-progress', description: 'Real scheduling, session payments, mentor profiles — infrastructure exists', priority: 'high' },
      { id: 'ugc', name: 'User-Generated Content', status: 'not-started', description: 'Community myths, shared journeys, myth salon discussions', priority: 'medium' },
      { id: 'live-events', name: 'Live Events', status: 'not-started', description: 'Virtual guided journeys, mythology salons, group Chronosphaera sessions', priority: 'medium' },
      { id: 'certs-real', name: 'Real Certifications', status: 'not-started', description: 'LinkedIn badges, printable certificates, external credentialing for coursework ranks', priority: 'medium' },
      { id: 'analytics', name: 'Analytics Dashboard', status: 'not-started', description: 'User engagement metrics, funnel tracking, cohort analysis in Dragon', priority: 'high' },
    ],
  },
  {
    id: 'phase-4',
    phase: '4',
    title: 'Platform & Scale',
    subtitle: 'From product to platform',
    timeline: 'Q4 2026 \u2192 2027',
    color: '#9b59b6',
    icon: '\u2604',
    initiatives: [
      { id: 'educator-license', name: 'Educator Licensing', status: 'not-started', description: 'Monomyth + coursework = ready-made mythology curriculum for schools and workshops', priority: 'high' },
      { id: 'api-content', name: 'Content API / Third-Party Journeys', status: 'not-started', description: 'Let mythology scholars and educators add their own journeys via API', priority: 'medium' },
      { id: 'multilingual', name: 'Multilingual Support', status: 'not-started', description: 'Mythology is universal — translate core experience to 5+ languages', priority: 'medium' },
      { id: 'pwa', name: 'Progressive Web App / Mobile', status: 'not-started', description: 'Offline support, push notifications, app store presence', priority: 'high' },
      { id: 'publisher', name: 'Publisher Partnerships', status: 'not-started', description: 'Book deals, documentary tie-ins, educational content licensing (IP registry ready)', priority: 'medium' },
      { id: 'tv-integration', name: 'Lost Treasures TV Tie-In', status: 'in-progress', description: 'Myths page with Templars, Czar Gold series — extend into companion app experience', priority: 'medium' },
    ],
  },
];

const REVENUE_STREAMS = [
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: '\uD83D\uDD11',
    phase: '0',
    items: [
      { name: 'Master Key', id: 'master-key', description: 'All-access bundle', status: 'built', priceNote: 'Set pricing' },
      { name: 'Yellow Brick Road', id: 'ybr', description: 'Guided monomyth journey', status: 'built', priceNote: 'Set pricing' },
      { name: 'Story Forge', id: 'forge', description: 'AI myth writing', status: 'built', priceNote: 'Set pricing' },
      { name: 'Coursework', id: 'coursework', description: 'Progress tracking & ranks', status: 'built', priceNote: 'Set pricing' },
    ],
  },
  {
    id: 'purchases',
    name: 'One-Time Purchases',
    icon: '\uD83D\uDCE6',
    phase: '0',
    items: [
      { name: 'Fallen Starlight', id: 'fallen-starlight', description: 'Narrative overlay', status: 'built', priceNote: 'Set pricing' },
      { name: 'Story of Stories', id: 'story-of-stories', description: 'Meta-narrative layer', status: 'built', priceNote: 'Set pricing' },
      { name: 'Medicine Wheel', id: 'medicine-wheel', description: 'Sacred hoop overlay', status: 'built', priceNote: 'Set pricing' },
      { name: 'Starlight Bundle', id: 'starlight-bundle', description: 'Both books discounted', status: 'built', priceNote: 'Set pricing' },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    icon: '\uD83E\uDD1D',
    phase: '3',
    items: [
      { name: 'Mentorship Sessions', id: 'mentorship', description: 'Paid mentor pairing', status: 'partial', priceNote: 'TBD' },
      { name: 'Consulting', id: 'consulting', description: 'Professional mythology consulting', status: 'partial', priceNote: 'TBD' },
      { name: 'Live Events', id: 'events', description: 'Virtual mythology salons', status: 'not-started', priceNote: 'TBD' },
    ],
  },
  {
    id: 'licensing',
    name: 'Licensing & Partnerships',
    icon: '\uD83C\uDFDB',
    phase: '4',
    items: [
      { name: 'Educator Packages', id: 'edu-license', description: 'School & workshop curriculum', status: 'not-started', priceNote: 'TBD' },
      { name: 'Content API Access', id: 'api-access', description: 'Third-party journey creation', status: 'not-started', priceNote: 'TBD' },
      { name: 'Publisher Deals', id: 'publisher', description: 'Books, documentaries, IP licensing', status: 'not-started', priceNote: 'TBD' },
    ],
  },
];

const FEATURE_MATRIX = [
  { name: 'Home (Meteor Steel)', route: '/home', status: 'live', category: 'core' },
  { name: 'Discover Starlight (Landing)', route: '/', status: 'live', category: 'core' },
  { name: 'Monomyth (8 stages \u00D7 6 tabs)', route: '/monomyth', status: 'live', category: 'core' },
  { name: 'Chronosphaera (7 planets, 12+ modes)', route: '/chronosphaera', status: 'live', category: 'core' },
  { name: 'Games (6 ancient board games)', route: '/games', status: 'live', category: 'core' },
  { name: 'Atlas AI (multi-persona chat)', route: '/atlas', status: 'live', category: 'core' },
  { name: 'Story Forge (AI myth writing)', route: '/story-forge', status: 'live', category: 'premium' },
  { name: 'Yellow Brick Road (26 stops)', route: '/yellow-brick-road', status: 'live', category: 'premium' },
  { name: 'Ouroboros Journeys (monomyth + planetary + zodiac)', route: '/journey/:id', status: 'live', category: 'premium' },
  { name: 'Fallen Starlight (8 chapters)', route: '/fallen-starlight', status: 'live', category: 'premium' },
  { name: 'Story of Stories', route: '/story-of-stories', status: 'live', category: 'premium' },
  { name: 'Library', route: '/library', status: 'live', category: 'core' },
  { name: 'Mythology Channel', route: '/mythology-channel', status: 'live', category: 'core' },
  { name: 'Profile (ranks, certs, natal, numerology)', route: '/profile', status: 'live', category: 'core' },
  { name: 'Coursework System (7 courses)', route: 'system', status: 'live', category: 'premium' },
  { name: 'Mentor Directory & Matching', route: '/mentors', status: 'live', category: 'community' },
  { name: 'Discover Page', route: '/discover', status: 'live', category: 'core' },
  { name: 'Myths / Lost Treasures TV', route: '/myths', status: 'live', category: 'content' },
  { name: 'Chronosphaera VR', route: '/chronosphaera/vr', status: 'live', category: 'experimental' },
  { name: 'Mythic Earth (map)', route: '/mythic-earth', status: 'early', category: 'experimental' },
  { name: 'Sacred Sites 360', route: '/sacred-sites-360', status: 'early', category: 'experimental' },
  { name: 'XR Page', route: '/xr', status: 'early', category: 'experimental' },
  { name: 'Guild System', route: '/guild', status: 'early', category: 'community' },
  { name: 'Stripe / Payments', route: 'system', status: 'not-built', category: 'revenue' },
  { name: 'Email Automation', route: 'system', status: 'not-built', category: 'growth' },
  { name: 'Analytics Dashboard', route: 'system', status: 'not-built', category: 'ops' },
  { name: 'SEO / Blog', route: 'system', status: 'not-built', category: 'growth' },
  { name: 'Mobile / PWA', route: 'system', status: 'not-built', category: 'platform' },
];

const FEATURE_STATUS_CONFIG = {
  live: { color: '#5bd97a', label: 'Live', bg: 'rgba(91,217,122,0.1)' },
  early: { color: '#d9a55b', label: 'Early', bg: 'rgba(217,165,91,0.1)' },
  'not-built': { color: '#d95b5b', label: 'Not Built', bg: 'rgba(217,91,91,0.1)' },
};

const INITIATIVE_STATUS_CONFIG = {
  complete: { color: '#5bd97a', label: 'Complete' },
  'in-progress': { color: '#d9a55b', label: 'In Progress' },
  'not-started': { color: '#6a6a7a', label: 'Not Started' },
};

// =============================================
// PRODUCT ROADMAP DATA
// =============================================

const PRODUCT_CATEGORIES = [
  { id: 'narrative', label: 'Narrative & Story', color: '#c4713a' },
  { id: 'celestial', label: 'Celestial & Esoteric', color: '#7b68ee' },
  { id: 'interactive', label: 'Games & Journeys', color: '#2ecc71' },
  { id: 'ai', label: 'Atlas & AI', color: '#3498db' },
  { id: 'media', label: 'Media & Library', color: '#e67e22' },
  { id: 'community', label: 'Community & Profile', color: '#e74c3c' },
  { id: 'immersive', label: 'Immersive & XR', color: '#1abc9c' },
  { id: 'platform', label: 'Platform & Ops', color: '#95a5a6' },
];

const PRODUCT_ROADMAP = [
  // --- NARRATIVE & STORY ---
  {
    id: 'fallen-starlight',
    name: 'Fallen Starlight',
    category: 'narrative',
    description: 'The Revelation — 8-chapter descent of celestial fire through the seven planetary metals',
    route: '/fallen-starlight',
    released: [
      { label: '8 chapters with audio player', version: '1.0' },
      { label: 'Monomyth stage navigation per chapter', version: '1.0' },
      { label: 'Meteor shower visual transitions', version: '1.0' },
      { label: 'Coursework tracking (15s/chapter)', version: '1.0' },
    ],
    next: [
      { label: 'Chapter annotations & commentary layer' },
      { label: 'Study guides for book clubs' },
      { label: 'Full audiobook player (continuous)' },
    ],
    future: [
      { label: 'Illustrated edition with artist interviews' },
      { label: 'Interactive reading experience with Atlas' },
    ],
    maturity: 'gold',
    purchaseGate: 'fallen-starlight',
  },
  {
    id: 'story-of-stories',
    name: 'Story of Stories',
    category: 'narrative',
    description: 'The meta-narrative — stories that emerged from the fall of light into matter',
    route: '/story-of-stories',
    released: [
      { label: '8 chapters mirroring monomyth', version: '1.0' },
      { label: 'Tab-based content per chapter', version: '1.0' },
      { label: 'Audio chapter player', version: '1.0' },
    ],
    next: [
      { label: 'Creative writing prompts per chapter' },
      { label: 'Author Q&A content layer' },
    ],
    future: [
      { label: 'Interactive choose-your-own-adventure variant' },
      { label: 'Community discussion per chapter' },
    ],
    maturity: 'gold',
    purchaseGate: 'story-of-stories',
  },
  {
    id: 'story-forge',
    name: 'Story Forge',
    category: 'narrative',
    description: 'Write your own myth — 4 templates, 8 monomyth stages, Atlas AI collaboration',
    route: '/story-forge',
    released: [
      { label: '4 templates: Personal, Fiction, Screenplay, Reflection', version: '1.0' },
      { label: '8-stage monomyth writing framework', version: '1.0' },
      { label: 'Atlas AI story synthesis & continuation', version: '1.0' },
      { label: 'Persistent story library (WritingsContext)', version: '1.0' },
      { label: 'Polarity generator (protagonist/antagonist)', version: '1.0' },
    ],
    next: [
      { label: 'Story sharing gallery (public stories)' },
      { label: 'Collaborative writing (multi-author)' },
    ],
    future: [
      { label: 'Story-to-game converter' },
      { label: 'Publishing pipeline (PDF export, community gallery)' },
      { label: 'Story remix system' },
    ],
    maturity: 'gold',
    subscriptionGate: 'forge',
  },

  // --- CELESTIAL & ESOTERIC ---
  {
    id: 'chronosphaera',
    name: 'Chronosphaera',
    category: 'celestial',
    description: 'The Celestial Clocks — 7 planets, 12 zodiac, 4 cardinals, 12+ view modes across 13 data files',
    route: '/chronosphaera',
    released: [
      { label: '7 planets with multi-cultural analysis', version: '1.0' },
      { label: '12 zodiac signs with archetypal depth', version: '1.0' },
      { label: '4 cardinal points (solstices/equinoxes)', version: '1.0' },
      { label: '12+ modes: Calendar, Body, Monomyth, Deities, Archetypes, Artists, Hebrew, Modern, Theology...', version: '1.0' },
      { label: 'Interactive orbital diagram', version: '1.0' },
      { label: 'Tarot integration', version: '1.0' },
      { label: 'Day/night cycles', version: '1.0' },
    ],
    next: [
      { label: 'Personal birth chart reading system' },
      { label: 'Audio meditations per planet/zodiac' },
      { label: 'Transiting planet calculator (real-time positions)' },
    ],
    future: [
      { label: 'Guided "Celestial Reading" immersive experience (30-60 min)' },
      { label: 'Chronosphaera mobile widget' },
    ],
    maturity: 'gold',
  },
  {
    id: 'medicine-wheel',
    name: 'Medicine Wheel',
    category: 'celestial',
    description: 'Hyemeyohsts Storm\'s sacred hoop — four directions overlaid on the Chronosphaera',
    route: '/chronosphaera',
    released: [
      { label: 'Medicine wheel overlay on Chronosphaera', version: '1.0' },
      { label: 'Four directions with powers and animals', version: '1.0' },
      { label: 'Multiple wheel traditions', version: '1.0' },
    ],
    next: [
      { label: 'Guided medicine wheel ceremony walkthrough' },
      { label: 'Personal direction reading' },
    ],
    future: [
      { label: 'Indigenous wisdom interview series' },
    ],
    maturity: 'gold',
    purchaseGate: 'medicine-wheel',
  },

  // --- GAMES & JOURNEYS ---
  {
    id: 'ancient-games',
    name: 'Ancient Board Games',
    category: 'interactive',
    description: '6 historically researched games: Senet, Ur, Mehen, Jackals & Hounds, Pachisi, Snakes & Ladders',
    route: '/games',
    released: [
      { label: '6 fully playable games', version: '1.0' },
      { label: 'AI opponent engine', version: '1.0' },
      { label: 'Multiplayer with lobby', version: '1.0' },
      { label: 'Shared GameShell with completion tracking', version: '1.0' },
      { label: 'Historical context per game', version: '1.0' },
    ],
    next: [
      { label: 'Tournament mode (bracket competitions)' },
      { label: 'Strategy guides per game' },
      { label: 'Game leaderboards' },
    ],
    future: [
      { label: 'Seasonal quests & game variants' },
      { label: 'Time attack modes' },
      { label: 'New game additions' },
    ],
    maturity: 'gold',
  },
  {
    id: 'ouroboros-journeys',
    name: 'Ouroboros Journeys',
    category: 'interactive',
    description: '6 journey types, 3 modes (Riddle/Story/Personal), 216+ interactive challenge sets',
    route: '/journey/:id',
    released: [
      { label: 'Monomyth Journey (8 stops)', version: '1.0' },
      { label: 'Meteor Steel Journey (8 stops)', version: '1.0' },
      { label: 'Fused Journey (8 stops, 2 phases)', version: '1.0' },
      { label: 'Planetary Journey (7 planets, 3 levels)', version: '1.0' },
      { label: 'Zodiac Journey (12 signs, 3 levels)', version: '1.0' },
      { label: 'Cosmic Journey (26 stops, 3 levels)', version: '1.0' },
      { label: 'Riddle / Story / Personal modes', version: '1.0' },
      { label: 'Dragon coil visualization', version: '1.0' },
    ],
    next: [
      { label: 'Group/collaborative journey mode' },
      { label: 'Post-journey synthesis booklet' },
    ],
    future: [
      { label: 'Branching narrative paths (player choices)' },
      { label: 'Custom user-designed journeys' },
    ],
    maturity: 'gold',
    subscriptionGate: 'ybr',
  },
  {
    id: 'yellow-brick-road',
    name: 'Yellow Brick Road',
    category: 'interactive',
    description: '26-stop cosmic pathway — guided monomyth journey with Atlas at each threshold',
    route: '/yellow-brick-road',
    released: [
      { label: '26 stops through mythic figures', version: '1.0' },
      { label: 'Atlas walk-alongside AI guide', version: '1.0' },
      { label: 'Journey selection hub', version: '1.0' },
    ],
    next: [
      { label: 'Progress persistence across sessions' },
      { label: 'Achievement milestones per segment' },
    ],
    future: [
      { label: 'Multiplayer group walk' },
    ],
    maturity: 'gold',
    subscriptionGate: 'ybr',
  },

  // --- ATLAS & AI ---
  {
    id: 'atlas',
    name: 'Atlas AI',
    category: 'ai',
    description: 'Multi-persona AI mentor — 25+ voices across planets, zodiac, cardinals, and the primary Atlas guide',
    route: '/atlas',
    released: [
      { label: 'Atlas primary guide', version: '1.0' },
      { label: '7 planetary voices', version: '1.0' },
      { label: '12 zodiac voices', version: '1.0' },
      { label: '4 cardinal voices', version: '1.0' },
      { label: 'Per-voice chat history', version: '1.0' },
      { label: 'Voice I/O support', version: '1.0' },
      { label: 'Course-aware summaries (knows your progress)', version: '1.0' },
      { label: 'Cross-page sidebar integration', version: '1.0' },
    ],
    next: [
      { label: 'Mythic figure personas (Merlin, Athena, Thoth...)' },
      { label: 'Quest assignment system (Atlas assigns, tracks)' },
      { label: 'Conversation bookmarks & highlights' },
    ],
    future: [
      { label: 'Personal mentor voice creation' },
      { label: 'Group conversation mode' },
      { label: 'Atlas "office hours" scheduled sessions' },
    ],
    maturity: 'gold',
  },

  // --- MEDIA & LIBRARY ---
  {
    id: 'mythology-channel',
    name: 'Mythology Channel',
    category: 'media',
    description: '15 curated shows on myth, depth psychology, and culture — YouTube integration',
    route: '/mythology-channel',
    released: [
      { label: '15 shows embedded with playlist navigation', version: '1.0' },
      { label: 'Episode tracking & coursework integration', version: '1.0' },
      { label: 'Synthesis data per episode', version: '1.0' },
    ],
    next: [
      { label: 'Transcript search across all shows' },
      { label: 'Topic-based curated playlists' },
      { label: 'Guided viewing courses' },
    ],
    future: [
      { label: 'Live stream feature for new content' },
      { label: 'Community watch parties' },
    ],
    maturity: 'gold',
  },
  {
    id: 'library',
    name: 'Myth Salon Library',
    category: 'media',
    description: '8-stop trail narrative — from Pacifica origins to Mentone sanctuary, rare collections',
    route: '/library',
    released: [
      { label: '8-stop trail narrative', version: '1.0' },
      { label: 'Physical collection catalog (Campbell, Eranos, Bollingen...)', version: '1.0' },
      { label: 'Trail completion tracking', version: '1.0' },
    ],
    next: [
      { label: 'Virtual library tour (3D walkthrough)' },
      { label: 'Book recommendation AI' },
    ],
    future: [
      { label: 'Rare book digitization (OCR + full-text search)' },
      { label: 'Community reading groups' },
    ],
    maturity: 'gold',
  },
  {
    id: 'myths-tv',
    name: 'Myths: Lost Treasures',
    category: 'media',
    description: 'TV series hub — Templars, Czar Gold, structured by episode with 3-ring knowledge system',
    route: '/myths',
    released: [
      { label: '3-ring knowledge hierarchy', version: '1.0' },
      { label: 'Episode browser with synthesis', version: '1.0' },
      { label: 'Mythouse card/arcana lookup', version: '1.0' },
    ],
    next: [
      { label: 'Complete all 5 episode tabs (Themes, Playlist, References, Music, Previous)' },
      { label: 'Behind-the-scenes material' },
    ],
    future: [
      { label: 'Companion app experience for TV viewers' },
      { label: 'Episode discussion forums' },
    ],
    maturity: 'silver',
  },

  // --- COMMUNITY & PROFILE ---
  {
    id: 'monomyth',
    name: 'Monomyth Explorer',
    category: 'interactive',
    description: '8 stages x 6 tabs = 48 content areas — Campbell, Jung, Vogler, films, myths, cycles',
    route: '/monomyth',
    released: [
      { label: '8 stages with full content', version: '1.0' },
      { label: '6 tabs per stage: Overview, Cycles, Theorists, Experts, Myths, Films', version: '1.0' },
      { label: 'Stage-based quizzes', version: '1.0' },
      { label: '300+ mythological references', version: '1.0' },
    ],
    next: [
      { label: 'Video/media interpretations per stage' },
      { label: 'Expert depth psychology commentary' },
    ],
    future: [
      { label: 'Collaborative myth-mapping' },
      { label: 'Stage-by-stage discussion forums' },
    ],
    maturity: 'gold',
  },
  {
    id: 'coursework',
    name: 'Coursework System',
    category: 'community',
    description: '10 courses with progress tracking, ranks, and certificates',
    route: '/profile',
    released: [
      { label: '10 courses spanning all product areas', version: '1.0' },
      { label: 'Requirement engine (element, count, time, group tracking)', version: '1.0' },
      { label: 'Firestore progress persistence', version: '1.0' },
      { label: 'Rank system with progression', version: '1.0' },
      { label: 'Admin analytics dashboard', version: '1.0' },
    ],
    next: [
      { label: 'Difficulty levels (beginner/intermediate/master)' },
      { label: 'Printable certificates' },
      { label: 'LinkedIn badge integration' },
    ],
    future: [
      { label: 'Course prereq chains' },
      { label: 'Cohort-based group courses' },
      { label: 'Mentor-led courses' },
    ],
    maturity: 'gold',
    subscriptionGate: 'coursework',
  },
  {
    id: 'profile',
    name: 'Profile & Identity',
    category: 'community',
    description: 'User identity — ranks, natal chart, numerology, handle, mentor status, API keys',
    route: '/profile',
    released: [
      { label: 'Rank display & progression', version: '1.0' },
      { label: 'Natal chart entry', version: '1.0' },
      { label: 'Numerology engine', version: '1.0' },
      { label: 'Multiplayer handle registration', version: '1.0' },
      { label: 'Subscription/purchase management', version: '1.0' },
      { label: 'Photo upload', version: '1.0' },
      { label: 'BYOK API key management', version: '1.0' },
    ],
    next: [
      { label: 'Personal learning dashboard (progress timeline)' },
      { label: 'Public profile portfolio' },
    ],
    future: [
      { label: 'Social connections & following' },
      { label: 'Achievement showcase' },
    ],
    maturity: 'gold',
  },
  {
    id: 'mentors',
    name: 'Mentorship & Consulting',
    category: 'community',
    description: 'Mentor directory, pairing, applications, consulting services',
    route: '/mentors',
    released: [
      { label: 'Mentor types & status system', version: '1.0' },
      { label: 'Application chat interface', version: '1.0' },
      { label: 'Capacity management', version: '1.0' },
      { label: 'Pairing & matching', version: '1.0' },
      { label: 'Consulting services', version: '1.0' },
    ],
    next: [
      { label: 'Booking & scheduling system' },
      { label: 'Session payment processing' },
    ],
    future: [
      { label: 'Mentor-created courses' },
      { label: 'Video session integration' },
    ],
    maturity: 'silver',
  },
  {
    id: 'guild',
    name: 'Guild System',
    category: 'community',
    description: 'Community guilds, multiplayer identity, group activities',
    route: '/guild',
    released: [
      { label: 'Guild page structure', version: '0.5' },
      { label: 'Handle system & multiplayer context', version: '1.0' },
    ],
    next: [
      { label: 'Guild creation & membership' },
      { label: 'Group challenges & quests' },
      { label: 'Leaderboards' },
    ],
    future: [
      { label: 'Guild tournaments' },
      { label: 'Guild-exclusive content' },
    ],
    maturity: 'bronze',
  },

  // --- IMMERSIVE & XR ---
  {
    id: 'chronosphaera-vr',
    name: 'Chronosphaera VR',
    category: 'immersive',
    description: '3D celestial experience — orbit the Sun, stand at center, real-time planets',
    route: '/chronosphaera/vr',
    released: [
      { label: 'Three.js + React Three Fiber 3D scene', version: '1.0' },
      { label: 'XR headset support', version: '1.0' },
      { label: 'Orbital visualization', version: '1.0' },
    ],
    next: [
      { label: 'Personalized zodiac constellation view' },
      { label: 'Guided VR meditation' },
    ],
    future: [
      { label: 'Multiplayer VR meditation space' },
      { label: 'Haptic feedback integration' },
    ],
    maturity: 'silver',
  },
  {
    id: 'mythic-earth',
    name: 'Mythic Earth',
    category: 'immersive',
    description: '3D globe with 50+ sacred sites, temples, mythic locations — Cesium.js',
    route: '/mythic-earth',
    released: [
      { label: '3D globe with satellite imagery', version: '1.0' },
      { label: '5 categories: Sacred Sites, Mythic, Literary, Temples, Libraries', version: '1.0' },
      { label: 'Region filtering & billboard labels', version: '1.0' },
      { label: '50+ mapped locations', version: '1.0' },
    ],
    next: [
      { label: 'Pilgrimage routes (multi-site narratives)' },
      { label: 'Timeline slider (historical changes)' },
    ],
    future: [
      { label: 'AR overlay (point camera, see mythic context)' },
      { label: 'User-submitted location stories' },
    ],
    maturity: 'silver',
  },
  {
    id: 'sacred-sites-360',
    name: 'Sacred Sites 360',
    category: 'immersive',
    description: 'Immersive Street View exploration of the world\'s sacred locations',
    route: '/sacred-sites-360',
    released: [
      { label: 'Google Street View integration', version: '0.5' },
      { label: 'Region filtering', version: '0.5' },
    ],
    next: [
      { label: 'Sacred site passport (digital stamps)' },
      { label: 'Integration with Mythic Earth globe' },
    ],
    future: [
      { label: 'Historical overlay (how sites looked in different eras)' },
      { label: 'AR phone mode' },
    ],
    maturity: 'bronze',
  },
  {
    id: 'xr-hub',
    name: 'XR Experiences Hub',
    category: 'immersive',
    description: 'Gateway to VR/AR experiences — Celestial Wheels 3D, Mythic Earth AR',
    route: '/xr',
    released: [
      { label: 'Experience launcher with 2 experiences', version: '0.5' },
      { label: 'VR headset + phone AR support', version: '0.5' },
    ],
    next: [
      { label: 'Temple/sacred site VR walkthroughs' },
      { label: 'Experience rating & feedback' },
    ],
    future: [
      { label: 'User-created XR experiences' },
      { label: 'Social VR (shared spaces)' },
    ],
    maturity: 'bronze',
  },

  // --- PLATFORM & OPS ---
  {
    id: 'payments',
    name: 'Payments (Stripe)',
    category: 'platform',
    description: 'Payment processing for subscriptions and purchases — THE critical missing piece',
    route: 'system',
    released: [
      { label: 'Subscription/purchase model defined', version: '0.5' },
      { label: 'Profile toggle infrastructure', version: '0.5' },
    ],
    next: [
      { label: 'Stripe integration' },
      { label: 'Checkout flow' },
      { label: 'Pricing page' },
    ],
    future: [
      { label: 'Tiered pricing (annual discount)' },
      { label: 'Gift subscriptions' },
      { label: 'Promo codes' },
    ],
    maturity: 'bronze',
  },
  {
    id: 'email-system',
    name: 'Email & Marketing',
    category: 'platform',
    description: 'Email capture, drip sequences, campaign automation',
    route: 'system',
    released: [
      { label: 'Subscriber collection (Dragon tab)', version: '0.5' },
    ],
    next: [
      { label: 'Welcome drip sequence' },
      { label: 'Course nudge emails' },
      { label: 'Re-engagement automation' },
    ],
    future: [
      { label: 'Personalized content recommendations via email' },
      { label: 'Newsletter with AI-generated mythic content' },
    ],
    maturity: 'bronze',
  },
  {
    id: 'campaign-system',
    name: 'Campaign Manager',
    category: 'platform',
    description: 'Mythic Year — 12-month zodiac Instagram campaign infrastructure',
    route: '/dragon',
    released: [
      { label: '12-month campaign framework', version: '1.0' },
      { label: 'Post status tracking (draft/prepared/scheduled/posted)', version: '1.0' },
      { label: '7 cultural lenses per post', version: '1.0' },
      { label: 'Progress visualization', version: '1.0' },
    ],
    next: [
      { label: 'Execute campaign (create & post content)' },
      { label: 'Cross-platform support (Twitter/X, TikTok)' },
    ],
    future: [
      { label: 'AI-assisted post generation' },
      { label: 'Analytics integration (engagement tracking)' },
    ],
    maturity: 'gold',
  },
];

const MATURITY_CONFIG = {
  gold: { color: 'rgba(218,165,32,0.9)', bg: 'rgba(218,165,32,0.12)', label: 'Gold', description: 'Production-ready, rich content' },
  silver: { color: '#a8b4c0', bg: 'rgba(168,180,192,0.12)', label: 'Silver', description: 'Functional, needs depth' },
  bronze: { color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', label: 'Bronze', description: 'Early / stub / not started' },
};

const KEY_METRICS = [
  { name: 'Monthly Active Users', target: 'Track', source: 'Firebase Auth + analytics', phase: '1' },
  { name: 'Free \u2192 Paid Conversion', target: '3-5%', source: 'Stripe + profiles', phase: '0' },
  { name: 'Subscription Churn', target: '<5%/mo', source: 'Stripe', phase: '0' },
  { name: 'Course Completion Rate', target: '>25%', source: 'Coursework system (built)', phase: '1' },
  { name: 'Atlas Messages / User', target: 'Track', source: 'Chat API logs', phase: '1' },
  { name: 'Stories Created (Forge)', target: 'Track', source: 'WritingsContext', phase: '2' },
  { name: 'Journey Completion Rate', target: '>15%', source: 'Journey hooks', phase: '2' },
  { name: 'Revenue Per User (ARPU)', target: 'Track', source: 'Stripe', phase: '0' },
  { name: 'Organic Traffic Growth', target: '10%+ mo/mo', source: 'Google Analytics', phase: '2' },
  { name: 'Email List Size', target: '1K in 90d', source: 'Subscribers system (built)', phase: '1' },
  { name: 'Mentor Active Pairings', target: 'Track', source: 'Mentor system (built)', phase: '3' },
  { name: 'Guild Members', target: 'Track', source: 'Guild system', phase: '3' },
];

// --- Strategic Notes persistence ---
function useStrategicNotes() {
  const key = 'dragon-strategic-notes';
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved || '';
    } catch {
      return '';
    }
  });

  const [phaseNotes, setPhaseNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(key + '-phases');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(key, notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(key + '-phases', JSON.stringify(phaseNotes));
  }, [phaseNotes]);

  const updatePhaseNote = useCallback((phaseId, value) => {
    setPhaseNotes(prev => ({ ...prev, [phaseId]: value }));
  }, []);

  return { notes, setNotes, phaseNotes, updatePhaseNote };
}

// --- Initiative status persistence ---
function useInitiativeStatuses() {
  const key = 'dragon-initiative-statuses';
  const [statuses, setStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(statuses));
  }, [statuses]);

  const getStatus = useCallback((id, defaultStatus) => statuses[id] || defaultStatus, [statuses]);
  const setStatus = useCallback((id, status) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  }, []);

  return { getStatus, setStatus };
}

function StrategicPlanSection() {
  const [expandedPhase, setExpandedPhase] = useState('phase-0');
  const [viewMode, setViewMode] = useState('vision');
  const { notes, setNotes, phaseNotes, updatePhaseNote } = useStrategicNotes();
  const { getStatus, setStatus: setInitiativeStatus } = useInitiativeStatuses();
  // Roadmap filter state (lifted here for hooks rules)
  const [roadmapFilterCat, setRoadmapFilterCat] = useState('all');
  const [roadmapFilterMaturity, setRoadmapFilterMaturity] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState(null);

  const S = {
    section: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
    heading: { fontFamily: 'Cinzel, serif', color: 'rgba(218,165,32,0.9)', fontSize: '1.5rem', marginBottom: 4, letterSpacing: 2 },
    subtitle: { color: '#888', fontSize: '0.9rem', marginBottom: 28, fontStyle: 'italic' },
    tabRow: { display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid #2a2a3a' },
    tab: (active) => ({
      padding: '10px 20px', background: 'none', border: 'none',
      borderBottom: active ? '2px solid rgba(218,165,32,0.7)' : '2px solid transparent',
      color: active ? 'rgba(218,165,32,0.9)' : '#6a6a7a', fontFamily: 'Cinzel, serif',
      fontSize: '0.82rem', letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
    }),
    card: (borderColor) => ({
      background: 'rgba(26,26,36,0.7)', border: `1px solid ${borderColor || 'rgba(218,165,32,0.15)'}`,
      borderRadius: 10, padding: '20px 22px', marginBottom: 16,
    }),
    grid: (cols) => ({
      display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cols || 280}px, 1fr))`, gap: 14,
    }),
    phaseLabel: (color) => ({
      display: 'inline-block', padding: '2px 10px', borderRadius: 4,
      background: color + '22', color: color, fontSize: '0.72rem',
      fontFamily: 'Cinzel, serif', letterSpacing: 1, fontWeight: 600,
    }),
    statusDot: (color) => ({
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 8, verticalAlign: 'middle',
    }),
    initiativeRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, marginBottom: 6,
    },
    select: {
      background: '#1a1a24', border: '1px solid #3a3a4a', borderRadius: 4,
      color: '#ccc', padding: '3px 8px', fontSize: '0.75rem', fontFamily: 'inherit',
    },
    textarea: {
      width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(218,165,32,0.2)',
      borderRadius: 8, padding: '14px 16px', color: '#ccc', fontSize: '0.85rem', lineHeight: 1.7,
      fontFamily: 'Georgia, serif', resize: 'vertical',
    },
    sectionTitle: { fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '1rem', marginBottom: 14 },
    badge: (bg, fg) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: bg, color: fg, fontSize: '0.7rem', letterSpacing: 0.5,
    }),
  };

  // Compute phase progress from initiative statuses
  const phaseProgress = useMemo(() => {
    const result = {};
    for (const phase of PLAN_PHASES) {
      const total = phase.initiatives.length;
      let complete = 0;
      let inProgress = 0;
      for (const init of phase.initiatives) {
        const s = getStatus(init.id, init.status);
        if (s === 'complete') complete++;
        else if (s === 'in-progress') inProgress++;
      }
      result[phase.id] = { total, complete, inProgress, pct: total > 0 ? Math.round((complete / total) * 100) : 0 };
    }
    return result;
  }, [getStatus]);

  const renderVision = () => (
    <div>
      {/* Phase overview bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {PLAN_PHASES.map(phase => {
          const p = phaseProgress[phase.id];
          const isExpanded = expandedPhase === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              style={{
                flex: '1 1 180px', padding: '14px 16px', background: isExpanded ? phase.color + '22' : 'rgba(26,26,36,0.7)',
                border: `1px solid ${isExpanded ? phase.color + '66' : '#2a2a3a'}`, borderRadius: 10,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{phase.icon}</div>
              <div style={{ fontFamily: 'Cinzel, serif', color: phase.color, fontSize: '0.82rem', letterSpacing: 1 }}>
                Phase {phase.phase}
              </div>
              <div style={{ color: '#ddd', fontSize: '0.85rem', marginBottom: 4 }}>{phase.title}</div>
              <div style={{ color: '#666', fontSize: '0.72rem', marginBottom: 8 }}>{phase.timeline}</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${p.pct}%`, height: '100%', background: phase.color,
                  borderRadius: 4, transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>
                {p.complete}/{p.total} complete
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded phase detail */}
      {expandedPhase && (() => {
        const phase = PLAN_PHASES.find(p => p.id === expandedPhase);
        if (!phase) return null;
        return (
          <div style={S.card(phase.color + '44')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: '1.4rem' }}>{phase.icon}</span>
              <div>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: phase.color, fontSize: '1.1rem', margin: 0 }}>
                  Phase {phase.phase}: {phase.title}
                </h3>
                <div style={{ color: '#888', fontSize: '0.82rem', fontStyle: 'italic' }}>{phase.subtitle}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={S.phaseLabel(phase.color)}>{phase.timeline}</span>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              {phase.initiatives.map(init => {
                const currentStatus = getStatus(init.id, init.status);
                const statusCfg = INITIATIVE_STATUS_CONFIG[currentStatus] || INITIATIVE_STATUS_CONFIG['not-started'];
                return (
                  <div key={init.id} style={S.initiativeRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={S.statusDot(statusCfg.color)} />
                        <span style={{ color: '#ddd', fontSize: '0.88rem' }}>{init.name}</span>
                        {init.priority === 'critical' && (
                          <span style={S.badge('rgba(231,76,60,0.2)', '#e74c3c')}>CRITICAL</span>
                        )}
                        {init.priority === 'high' && (
                          <span style={S.badge('rgba(243,156,18,0.2)', '#f39c12')}>HIGH</span>
                        )}
                      </div>
                      <div style={{ color: '#777', fontSize: '0.78rem', marginLeft: 16 }}>{init.description}</div>
                    </div>
                    <select
                      value={currentStatus}
                      onChange={e => setInitiativeStatus(init.id, e.target.value)}
                      style={S.select}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Phase notes */}
            <div style={{ marginTop: 18 }}>
              <div style={{ color: '#888', fontSize: '0.78rem', marginBottom: 6, fontFamily: 'Cinzel, serif' }}>Phase Notes</div>
              <textarea
                style={{ ...S.textarea, minHeight: 70 }}
                value={phaseNotes[phase.id] || ''}
                onChange={e => updatePhaseNote(phase.id, e.target.value)}
                placeholder={`Notes for Phase ${phase.phase}...`}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderRevenue = () => (
    <div>
      {/* Revenue at a glance */}
      <div style={{ ...S.card('rgba(218,165,32,0.25)'), marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: 'rgba(218,165,32,0.9)', fontSize: '1rem', marginBottom: 12 }}>
          Revenue Architecture
        </h3>
        <div style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#ddd' }}>4 subscriptions</strong> (Master Key bundle + 3 individual) +{' '}
          <strong style={{ color: '#ddd' }}>4 one-time purchases</strong> (3 content + 1 bundle) are fully defined in the profile system.
          Toggle infrastructure exists. <span style={{ color: '#e74c3c' }}>Missing: Stripe integration, pricing, and payment processing.</span>
        </div>
      </div>

      {REVENUE_STREAMS.map(stream => (
        <div key={stream.id} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>{stream.icon}</span>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '0.95rem', margin: 0 }}>
              {stream.name}
            </h3>
            <span style={S.phaseLabel(PLAN_PHASES.find(p => p.phase === stream.phase)?.color || '#888')}>
              Phase {stream.phase}
            </span>
          </div>
          <div style={S.grid(300)}>
            {stream.items.map(item => {
              const statusColor = item.status === 'built' ? '#5bd97a' : item.status === 'partial' ? '#d9a55b' : '#d95b5b';
              return (
                <div key={item.id} style={{
                  ...S.card(statusColor + '33'), padding: '14px 16px', marginBottom: 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#ddd', fontSize: '0.88rem' }}>{item.name}</span>
                    <span style={S.badge(statusColor + '22', statusColor)}>
                      {item.status === 'built' ? 'BUILT' : item.status === 'partial' ? 'PARTIAL' : 'NOT BUILT'}
                    </span>
                  </div>
                  <div style={{ color: '#777', fontSize: '0.78rem', marginBottom: 6 }}>{item.description}</div>
                  <div style={{ color: '#d9a55b', fontSize: '0.75rem', fontStyle: 'italic' }}>{item.priceNote}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFeatures = () => {
    const categories = [...new Set(FEATURE_MATRIX.map(f => f.category))];
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(FEATURE_STATUS_CONFIG).map(([key, cfg]) => {
            const count = FEATURE_MATRIX.filter(f => f.status === key).length;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={S.statusDot(cfg.color)} />
                <span style={{ color: cfg.color, fontSize: '0.82rem' }}>{cfg.label}: {count}</span>
              </div>
            );
          })}
        </div>

        {categories.map(cat => {
          const features = FEATURE_MATRIX.filter(f => f.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <h4 style={{
                fontFamily: 'Cinzel, serif', color: '#8a8aa0', fontSize: '0.8rem',
                letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
              }}>
                {cat}
              </h4>
              {features.map(f => {
                const cfg = FEATURE_STATUS_CONFIG[f.status];
                return (
                  <div key={f.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', background: cfg.bg, borderRadius: 6, marginBottom: 4,
                    borderLeft: `3px solid ${cfg.color}`,
                  }}>
                    <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{f.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {f.route !== 'system' && (
                        <span style={{ color: '#555', fontSize: '0.72rem', fontFamily: 'monospace' }}>{f.route}</span>
                      )}
                      <span style={S.badge(cfg.color + '22', cfg.color)}>{cfg.label.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMetrics = () => (
    <div>
      <div style={{ ...S.card('rgba(52,152,219,0.25)'), marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: '#3498db', fontSize: '1rem', marginBottom: 8 }}>
          Key Performance Indicators
        </h3>
        <div style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.7 }}>
          These are the metrics that matter. Several data sources already exist in the codebase
          (coursework tracking, subscriber system, mentor pairing). Revenue metrics require Stripe integration.
        </div>
      </div>

      <div style={S.grid(320)}>
        {KEY_METRICS.map(metric => {
          const phase = PLAN_PHASES.find(p => p.phase === metric.phase);
          return (
            <div key={metric.name} style={{ ...S.card(), padding: '14px 16px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: 1.3 }}>{metric.name}</span>
                <span style={S.phaseLabel(phase?.color || '#888')}>P{metric.phase}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#5bd97a', fontSize: '0.82rem', fontFamily: 'Cinzel, serif' }}>
                  Target: {metric.target}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '0.72rem', marginTop: 4 }}>{metric.source}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRoadmap = () => {
    const filtered = PRODUCT_ROADMAP.filter(p => {
      if (roadmapFilterCat !== 'all' && p.category !== roadmapFilterCat) return false;
      if (roadmapFilterMaturity !== 'all' && p.maturity !== roadmapFilterMaturity) return false;
      return true;
    });

    // Group by category for the lane view
    const grouped = {};
    for (const p of filtered) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    return (
      <div>
        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(MATURITY_CONFIG).map(([key, cfg]) => {
            const count = PRODUCT_ROADMAP.filter(p => p.maturity === key).length;
            return (
              <button
                key={key}
                onClick={() => setRoadmapFilterMaturity(roadmapFilterMaturity === key ? 'all' : key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: roadmapFilterMaturity === key ? cfg.bg : 'none',
                  border: roadmapFilterMaturity === key ? `1px solid ${cfg.color}44` : '1px solid transparent',
                  borderRadius: 6, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <span style={{ ...S.statusDot(cfg.color) }} />
                <span style={{ color: cfg.color, fontSize: '0.82rem', fontFamily: 'inherit' }}>{cfg.label}: {count}</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto' }}>
            <select
              value={roadmapFilterCat}
              onChange={e => setRoadmapFilterCat(e.target.value)}
              style={{ ...S.select, padding: '5px 12px', fontSize: '0.8rem' }}
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products by category */}
        {PRODUCT_CATEGORIES.filter(cat => grouped[cat.id]?.length > 0).map(cat => (
          <div key={cat.id} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              borderBottom: `1px solid ${cat.color}33`, paddingBottom: 8,
            }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: cat.color }} />
              <h3 style={{ fontFamily: 'Cinzel, serif', color: cat.color, fontSize: '0.9rem', margin: 0, letterSpacing: 1 }}>
                {cat.label}
              </h3>
              <span style={{ color: '#555', fontSize: '0.75rem' }}>({grouped[cat.id].length} products)</span>
            </div>

            {grouped[cat.id].map(product => {
              const matCfg = MATURITY_CONFIG[product.maturity];
              const isExpanded = expandedProduct === product.id;
              const totalReleased = product.released.length;
              const totalNext = product.next.length;
              const totalFuture = product.future.length;

              return (
                <div
                  key={product.id}
                  style={{
                    background: isExpanded ? 'rgba(26,26,36,0.9)' : 'rgba(26,26,36,0.5)',
                    border: `1px solid ${isExpanded ? cat.color + '44' : '#2a2a3a'}`,
                    borderRadius: 10, marginBottom: 8, overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Product header (always visible) */}
                  <button
                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    {/* Maturity dot */}
                    <span style={{ ...S.statusDot(matCfg.color), flexShrink: 0 }} />

                    {/* Name & description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#ddd', fontSize: '0.9rem', marginBottom: 2 }}>
                        {product.name}
                        {product.purchaseGate && (
                          <span style={{ ...S.badge('rgba(231,76,60,0.15)', '#e74c3c'), marginLeft: 8, fontSize: '0.65rem' }}>PURCHASE</span>
                        )}
                        {product.subscriptionGate && (
                          <span style={{ ...S.badge('rgba(52,152,219,0.15)', '#3498db'), marginLeft: 8, fontSize: '0.65rem' }}>SUBSCRIPTION</span>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.description}
                      </div>
                    </div>

                    {/* Release counts */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span style={{ ...S.badge('rgba(91,217,122,0.15)', '#5bd97a'), fontSize: '0.7rem' }}>
                        {totalReleased} shipped
                      </span>
                      <span style={{ ...S.badge('rgba(243,156,18,0.15)', '#f39c12'), fontSize: '0.7rem' }}>
                        {totalNext} next
                      </span>
                      <span style={{ ...S.badge('rgba(155,89,182,0.15)', '#9b59b6'), fontSize: '0.7rem' }}>
                        {totalFuture} future
                      </span>
                    </div>

                    {/* Expand arrow */}
                    <span style={{ color: '#555', fontSize: '0.9rem', flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                      &#9654;
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #2a2a3a' }}>
                      {product.route && product.route !== 'system' && (
                        <div style={{ color: '#555', fontSize: '0.72rem', fontFamily: 'monospace', marginTop: 10, marginBottom: 12 }}>
                          Route: {product.route}
                        </div>
                      )}

                      {/* Three columns: Shipped / Next / Future */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 8 }}>
                        {/* Shipped */}
                        <div>
                          <div style={{
                            fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: '#5bd97a',
                            letterSpacing: 1, marginBottom: 10, paddingBottom: 4,
                            borderBottom: '1px solid rgba(91,217,122,0.2)',
                          }}>
                            SHIPPED
                          </div>
                          {product.released.map((item, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6,
                            }}>
                              <span style={{ color: '#5bd97a', fontSize: '0.7rem', marginTop: 2, flexShrink: 0 }}>&#10003;</span>
                              <span style={{ color: '#aaa', fontSize: '0.78rem', lineHeight: 1.4 }}>{item.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Next Release */}
                        <div>
                          <div style={{
                            fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: '#f39c12',
                            letterSpacing: 1, marginBottom: 10, paddingBottom: 4,
                            borderBottom: '1px solid rgba(243,156,18,0.2)',
                          }}>
                            NEXT RELEASE
                          </div>
                          {product.next.map((item, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6,
                            }}>
                              <span style={{ color: '#f39c12', fontSize: '0.65rem', marginTop: 3, flexShrink: 0 }}>&#9679;</span>
                              <span style={{ color: '#999', fontSize: '0.78rem', lineHeight: 1.4 }}>{item.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Future */}
                        <div>
                          <div style={{
                            fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: '#9b59b6',
                            letterSpacing: 1, marginBottom: 10, paddingBottom: 4,
                            borderBottom: '1px solid rgba(155,89,182,0.2)',
                          }}>
                            FUTURE
                          </div>
                          {product.future.map((item, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6,
                            }}>
                              <span style={{ color: '#9b59b6', fontSize: '0.65rem', marginTop: 3, flexShrink: 0 }}>&#9675;</span>
                              <span style={{ color: '#777', fontSize: '0.78rem', lineHeight: 1.4 }}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={S.sectionTitle}>Strategic Vision Notes</h3>
        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 12 }}>
          Living document. Write your vision, priorities, and strategic thinking here. Persists across sessions.
        </p>
        <textarea
          style={{ ...S.textarea, minHeight: 300 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Write your strategic vision here...&#10;&#10;What is Mythouse? What problem does it solve? Who is it for?&#10;What does success look like in 6 months? 1 year? 5 years?&#10;What are the non-negotiable principles?&#10;What are you willing to sacrifice for speed?&#10;Where do you want to be when this is done?"
        />
      </div>

      {/* Content inventory summary */}
      <div style={S.card()}>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '0.95rem', marginBottom: 14 }}>
          Asset Inventory (What You've Built)
        </h3>
        <div style={S.grid(220)}>
          {[
            { label: 'Pages', value: '23', detail: 'Unique routes' },
            { label: 'Data Files', value: '57', detail: 'JSON/JS content' },
            { label: 'API Endpoints', value: '14', detail: 'Serverless functions' },
            { label: 'Journeys', value: '22+', detail: 'Monomyth + planetary + zodiac' },
            { label: 'Courses', value: '7', detail: 'With progress tracking' },
            { label: 'Games', value: '6', detail: 'Ancient board games' },
            { label: 'AI Personas', value: 'Multi', detail: 'Atlas + specialized voices' },
            { label: 'Planet Modes', value: '12+', detail: 'Chronosphaera view modes' },
            { label: 'Subscriptions', value: '4', detail: 'Defined & togglable' },
            { label: 'Purchases', value: '4', detail: 'Defined & togglable' },
            { label: 'Mentor Types', value: 'Multi', detail: 'With pairing system' },
            { label: 'IP Items', value: 'Tracked', detail: 'Filing registry ready' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '10px 12px',
              borderLeft: '2px solid rgba(218,165,32,0.3)',
            }}>
              <div style={{ color: 'rgba(218,165,32,0.9)', fontSize: '1.3rem', fontFamily: 'Cinzel, serif' }}>
                {item.value}
              </div>
              <div style={{ color: '#ccc', fontSize: '0.82rem' }}>{item.label}</div>
              <div style={{ color: '#666', fontSize: '0.7rem' }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.section}>
      <h2 style={S.heading}>STRATEGIC PLAN</h2>
      <p style={S.subtitle}>Vision, sequence, revenue, and the road ahead</p>

      <div style={S.tabRow}>
        {[
          { id: 'vision', label: 'Vision Timeline' },
          { id: 'roadmap', label: 'Product Roadmap' },
          { id: 'revenue', label: 'Revenue Model' },
          { id: 'features', label: 'Feature Matrix' },
          { id: 'metrics', label: 'Key Metrics' },
          { id: 'notes', label: 'Strategic Notes' },
        ].map(tab => (
          <button key={tab.id} style={S.tab(viewMode === tab.id)} onClick={() => setViewMode(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === 'vision' && renderVision()}
      {viewMode === 'roadmap' && renderRoadmap()}
      {viewMode === 'revenue' && renderRevenue()}
      {viewMode === 'features' && renderFeatures()}
      {viewMode === 'metrics' && renderMetrics()}
      {viewMode === 'notes' && renderNotes()}
    </div>
  );
}

const REFRESH_KEY_PROMPT = `Run the full Mythouse diagnostic routine. Here's what to do:

1. **Run the health check script**: \`cd /Users/willlinn/meteor-steel-site-2 && bash scripts/health-check.sh\`
2. **Interpret every FAIL and WARN** — explain what each means and whether it needs fixing.
3. **For each FAIL, fix it** if you can (missing files, syntax errors, bad JSON, build errors). If it requires user action (like adding an API key), tell me what to do.
4. **Check API integrations deeper**:
   - Read \`api/chat.js\` and verify Anthropic/OpenAI SDK usage matches current SDK versions
   - Read \`api/_lib/llm.js\` and verify client factory functions are correct
   - Check that all API endpoints in \`api/\` have proper error handling
5. **Check for stale patterns**:
   - Scan for any unused imports in recently modified files
   - Check that all context providers in App.js are properly nested
   - Verify that all route paths in App.js point to files that exist
   - Check for any broken \`import\` paths
6. **Check subscription/purchase gates**:
   - Verify all gated features (YBR, Fallen Starlight, Story of Stories, Medicine Wheel) properly check purchases/subscriptions
   - Check that gate popups navigate to the correct profile section
7. **Check Firebase rules**: Read \`firestore.rules\` and flag any security concerns
8. **Summary**: Give me a clear report with what's healthy, what you fixed, and what needs my attention.

After the routine, if there are build warnings or deprecation notices, suggest specific fixes.`;

function SystemHealthSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFRESH_KEY_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="admin-section-content" style={{ padding: '32px 24px', maxWidth: 900 }}>
      <h2 style={{ fontFamily: 'Cinzel, serif', color: 'rgba(218,165,32,0.9)', fontSize: '1.4rem', marginBottom: 8 }}>
        System Health &amp; Refresh Key
      </h2>
      <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
        Copy the Refresh Key below and paste it into Claude Code in your terminal. It runs a full diagnostic
        of the site — build, APIs, integrations, gates, data files, and common bugs — then fixes what it can
        and reports what needs your attention.
      </p>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '1rem', margin: 0 }}>
            Refresh Key
          </h3>
          <button
            onClick={handleCopy}
            style={{
              padding: '5px 14px', fontSize: '0.78rem', fontFamily: 'Cinzel, serif',
              background: copied ? 'rgba(80,180,80,0.2)' : 'rgba(218,165,32,0.15)',
              border: `1px solid ${copied ? 'rgba(80,180,80,0.5)' : 'rgba(218,165,32,0.4)'}`,
              borderRadius: 6, color: copied ? '#8f8' : 'rgba(218,165,32,0.9)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(218,165,32,0.2)',
          borderRadius: 8, padding: '16px 18px', fontSize: '0.8rem', lineHeight: 1.6,
          color: '#ccc', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace',
        }}>
          {REFRESH_KEY_PROMPT}
        </pre>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '1rem', marginBottom: 10 }}>
          What It Checks
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {[
            { title: 'Environment Variables', desc: 'Firebase, Anthropic, OpenAI, Google Maps keys' },
            { title: 'Dependencies', desc: 'Outdated packages, vulnerabilities, lock file' },
            { title: 'Build', desc: 'Full npm build — catches syntax & import errors' },
            { title: 'API Endpoints', desc: 'Syntax check all serverless functions' },
            { title: 'External Services', desc: 'Anthropic, OpenAI, YouTube, Wikisource reachability' },
            { title: 'Data Files', desc: 'JSON validation for all data files in src/data/' },
            { title: 'Pages & Routes', desc: 'Verify all page files exist and routes resolve' },
            { title: 'Git Status', desc: 'Branch, uncommitted changes, remote sync' },
            { title: 'Code Quality', desc: 'Console logs, TODOs, duplicate imports' },
            { title: 'Purchase/Sub Gates', desc: 'YBR, Starlight, Medicine Wheel gate integrity' },
            { title: 'Firebase Rules', desc: 'Security review of firestore.rules' },
            { title: 'SDK Versions', desc: 'Anthropic & OpenAI SDK usage vs current API' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'rgba(26,26,36,0.7)', border: '1px solid rgba(218,165,32,0.15)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'rgba(218,165,32,0.8)', marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#999', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(26,26,36,0.5)', border: '1px solid rgba(218,165,32,0.15)', borderRadius: 8, padding: '16px 18px' }}>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: '#ddd', fontSize: '1rem', marginBottom: 8 }}>
          How to Use
        </h3>
        <ol style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Open your terminal and launch Claude Code in the project directory</li>
          <li>Click <strong>Copy to Clipboard</strong> above</li>
          <li>Paste into Claude Code and press Enter</li>
          <li>Claude will run all checks, fix what it can, and report what needs your attention</li>
        </ol>
        <p style={{ color: '#888', fontSize: '0.8rem', marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
          Also available at: scripts/health-check.sh (standalone) and scripts/refresh-key-prompt.md (full prompt)
        </p>
      </div>
    </div>
  );
}

// --- Dev Tools Section ---
const DEV_TOOLS = [
  {
    category: 'Voice & Input',
    items: [
      {
        name: 'Mac Dictation',
        shortcut: 'Fn Fn (double-tap)',
        description: 'System-wide voice-to-text. Speak directly into Terminal / Claude Code.',
        setup: 'System Settings > Keyboard > Dictation > On',
        type: 'system',
      },
    ],
  },
  {
    category: 'Claude Code Slash Commands',
    items: [
      {
        name: '/deploy',
        shortcut: '/deploy',
        description: 'Runs npm build, checks for errors, then deploys to Vercel with --prod.',
        setup: '.claude/commands/deploy.md',
        type: 'slash',
      },
      {
        name: '/dev',
        shortcut: '/dev',
        description: 'Starts the local development server. Runs npm install first if needed.',
        setup: '.claude/commands/dev.md',
        type: 'slash',
      },
      {
        name: '/status',
        shortcut: '/status',
        description: 'Quick git status report: branch, uncommitted changes, last 3 commits.',
        setup: '.claude/commands/status.md',
        type: 'slash',
      },
      {
        name: '/push',
        shortcut: '/push',
        description: 'Stage all changes, draft a commit message, and push (with approval).',
        setup: '.claude/commands/push.md',
        type: 'slash',
      },
    ],
  },
  {
    category: 'Shell Aliases',
    items: [
      { name: 'ms', shortcut: 'ms', description: 'cd ~/meteor-steel-site-2', setup: '~/.zshrc', type: 'alias' },
      { name: 'cc', shortcut: 'cc', description: 'Launch Claude Code', setup: '~/.zshrc', type: 'alias' },
      { name: 'gs', shortcut: 'gs', description: 'git status', setup: '~/.zshrc', type: 'alias' },
      { name: 'gl', shortcut: 'gl', description: 'git log --oneline -10', setup: '~/.zshrc', type: 'alias' },
      { name: 'gd', shortcut: 'gd', description: 'git diff', setup: '~/.zshrc', type: 'alias' },
      { name: 'gp', shortcut: 'gp', description: 'git push', setup: '~/.zshrc', type: 'alias' },
      { name: 'dev', shortcut: 'dev', description: 'cd to project + npm start', setup: '~/.zshrc', type: 'alias' },
    ],
  },
  {
    category: 'Terminal Tools',
    items: [
      {
        name: 'nvm (Node Version Manager)',
        shortcut: 'nvm use / nvm install',
        description: 'Pins Node.js version per project via .nvmrc. Auto-switches on cd.',
        setup: '~/.nvm + .nvmrc (Node 24)',
        type: 'tool',
      },
      {
        name: 'tmux',
        shortcut: 'mux',
        description: 'Split-pane terminal session. Claude on left, free terminal on right.',
        setup: 'brew install tmux (pending Homebrew install)',
        type: 'tool',
      },
    ],
  },
];

const TYPE_COLORS = {
  system: '#5b8dd9',
  slash: '#c4713a',
  alias: '#5bd97a',
  tool: '#d9a55b',
};

function DevToolsSection() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 900 }}>
      <h2 style={{ color: '#e8d5b5', letterSpacing: 2, fontSize: '1.1rem', marginBottom: 8 }}>
        DEV TOOLS & WORKFLOW
      </h2>
      <p style={{ color: '#6a6a7a', fontSize: '0.85rem', marginBottom: 32 }}>
        Terminal shortcuts, Claude Code commands, and workflow tools configured for this project.
      </p>

      {DEV_TOOLS.map(cat => (
        <div key={cat.category} style={{ marginBottom: 32 }}>
          <h3 style={{
            color: '#8a8aa0', fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase',
            borderBottom: '1px solid #2a2a3a', paddingBottom: 8, marginBottom: 12,
          }}>
            {cat.category}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cat.items.map(item => (
              <div key={item.name} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                background: '#14141c', borderRadius: 6, padding: '12px 16px',
                border: '1px solid #2a2a3a',
              }}>
                <code style={{
                  color: TYPE_COLORS[item.type] || '#d4d4d4',
                  background: '#1a1a24', padding: '3px 10px', borderRadius: 4,
                  fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'nowrap',
                  minWidth: 100, textAlign: 'center', flexShrink: 0,
                }}>
                  {item.shortcut}
                </code>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#d4d4d4', fontSize: '0.9rem', marginBottom: 2 }}>
                    {item.name}
                  </div>
                  <div style={{ color: '#6a6a7a', fontSize: '0.8rem' }}>
                    {item.description}
                  </div>
                </div>
                <span style={{
                  color: '#4a4a5a', fontSize: '0.7rem', fontFamily: 'monospace',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {item.setup}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 40, padding: 16, background: '#111118', borderRadius: 6,
        border: '1px solid #2a2a3a',
      }}>
        <h4 style={{ color: '#8a8aa0', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 8 }}>
          LEGEND
        </h4>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block',
              }} />
              <span style={{ color: '#6a6a7a', textTransform: 'capitalize' }}>{type}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const [activeSection, setActiveSection] = useState('plan');

  return (
    <div className="admin-page">
      <div className="admin-section-tabs">
        {SECTIONS.map(s =>
          s.href ? (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-section-tab"
              style={{ textDecoration: 'none' }}
            >
              {s.label}
            </a>
          ) : (
            <button
              key={s.id}
              className={`admin-section-tab ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          )
        )}
      </div>

      {activeSection === 'plan' && <StrategicPlanSection />}
      {activeSection === 'system-health' && <SystemHealthSection />}
      {activeSection === 'campaigns' && <CampaignManagerSection />}
      {activeSection === 'coursework' && <CourseworkManagerSection />}
      {activeSection === '360-media' && <Media360Section />}
      {activeSection === 'subscribers' && <SubscribersSection />}
      {activeSection === 'mentors' && <MentorManagerSection />}
      {activeSection === 'contacts' && (
        <Suspense fallback={<div className="contacts-loading">Loading Contacts...</div>}>
          <ContactsPage />
        </Suspense>
      )}
      {activeSection === 'services' && <ServicesSection />}
      {activeSection === 'ip-registry' && <IPRegistrySection />}
      {activeSection === 'legal' && <LegalSection />}
      {activeSection === 'dev-tools' && <DevToolsSection />}
    </div>
  );
}

export default AdminPage;
