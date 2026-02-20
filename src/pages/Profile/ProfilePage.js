import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useWritings } from '../../writings/WritingsContext';
import { useProfile } from '../../profile/ProfileContext';
import { RANKS, rankProgress } from '../../profile/profileEngine';
import ProfileChat from '../../profile/ProfileChat';

export default function ProfilePage() {
  const { user } = useAuth();
  const { getCourseStates, completedCourses, allCourses } = useCoursework();
  const { earnedRanks, highestRank, activeCredentials, hasProfile, loaded: profileLoaded } = useProfile();
  const { personalStories, loaded: writingsLoaded } = useWritings();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

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
