import React, { useState, useCallback } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { canRequestMentor } from '../../profile/mentorPairingEngine';
import { canRequestConsulting } from '../../profile/consultingEngine';
import { useMentorDirectory, FILTER_TABS } from './useMentorDirectory';

const CRED_LEVEL_NAMES = {
  1: 'Initiate', 2: 'Adept', 3: 'Master', 4: 'Grand Master', 5: 'Archon',
};

export default function GuildDirectory() {
  const { user } = useAuth();
  const { mentorPairings, requestMentor, consultingRequests, requestConsulting } = useProfile();
  const { mentors: filteredMentors, loading, activeFilter, setActiveFilter, hasMore, loadMore } = useMentorDirectory();
  const [expandedCard, setExpandedCard] = useState(null);
  const [requestingMentor, setRequestingMentor] = useState(null);
  const [requestingConsulting, setRequestingConsulting] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleMentorRequest = useCallback(async (mentorUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestMentor(mentorUid, requestMessage.trim() || null);
      setRequestingMentor(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
    setSubmitting(false);
  }, [requestMentor, requestMessage, submitting]);

  const handleConsultingRequest = useCallback(async (consultantUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestConsulting(consultantUid, null, requestMessage.trim() || null);
      setRequestingConsulting(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send consulting request');
    }
    setSubmitting(false);
  }, [requestConsulting, requestMessage, submitting]);

  if (loading) {
    return <div className="profile-empty">Loading directory...</div>;
  }

  return (
    <div className="guild-directory">
      <p className="mentor-directory-intro">
        Find a mentor or consultant to guide your journey through mythology, storytelling, healing, media, or adventure.
      </p>

      {/* Filter tabs */}
      <div className="mentor-directory-filters">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`mentor-filter-tab${activeFilter === tab.id ? ' active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredMentors.length === 0 ? (
        <div className="profile-empty">
          {activeFilter === 'all'
            ? 'No mentors are currently available.'
            : `No ${FILTER_TABS.find(t => t.id === activeFilter)?.label || ''} mentors are currently available.`}
        </div>
      ) : (
        <div className="guild-directory-grid">
          {filteredMentors.map(mentor => {
            const canMentorReq = user && mentor.uid !== user.uid && canRequestMentor(mentorPairings, mentor.uid) && (mentor.availableSlots || 0) > 0;
            const existingPairing = mentorPairings.find(p => p.mentorUid === mentor.uid && (p.status === 'pending' || p.status === 'accepted'));
            const canConsultReq = user && mentor.uid !== user.uid && mentor.consultingAvailable && canRequestConsulting(consultingRequests, mentor.uid);
            const isSelf = user && mentor.uid === user.uid;
            const isExpanded = expandedCard === mentor.id;

            return (
              <div key={mentor.id} className={`guild-directory-card${isExpanded ? ' expanded' : ''}`}>
                <div className="guild-directory-card-header" onClick={() => setExpandedCard(isExpanded ? null : mentor.id)}>
                  <div className="guild-photo">
                    {mentor.photoURL ? (
                      <img src={mentor.photoURL} alt="" className="guild-photo-img" />
                    ) : (
                      <span className="guild-photo-initial">{(mentor.handle || mentor.displayName || 'M').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="guild-directory-card-info">
                    <div className="guild-directory-card-name">
                      {mentor.mentorIcon} {mentor.mentorTitle}
                      {mentor.handle && <span className="guild-directory-card-handle"> @{mentor.handle}</span>}
                    </div>
                    <div className="guild-badges-row">
                      <span className="guild-badge">L{mentor.credentialLevel} {mentor.credentialName || CRED_LEVEL_NAMES[mentor.credentialLevel]}</span>
                      {mentor.consultingAvailable && <span className="guild-badge consulting">Consulting</span>}
                      {(mentor.consultingTypes || []).map(t => (
                        <span key={t} className="guild-badge consulting-type">{t}</span>
                      ))}
                    </div>
                    {mentor.bio && !isExpanded && (
                      <div className="guild-directory-card-bio-snippet">{mentor.bio.length > 100 ? mentor.bio.slice(0, 100) + '...' : mentor.bio}</div>
                    )}
                  </div>
                  <div className="guild-directory-card-slots">
                    {(mentor.availableSlots || 0) > 0
                      ? `${mentor.availableSlots} slot${mentor.availableSlots === 1 ? '' : 's'}`
                      : 'Full'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="guild-directory-card-expanded">
                    {mentor.bio && (
                      <div className="guild-directory-card-bio-full">{mentor.bio}</div>
                    )}

                    {(mentor.consultingProjectCount || 0) > 0 && (
                      <div className="guild-consulting-section">
                        <strong>Consulting:</strong> {mentor.consultingProjectCount} projects
                        {(mentor.consultingTypes || []).length > 0 && (
                          <span> in {mentor.consultingTypes.join(', ')}</span>
                        )}
                      </div>
                    )}

                    {!isSelf && (
                      <div className="guild-directory-card-actions">
                        {/* Mentor request */}
                        {requestingMentor === mentor.uid ? (
                          <div className="mentor-card-request-form">
                            <textarea
                              className="mentor-request-textarea"
                              placeholder="Introduce yourself..."
                              value={requestMessage}
                              onChange={e => setRequestMessage(e.target.value)}
                              maxLength={500}
                              rows={3}
                            />
                            <div className="mentor-request-form-actions">
                              <button className="mentor-card-request-btn" disabled={submitting} onClick={() => handleMentorRequest(mentor.uid)}>
                                {submitting ? 'Sending...' : 'Send Request'}
                              </button>
                              <button className="mentor-card-cancel-btn" onClick={() => { setRequestingMentor(null); setRequestMessage(''); setError(null); }}>Cancel</button>
                            </div>
                            {error && <div className="mentor-request-error">{error}</div>}
                          </div>
                        ) : existingPairing ? (
                          <span className="mentor-card-paired-label">
                            {existingPairing.status === 'accepted' ? 'Active Mentorship' : 'Request Pending'}
                          </span>
                        ) : canMentorReq ? (
                          <button className="mentor-card-request-btn" onClick={() => { setRequestingMentor(mentor.uid); setError(null); }}>
                            Request Mentor
                          </button>
                        ) : null}

                        {/* Consulting request */}
                        {canConsultReq && requestingConsulting !== mentor.uid && (
                          <button className="guild-consulting-btn" onClick={() => { setRequestingConsulting(mentor.uid); setError(null); }}>
                            Request Consulting
                          </button>
                        )}
                        {requestingConsulting === mentor.uid && (
                          <div className="mentor-card-request-form">
                            <textarea
                              className="mentor-request-textarea"
                              placeholder="Describe what you're looking for..."
                              value={requestMessage}
                              onChange={e => setRequestMessage(e.target.value)}
                              maxLength={500}
                              rows={3}
                            />
                            <div className="mentor-request-form-actions">
                              <button className="guild-consulting-btn" disabled={submitting} onClick={() => handleConsultingRequest(mentor.uid)}>
                                {submitting ? 'Sending...' : 'Send Consulting Request'}
                              </button>
                              <button className="mentor-card-cancel-btn" onClick={() => { setRequestingConsulting(null); setRequestMessage(''); setError(null); }}>Cancel</button>
                            </div>
                            {error && <div className="mentor-request-error">{error}</div>}
                          </div>
                        )}
                      </div>
                    )}
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
