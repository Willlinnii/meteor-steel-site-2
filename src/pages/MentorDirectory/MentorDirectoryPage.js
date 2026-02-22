import React, { useState, useCallback } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { canRequestMentor } from '../../profile/mentorPairingEngine';
import { useMentorDirectory, FILTER_TABS } from '../Guild/useMentorDirectory';
import { usePageTracking } from '../../coursework/CourseworkContext';

export default function MentorDirectoryPage() {
  const { user } = useAuth();
  const { mentorPairings, requestMentor } = useProfile();
  const { mentors: filteredMentors, loading, activeFilter, setActiveFilter, hasMore, loadMore } = useMentorDirectory();
  const { track } = usePageTracking('mentor-directory');
  const [requestingMentor, setRequestingMentor] = useState(null); // uid of mentor being requested
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (mentorUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestMentor(mentorUid, requestMessage.trim() || null);
      track('request');
      setRequestingMentor(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
    setSubmitting(false);
  }, [requestMentor, requestMessage, submitting]);

  if (loading) {
    return (
      <div className="mentor-directory-page">
        <div className="profile-empty">Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="mentor-directory-page">
      {/* Filter tabs */}
      <div className="mentor-directory-filters">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`mentor-filter-tab${activeFilter === tab.id ? ' active' : ''}`}
            onClick={() => { setActiveFilter(tab.id); track(`filter.${tab.id}`); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mentor grid */}
      {filteredMentors.length === 0 ? (
        <div className="profile-empty">
          {activeFilter === 'all'
            ? 'No mentors are currently available.'
            : `No ${FILTER_TABS.find(t => t.id === activeFilter)?.label || ''} mentors are currently available.`}
        </div>
      ) : (
        <div className="mentor-directory-grid">
          {filteredMentors.map(mentor => {
            const canRequest = user && mentor.uid !== user.uid && canRequestMentor(mentorPairings, mentor.uid) && (mentor.availableSlots || 0) > 0;
            const existingPairing = mentorPairings.find(p => p.mentorUid === mentor.uid && (p.status === 'pending' || p.status === 'accepted'));
            const isSelf = user && mentor.uid === user.uid;

            return (
              <div key={mentor.id} className="mentor-card">
                <div className="mentor-card-header">
                  <span className="mentor-card-icon">{mentor.mentorIcon}</span>
                  <div>
                    <div className="mentor-card-title">{mentor.mentorTitle}</div>
                    {mentor.handle && <div className="mentor-card-handle">@{mentor.handle}</div>}
                  </div>
                  <span className="mentor-card-credential">
                    L{mentor.credentialLevel} {mentor.credentialName}
                  </span>
                </div>

                {mentor.bio && (
                  <div className="mentor-card-bio">{mentor.bio}</div>
                )}

                <div className="mentor-card-slots">
                  {(mentor.availableSlots || 0) > 0
                    ? `${mentor.availableSlots} slot${mentor.availableSlots === 1 ? '' : 's'} available`
                    : 'No slots available'}
                </div>

                {/* Request button or status */}
                {!isSelf && (
                  <div className="mentor-card-actions">
                    {requestingMentor === mentor.uid ? (
                      <div className="mentor-card-request-form">
                        <textarea
                          className="mentor-request-textarea"
                          placeholder="Optional: introduce yourself or share why you'd like this mentor..."
                          value={requestMessage}
                          onChange={e => setRequestMessage(e.target.value)}
                          maxLength={500}
                          rows={3}
                        />
                        <div className="mentor-request-form-actions">
                          <button
                            className="mentor-card-request-btn"
                            disabled={submitting}
                            onClick={() => handleRequest(mentor.uid)}
                          >
                            {submitting ? 'Sending...' : 'Send Request'}
                          </button>
                          <button
                            className="mentor-card-cancel-btn"
                            onClick={() => { setRequestingMentor(null); setRequestMessage(''); setError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                        {error && <div className="mentor-request-error">{error}</div>}
                      </div>
                    ) : existingPairing ? (
                      <span className="mentor-card-paired-label">
                        {existingPairing.status === 'accepted' ? 'Active Mentorship' : 'Request Pending'}
                      </span>
                    ) : canRequest ? (
                      <button
                        className="mentor-card-request-btn"
                        onClick={() => { setRequestingMentor(mentor.uid); setError(null); }}
                      >
                        Request Mentor
                      </button>
                    ) : (mentor.availableSlots || 0) <= 0 ? (
                      <button className="mentor-card-request-btn" disabled>Full</button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {hasMore && (
        <button className="guild-load-more" onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
