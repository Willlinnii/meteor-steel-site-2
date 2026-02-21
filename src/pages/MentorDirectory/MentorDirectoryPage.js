import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useProfile } from '../../profile/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { canRequestMentor } from '../../profile/mentorPairingEngine';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'scholar', label: 'Mythologist' },
  { id: 'storyteller', label: 'Storyteller' },
  { id: 'healer', label: 'Healer' },
  { id: 'mediaVoice', label: 'Media Voice' },
  { id: 'adventurer', label: 'Adventurer' },
];

export default function MentorDirectoryPage() {
  const { user } = useAuth();
  const { mentorPairings, requestMentor } = useProfile();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [requestingMentor, setRequestingMentor] = useState(null); // uid of mentor being requested
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active mentors from directory
  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    async function fetchMentors() {
      try {
        const dirRef = collection(db, 'mentor-directory');
        const q = query(
          dirRef,
          where('active', '==', true),
          orderBy('availableSlots', 'desc'),
        );
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setMentors(results);
      } catch (err) {
        console.error('Failed to fetch mentor directory:', err);
      }
      setLoading(false);
    }

    fetchMentors();
  }, []);

  const filteredMentors = activeFilter === 'all'
    ? mentors
    : mentors.filter(m => m.mentorType === activeFilter);

  const handleRequest = useCallback(async (mentorUid) => {
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

  if (loading) {
    return (
      <div className="mentor-directory-page">
        <h1 className="profile-section-title">Mentor Directory</h1>
        <div className="profile-empty">Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="mentor-directory-page">
      <h1 className="profile-section-title">Mentor Directory</h1>
      <p className="mentor-directory-intro">
        Find a mentor to guide your journey through mythology, storytelling, healing, media, or adventure.
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
    </div>
  );
}
