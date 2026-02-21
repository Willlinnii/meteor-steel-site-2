import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useWritings } from '../../writings/WritingsContext';
import { useProfile } from '../../profile/ProfileContext';
import { RANKS, rankProgress } from '../../profile/profileEngine';
import ProfileChat from '../../profile/ProfileChat';
import { checkAvailability, registerHandle } from '../../multiplayer/handleService';

const SUBSCRIPTIONS = [
  {
    id: 'ybr', name: 'Yellow Brick Road',
    icon: (
      <svg viewBox="0 0 20 14" width="20" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M1,4 L7,1 L19,1 L13,4 Z" />
        <path d="M1,4 L1,13 L13,13 L13,4" />
        <path d="M13,4 L19,1 L19,10 L13,13" />
        <line x1="7" y1="4" x2="7" y2="13" />
        <line x1="1" y1="8.5" x2="13" y2="8.5" />
        <line x1="4" y1="8.5" x2="4" y2="13" />
        <line x1="10" y1="4" x2="10" y2="8.5" />
      </svg>
    ),
    description: 'Interactive journey through the monomyth stages with Atlas as your guide.',
    details: 'The Yellow Brick Road is a guided, stage-by-stage journey through the monomyth. Atlas walks alongside you as you encounter mythic figures at each threshold \u2014 gods, tricksters, mentors, and shadow guardians drawn from world mythology. Answer their challenges through conversation to advance along the path.',
  },
  {
    id: 'forge', name: 'Story Forge',
    icon: (
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10,2 L10,11" />
        <path d="M7,5 Q10,3 13,5" />
        <path d="M6,11 L14,11" />
        <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
      </svg>
    ),
    description: 'Write your own story using mythic structure with AI collaboration.',
    details: 'The Story Forge lets you craft your own personal myth using the eight stages of the monomyth as a framework. Write freely at each stage while an AI collaborator helps you develop themes, deepen character arcs, and weave in mythic resonance. Your stories are saved to your profile and can be revisited anytime.',
  },
  {
    id: 'coursework', name: 'Coursework',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12 L12 6 L22 12 L12 18 Z" />
        <path d="M6 14 L6 19 C6 19 9 22 12 22 C15 22 18 19 18 19 L18 14" />
        <line x1="22" y1="12" x2="22" y2="18" />
      </svg>
    ),
    description: 'Track your progress through courses, earn ranks and certificates.',
    details: 'Coursework tracks your exploration across the site and awards progress toward structured courses. Visit pages, interact with content, and complete activities to fill requirements. Finish courses to earn ranks and certificates displayed on your profile.',
  },
  {
    id: 'xr', name: 'VR / XR',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="7" width="22" height="11" rx="3" />
        <circle cx="8" cy="12.5" r="2.5" />
        <circle cx="16" cy="12.5" r="2.5" />
        <path d="M10.5 12.5 Q12 15 13.5 12.5" />
      </svg>
    ),
    description: 'Immersive 3D and extended reality views of the celestial wheels.',
    details: 'Enter the Chronosphaera in full 3D. Orbit through the planetary wheels, walk among constellations, and view the celestial machinery from within. Supports WebXR headsets for a fully immersive experience, or explore in 3D right in your browser.',
  },
];

const PURCHASES = [
  {
    id: 'starlight', name: 'Fallen Starlight',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M12 6 L10.8 9.2 L7.5 9.2 L10.1 11.3 L9.1 14.5 L12 12.5 L14.9 14.5 L13.9 11.3 L16.5 9.2 L13.2 9.2 Z" fill="currentColor" stroke="none" />
      </svg>
    ),
    description: 'Unlock Fallen Starlight and Story of Stories on the Chronosphaera.',
    details: 'Fallen Starlight overlays a mythic narrative layer onto the Chronosphaera \u2014 tracing the descent of celestial fire through the seven planetary metals. Toggle between Fallen Starlight and Story of Stories to explore the cosmic drama from two perspectives: the fall of light into matter, and the stories that emerged from it.',
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { getCourseStates, completedCourses, allCourses } = useCoursework();
  const { earnedRanks, highestRank, activeCredentials, hasProfile, loaded: profileLoaded, handle, natalChart, subscriptions, updateSubscription, purchases, updatePurchase, refreshProfile } = useProfile();
  const { personalStories, loaded: writingsLoaded } = useWritings();
  const navigate = useNavigate();
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); // 'ybr' | 'forge' | etc.

  // Scroll to #subscriptions or #purchases when navigated with hash
  useEffect(() => {
    if (location.hash === '#subscriptions' || location.hash === '#purchases') {
      const id = location.hash.slice(1);
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);
  const [handleInput, setHandleInput] = useState('');
  const [handleStatus, setHandleStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'error'
  const [handleSaving, setHandleSaving] = useState(false);
  const [showHandleEdit, setShowHandleEdit] = useState(false);

  const checkHandle = useCallback(async (value) => {
    if (!value || value.length < 3) { setHandleStatus(null); return; }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(value)) { setHandleStatus('format'); return; }
    setHandleStatus('checking');
    try {
      const available = await checkAvailability(value);
      setHandleStatus(available ? 'available' : 'taken');
    } catch (err) {
      console.error('Handle availability check failed:', err);
      setHandleStatus('check-error');
    }
  }, []);

  const saveHandle = useCallback(async () => {
    if (handleStatus !== 'available' || handleSaving) return;
    setHandleSaving(true);
    try {
      await registerHandle(handleInput);
      await refreshProfile();
      setShowHandleEdit(false);
      setHandleInput('');
      setHandleStatus(null);
    } catch (err) {
      console.error('Handle registration failed:', err);
      setHandleStatus('save-error');
    }
    setHandleSaving(false);
  }, [handleInput, handleStatus, handleSaving, refreshProfile]);

  const courseStates = getCourseStates();
  const activeCourses = courseStates.filter(c => c.active);

  // Separate completed, in-progress, and not-started
  const completed = activeCourses.filter(c => c.completed);
  const inProgress = activeCourses.filter(c => !c.completed && c.progress > 0);
  const notStarted = activeCourses.filter(c => !c.completed && c.progress === 0);

  // Build certificates list from completedCourses set
  const certificates = allCourses.filter(c => completedCourses.has(c.id));

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Traveler';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      {/* Profile Header — with highest rank */}
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-name">{displayName}</div>
        {highestRank && (
          <div className="profile-rank-title">
            {highestRank.icon} {highestRank.name}
          </div>
        )}
        <div className="profile-email">{user?.email}</div>
        {/* Handle Section */}
        {handle && !showHandleEdit ? (
          <div className="profile-handle">
            <span className="profile-handle-at">@{handle}</span>
            <button className="profile-handle-edit-btn" onClick={() => { setShowHandleEdit(true); setHandleInput(handle); }}>Change</button>
          </div>
        ) : (
          <div className="profile-handle-setup">
            {!handle && <div className="profile-handle-prompt">Set a handle for multiplayer</div>}
            <div className="profile-handle-form">
              <input
                className="profile-handle-input"
                type="text"
                placeholder="Choose a handle..."
                value={handleInput}
                maxLength={20}
                onChange={e => {
                  const v = e.target.value;
                  setHandleInput(v);
                  checkHandle(v);
                }}
              />
              <button
                className="profile-handle-save-btn"
                disabled={handleStatus !== 'available' || handleSaving}
                onClick={saveHandle}
              >
                {handleSaving ? 'Saving...' : 'Save'}
              </button>
              {showHandleEdit && (
                <button className="profile-handle-cancel-btn" onClick={() => { setShowHandleEdit(false); setHandleInput(''); setHandleStatus(null); }}>Cancel</button>
              )}
            </div>
            {handleStatus === 'checking' && <div className="profile-handle-status">Checking...</div>}
            {handleStatus === 'available' && <div className="profile-handle-status available">Available</div>}
            {handleStatus === 'taken' && <div className="profile-handle-status taken">Already taken</div>}
            {handleStatus === 'format' && <div className="profile-handle-status error">3-20 chars, letters/numbers/_/- only</div>}
            {handleStatus === 'check-error' && <div className="profile-handle-status error">Could not check availability — check console</div>}
            {handleStatus === 'save-error' && <div className="profile-handle-status error">Failed to save handle — check console</div>}
          </div>
        )}
      </div>

      {/* Membership Add-Ons */}
      <h2 className="profile-section-title">Membership Add-Ons</h2>

      {/* Subscriptions Sub-Section */}
      <div id="subscriptions">
        <h3 className="profile-subsection-title">Subscriptions</h3>
        <div className="profile-subscription-list">
          {SUBSCRIPTIONS.map(sub => {
            const enabled = !!subscriptions[sub.id];
            const expanded = expandedCard === sub.id;
            return (
              <div key={sub.id} className={`profile-subscription-card${enabled ? ' active' : ''}${expanded ? ' expanded' : ''}`}>
                <div className="profile-subscription-row" onClick={() => setExpandedCard(expanded ? null : sub.id)}>
                  <span className="profile-subscription-icon">{sub.icon}</span>
                  <div className="profile-subscription-info">
                    <div className="profile-subscription-name">{sub.name}</div>
                    <div className="profile-subscription-desc">{sub.description}</div>
                  </div>
                  <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => updateSubscription(sub.id, !enabled)}
                    />
                    <span className="profile-subscription-slider" />
                  </label>
                </div>
                {expanded && (
                  <div className="profile-subscription-details">
                    {sub.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchases Sub-Section */}
      <div id="purchases">
        <h3 className="profile-subsection-title">Purchases</h3>
        <div className="profile-subscription-list">
          {PURCHASES.map(p => {
            const enabled = !!purchases[p.id];
            const expanded = expandedCard === p.id;
            return (
              <div key={p.id} className={`profile-subscription-card${enabled ? ' active' : ''}${expanded ? ' expanded' : ''}`}>
                <div className="profile-subscription-row" onClick={() => setExpandedCard(expanded ? null : p.id)}>
                  <span className="profile-subscription-icon">{p.icon}</span>
                  <div className="profile-subscription-info">
                    <div className="profile-subscription-name">{p.name}</div>
                    <div className="profile-subscription-desc">{p.description}</div>
                  </div>
                  <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => updatePurchase(p.id, !enabled)}
                    />
                    <span className="profile-subscription-slider" />
                  </label>
                </div>
                {expanded && (
                  <div className="profile-subscription-details">
                    {p.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Credentials Section */}
      <h2 className="profile-section-title">Credentials</h2>
      {!profileLoaded && (
        <div className="profile-empty">Loading credentials...</div>
      )}
      {profileLoaded && (showChat || !hasProfile) && (
        <ProfileChat onComplete={() => setShowChat(false)} isUpdate={hasProfile} />
      )}
      {profileLoaded && hasProfile && !showChat && (
        <>
          <div className="profile-credential-list">
            {activeCredentials.map(cred => (
              <div key={cred.category} className="profile-credential-card">
                <span className="profile-credential-icon">{cred.display.icon}</span>
                <div className="profile-credential-info">
                  <div className="profile-credential-name">{cred.display.name}</div>
                  {cred.details && (
                    <div className="profile-credential-details">{cred.details}</div>
                  )}
                </div>
                <span className="profile-credential-level">L{cred.level}</span>
              </div>
            ))}
          </div>
          <button className="profile-update-btn" onClick={() => setShowChat(true)}>
            Update Credentials
          </button>
        </>
      )}

      {/* Natal Chart Section */}
      <h2 className="profile-section-title">Natal Chart</h2>
      {natalChart ? (
        <NatalChartDisplay chart={natalChart} />
      ) : (
        <div className="profile-empty">No natal chart yet. Atlas can compute yours during a profile conversation.</div>
      )}

      {/* Ranks Section */}
      <h2 className="profile-section-title">Ranks</h2>
      <div className="profile-rank-list">
        {RANKS.map(rank => {
          const earned = earnedRanks.some(r => r.id === rank.id);
          const progress = rankProgress(rank, completedCourses);
          const pct = Math.round(progress.fraction * 100);
          const courseNames = rank.requiredCourses.map(id => {
            const course = allCourses.find(c => c.id === id);
            return course ? course.name : id;
          });

          return (
            <div key={rank.id} className={`profile-rank-card${earned ? ' earned' : ''}`}>
              <span className="profile-rank-icon">{rank.icon}</span>
              <div className="profile-rank-info">
                <div className="profile-rank-name">{rank.name}</div>
                <div className="profile-rank-courses">
                  {earned ? 'Earned' : `${progress.completed}/${progress.total} courses`} — {courseNames.join(', ')}
                </div>
                {!earned && (
                  <div className="profile-rank-progress">
                    <div className="profile-progress-bar">
                      <div className="profile-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Courses */}
      <h2 className="profile-section-title">Courses</h2>
      {activeCourses.length === 0 ? (
        <div className="profile-empty">No courses are currently active.</div>
      ) : (
        <div className="profile-course-list">
          {/* In-progress courses first */}
          {inProgress.map(course => (
            <CourseCard key={course.id} course={course} status="in-progress" />
          ))}
          {/* Completed courses */}
          {completed.map(course => (
            <CourseCard key={course.id} course={course} status="completed" />
          ))}
          {/* Not started */}
          {notStarted.map(course => (
            <CourseCard key={course.id} course={course} status="not-started" />
          ))}
        </div>
      )}

      {/* My Stories */}
      <h2 className="profile-section-title">My Stories</h2>
      {writingsLoaded && (() => {
        const stories = personalStories?.stories || {};
        const storyEntries = Object.entries(stories).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
        if (storyEntries.length === 0) {
          return (
            <div className="profile-empty">
              No personal stories yet. Visit the <button className="profile-update-btn" style={{ display: 'inline', padding: '4px 12px', fontSize: '0.85em' }} onClick={() => navigate('/story-forge')}>Story Forge</button> to begin.
            </div>
          );
        }
        return (
          <div className="profile-course-list">
            {storyEntries.map(([id, story]) => {
              const stageCount = Object.values(story.stages || {}).filter(st => st.entries?.length > 0).length;
              return (
                <div key={id} className="profile-course-card" onClick={() => navigate('/story-forge')} style={{ cursor: 'pointer' }}>
                  <div className="profile-course-header">
                    <span className="profile-course-name">{story.name || 'Untitled Story'}</span>
                    <span className="profile-course-badge in-progress">
                      {stageCount}/8 stages
                    </span>
                  </div>
                  <div className="profile-course-desc">
                    {story.source === 'atlas-interview' ? 'Atlas Interview' : 'Manual'} {'\u00B7'} {story.updatedAt ? new Date(story.updatedAt).toLocaleDateString() : ''}
                  </div>
                  <div className="profile-progress-bar">
                    <div className="profile-progress-fill" style={{ width: `${Math.round((stageCount / 8) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Certificates */}
      <h2 className="profile-section-title">Certificates</h2>
      {certificates.length === 0 ? (
        <div className="profile-empty">
          Complete a course to earn your first certificate.
        </div>
      ) : (
        <div className="profile-cert-list">
          {certificates.map(course => (
            <div key={course.id} className="profile-cert-card">
              <span className="profile-cert-icon">{'\u2728'}</span>
              <div className="profile-cert-info">
                <div className="profile-cert-name">{course.name}</div>
                <div className="profile-cert-date">Certificate earned</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, status }) {
  const pct = Math.round(course.progress * 100);

  return (
    <div className={`profile-course-card${status === 'completed' ? ' completed' : ''}`}>
      <div className="profile-course-header">
        <span className="profile-course-name">{course.name}</span>
        <span className={`profile-course-badge ${status}`}>
          {status === 'completed' ? 'Completed' : status === 'in-progress' ? `${pct}%` : 'Not Started'}
        </span>
      </div>
      <div className="profile-course-desc">{course.description}</div>

      {status !== 'completed' && (
        <>
          <div className="profile-progress-bar">
            <div
              className="profile-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="profile-progress-text">{pct}% complete</div>
        </>
      )}

      {status === 'completed' && (
        <div className="profile-progress-bar">
          <div className="profile-progress-fill complete" style={{ width: '100%' }} />
        </div>
      )}

      {/* Requirements breakdown */}
      <ul className="profile-req-list">
        {course.requirements.map(req => {
          const isComplete = !course.incompleteRequirements.find(r => r.id === req.id);
          const incomplete = course.incompleteRequirements.find(r => r.id === req.id);
          return (
            <li key={req.id} className={`profile-req-item${isComplete ? ' done' : ''}`}>
              {req.description}
              {!isComplete && incomplete && (
                <span className="profile-req-progress">
                  ({Math.round(incomplete.progress * 100)}%)
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const PLANET_SYMBOLS = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640',
  Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644',
};

const PLANET_METALS = {
  Sun: 'Gold', Moon: 'Silver', Mercury: 'Quicksilver', Venus: 'Copper',
  Mars: 'Iron', Jupiter: 'Tin', Saturn: 'Lead',
};

function NatalChartDisplay({ chart }) {
  const sun = chart.planets?.find(p => p.name === 'Sun');
  const moon = chart.planets?.find(p => p.name === 'Moon');
  const asc = chart.ascendant;

  return (
    <div className="natal-chart-display">
      {/* Big Three */}
      <div className="natal-big-three">
        {sun && (
          <div className="natal-big-three-card">
            <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[sun.sign] || ''}</div>
            <div className="natal-big-three-label">Sun</div>
            <div className="natal-big-three-sign">{sun.sign}</div>
            <div className="natal-big-three-degree">{sun.degree}\u00B0</div>
          </div>
        )}
        {moon && (
          <div className="natal-big-three-card">
            <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[moon.sign] || ''}</div>
            <div className="natal-big-three-label">Moon</div>
            <div className="natal-big-three-sign">{moon.sign}</div>
            <div className="natal-big-three-degree">{moon.degree}\u00B0</div>
          </div>
        )}
        {asc ? (
          <div className="natal-big-three-card">
            <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[asc.sign] || ''}</div>
            <div className="natal-big-three-label">Rising</div>
            <div className="natal-big-three-sign">{asc.sign}</div>
            <div className="natal-big-three-degree">{asc.degree}\u00B0</div>
          </div>
        ) : (
          <div className="natal-big-three-card natal-big-three-unknown">
            <div className="natal-big-three-symbol">?</div>
            <div className="natal-big-three-label">Rising</div>
            <div className="natal-big-three-sign">Unknown</div>
            <div className="natal-big-three-degree">&mdash;</div>
          </div>
        )}
      </div>

      {/* Planet positions */}
      <div className="natal-planets-grid">
        {chart.planets?.map(p => (
          <div key={p.name} className="natal-planet-row">
            <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span>
            <span className="natal-planet-name">{p.name}</span>
            <span className="natal-planet-metal">{PLANET_METALS[p.name]}</span>
            <span className="natal-planet-sign">{ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}\u00B0</span>
            <span className="natal-planet-house">{p.house ? `House ${p.house}` : '\u2014'}</span>
          </div>
        ))}
      </div>

      {/* Chinese Zodiac */}
      {chart.chinese && (
        <div className="natal-chinese">
          {chart.chinese.element} {chart.chinese.animal}
        </div>
      )}

      {/* Time missing note */}
      {chart.timeMissing && (
        <div className="natal-time-note">
          Ascendant, Midheaven, and house placements require birth time.
        </div>
      )}
    </div>
  );
}
