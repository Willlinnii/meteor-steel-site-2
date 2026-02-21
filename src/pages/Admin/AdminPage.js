import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { COURSES, checkRequirement, requirementProgress } from '../../coursework/courseEngine';

import campaignData from '../../data/campaigns/mythicYear.json';
import './AdminPage.css';

const ContactsPage = lazy(() => import('./ContactsPage'));

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
  { id: 'campaigns', label: 'Campaign Manager' },
  { id: 'coursework', label: 'Coursework' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'services', label: 'Services' },
  { id: 'ip-registry', label: 'IP Registry' },
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
  {
    name: 'Firebase',
    url: 'https://firebase.google.com',
    category: 'Database / Auth / Storage',
    usedFor: 'User auth, Firestore DB, file storage',
    paid: 'Free tier',
    status: 'Active',
    envVars: ['REACT_APP_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_PROJECT_ID'],
  },
  {
    name: 'Anthropic Claude',
    url: 'https://console.anthropic.com',
    category: 'AI / LLM',
    usedFor: 'Atlas chat, mentor review',
    paid: 'Paid',
    status: 'Active',
    envVars: ['ANTHROPIC_API_KEY'],
  },
  {
    name: 'OpenAI',
    url: 'https://platform.openai.com',
    category: 'AI / LLM',
    usedFor: 'Persona voices',
    paid: 'Paid',
    status: 'Active',
    envVars: ['OPENAI_API_KEY'],
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    category: 'Hosting',
    usedFor: 'Frontend + serverless API hosting',
    paid: 'Free tier',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'Google OAuth',
    url: 'https://console.cloud.google.com',
    category: 'Authentication',
    usedFor: 'Google sign-in',
    paid: 'Free',
    status: 'Active',
    envVars: ['REACT_APP_FIREBASE_AUTH_DOMAIN'],
  },
  {
    name: 'Google Maps',
    url: 'https://console.cloud.google.com/google/maps-apis/home?project=mythouse-site',
    category: 'Mapping / 360 VR',
    usedFor: 'Street View 360 panoramas on Mythic Earth sites, Maps Embed API',
    paid: 'Free tier',
    status: 'Active',
    envVars: ['REACT_APP_GOOGLE_MAPS_API_KEY'],
  },
  {
    name: 'Cesium.js',
    url: 'https://cesium.com',
    category: '3D Mapping',
    usedFor: 'Mythic Earth globe',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: ['REACT_APP_CESIUM_TOKEN'],
  },
  {
    name: 'Three.js',
    url: 'https://threejs.org',
    category: '3D Graphics',
    usedFor: 'Orbital diagrams, VR scenes',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'ArcGIS',
    url: 'https://arcgis.com',
    category: 'Satellite Imagery',
    usedFor: 'Globe imagery tiles',
    paid: 'Free tier',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'Astronomy Engine',
    url: 'https://github.com/cosinekitty/astronomy',
    category: 'Calculations',
    usedFor: 'Planetary positions, moon phases',
    paid: 'Free (OSS)',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'Wikisource',
    url: 'https://wikisource.org',
    category: 'Text API',
    usedFor: 'Sacred/classic text access',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'Hostinger',
    url: 'https://hostinger.com',
    category: 'Domain / DNS',
    usedFor: 'Domain registration & DNS management',
    paid: 'Paid',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com',
    category: 'Video',
    usedFor: 'Mythology Channel playlists, embedded video content',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'SoundCloud',
    url: 'https://soundcloud.com',
    category: 'Audio',
    usedFor: 'Embedded music on Fallen Starlight page',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'Open Library',
    url: 'https://openlibrary.org',
    category: 'Book Data',
    usedFor: 'Book search, covers, and metadata for Library',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
    name: 'WorldTimeAPI',
    url: 'https://worldtimeapi.org',
    category: 'Utilities',
    usedFor: 'Timezone detection for orbital diagrams',
    paid: 'Free',
    status: 'Active',
    envVars: [],
  },
  {
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

function ServicesSection() {
  return (
    <div className="admin-services">
      <h2 className="admin-services-title">SERVICES &amp; INTEGRATIONS</h2>
      <p className="admin-services-subtitle">
        External subscriptions, APIs, and third-party tools used by the site.
      </p>
      <div className="admin-services-grid">
        {SERVICES.map(svc => (
          <div key={svc.name} className="admin-service-card">
            <div className="admin-service-header">
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-service-name"
              >
                {svc.name}
              </a>
              <span
                className="admin-service-status"
                style={{ color: SERVICE_STATUS_COLORS[svc.status] || '#6a6a7a', borderColor: SERVICE_STATUS_COLORS[svc.status] || '#6a6a7a' }}
              >
                {svc.status}
              </span>
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
          </div>
        ))}
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
  { id: 'seven-metals', category: 'data-compilations', name: 'Seven Metals System', description: 'Original data compilation — planetary metals, correspondences, mythology across 13 data files', type: 'copyright', source: ['src/data/metals/', 'src/pages/SevenMetals/'], status: 'unregistered', protection: 'high', year: 2024 },
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
  { id: 'numerology-engine', category: 'algorithms', name: 'Numerology Engine', description: 'Original algorithm — Pythagorean and Chaldean numerology calculations', type: 'trade-secret', source: ['src/pages/SevenMetals/'], status: 'unregistered', protection: 'low', year: 2024 },
  { id: 'natal-chart', category: 'algorithms', name: 'Natal Chart Calculator', description: 'Original algorithm — astronomical position calculations for birth chart generation', type: 'trade-secret', source: ['src/pages/SevenMetals/'], status: 'unregistered', protection: 'low', year: 2024 },
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

function IPRegistrySection() {
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [viewMode, setViewMode] = useState('registry'); // 'registry' | 'inventory' | 'filings'
  const [copied, setCopied] = useState(false);
  const [expandedFiling, setExpandedFiling] = useState({});

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

function AdminPage() {
  const [activeSection, setActiveSection] = useState('campaigns');

  return (
    <div className="admin-page">
      <div className="admin-section-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`admin-section-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'campaigns' && <CampaignManagerSection />}
      {activeSection === 'coursework' && <CourseworkManagerSection />}
      {activeSection === 'subscribers' && <SubscribersSection />}
      {activeSection === 'mentors' && <MentorManagerSection />}
      {activeSection === 'contacts' && (
        <Suspense fallback={<div className="contacts-loading">Loading Contacts...</div>}>
          <ContactsPage />
        </Suspense>
      )}
      {activeSection === 'services' && <ServicesSection />}
      {activeSection === 'ip-registry' && <IPRegistrySection />}
    </div>
  );
}

export default AdminPage;
