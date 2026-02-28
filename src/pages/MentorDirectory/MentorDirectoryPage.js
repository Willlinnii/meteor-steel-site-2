import React, { useState, useCallback } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { canRequestGuildMember } from '../../profile/guildPairingEngine';
import { useGuildDirectory, FILTER_TABS } from '../Guild/useGuildDirectory';
import { usePageTracking } from '../../coursework/CourseworkContext';

export default function MentorDirectoryPage() {
  const { user } = useAuth();
  const { guildPairings, requestGuildMember } = useProfile();
  const { members: filteredMembers, loading, activeFilter, setActiveFilter, hasMore, loadMore } = useGuildDirectory();
  const { track } = usePageTracking('guild-directory');
  const [requestingMember, setRequestingMember] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (guildMemberUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestGuildMember(guildMemberUid, requestMessage.trim() || null);
      track('request');
      setRequestingMember(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
    setSubmitting(false);
  }, [requestGuildMember, requestMessage, submitting]);

  if (loading) {
    return (
      <div className="guild-member-directory-page">
        <div className="profile-empty">Loading guild members...</div>
      </div>
    );
  }

  return (
    <div className="guild-member-directory-page">
      {/* Filter tabs */}
      <div className="guild-member-directory-filters">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`guild-member-filter-tab${activeFilter === tab.id ? ' active' : ''}`}
            onClick={() => { setActiveFilter(tab.id); track(`filter.${tab.id}`); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guild member grid */}
      {filteredMembers.length === 0 ? (
        <div className="profile-empty">
          {activeFilter === 'all'
            ? 'No guild members are currently available.'
            : `No ${FILTER_TABS.find(t => t.id === activeFilter)?.label || ''} guild members are currently available.`}
        </div>
      ) : (
        <div className="guild-member-directory-grid">
          {filteredMembers.map(member => {
            const canRequest = user && member.uid !== user.uid && canRequestGuildMember(guildPairings, member.uid) && (member.availableSlots || 0) > 0;
            const existingPairing = guildPairings.find(p => (p.guildMemberUid || p.mentorUid) === member.uid && (p.status === 'pending' || p.status === 'accepted'));
            const isSelf = user && member.uid === user.uid;

            return (
              <div key={member.id} className="guild-member-card">
                <div className="guild-member-card-header">
                  <span className="guild-member-card-icon">{member.guildIcon || member.mentorIcon}</span>
                  <div>
                    <div className="guild-member-card-title">{member.guildTitle || member.mentorTitle}</div>
                    {member.handle && <div className="guild-member-card-handle">@{member.handle}</div>}
                  </div>
                  <span className="guild-member-card-credential">
                    L{member.credentialLevel} {member.credentialName}
                  </span>
                </div>

                {member.bio && (
                  <div className="guild-member-card-bio">{member.bio}</div>
                )}

                <div className="guild-member-card-slots">
                  {(member.availableSlots || 0) > 0
                    ? `${member.availableSlots} slot${member.availableSlots === 1 ? '' : 's'} available`
                    : 'No slots available'}
                </div>

                {/* Request button or status */}
                {!isSelf && (
                  <div className="guild-member-card-actions">
                    {requestingMember === member.uid ? (
                      <div className="guild-member-card-request-form">
                        <textarea
                          className="guild-member-request-textarea"
                          placeholder="Optional: introduce yourself or share why you'd like this guild member..."
                          value={requestMessage}
                          onChange={e => setRequestMessage(e.target.value)}
                          maxLength={500}
                          rows={3}
                        />
                        <div className="guild-member-request-form-actions">
                          <button
                            className="guild-member-card-request-btn"
                            disabled={submitting}
                            onClick={() => handleRequest(member.uid)}
                          >
                            {submitting ? 'Sending...' : 'Send Request'}
                          </button>
                          <button
                            className="guild-member-card-cancel-btn"
                            onClick={() => { setRequestingMember(null); setRequestMessage(''); setError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                        {error && <div className="guild-member-request-error">{error}</div>}
                      </div>
                    ) : existingPairing ? (
                      <span className="guild-member-card-paired-label">
                        {existingPairing.status === 'accepted' ? 'Active Membership' : 'Request Pending'}
                      </span>
                    ) : canRequest ? (
                      <button
                        className="guild-member-card-request-btn"
                        onClick={() => { setRequestingMember(member.uid); setError(null); }}
                      >
                        Request Guild Member
                      </button>
                    ) : (member.availableSlots || 0) <= 0 ? (
                      <button className="guild-member-card-request-btn" disabled>Full</button>
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
