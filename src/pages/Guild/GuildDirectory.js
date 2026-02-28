import React, { useState, useCallback } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useAuth } from '../../auth/AuthContext';
import { canRequestGuildMember } from '../../profile/guildPairingEngine';
import { canRequestConsulting } from '../../profile/consultingEngine';
import { useGuildDirectory, FILTER_TABS } from './useGuildDirectory';

const CRED_LEVEL_NAMES = {
  1: 'Initiate', 2: 'Adept', 3: 'Master', 4: 'Grand Master', 5: 'Archon',
};

export default function GuildDirectory() {
  const { user } = useAuth();
  const { guildPairings, requestGuildMember, consultingRequests, requestConsulting } = useProfile();
  const { members: filteredMembers, loading, activeFilter, setActiveFilter, hasMore, loadMore } = useGuildDirectory();
  const [expandedCard, setExpandedCard] = useState(null);
  const [requestingMember, setRequestingMember] = useState(null);
  const [requestingConsulting, setRequestingConsulting] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleGuildMemberRequest = useCallback(async (guildMemberUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestGuildMember(guildMemberUid, requestMessage.trim() || null);
      setRequestingMember(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
    setSubmitting(false);
  }, [requestGuildMember, requestMessage, submitting]);

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
      <p className="guild-member-directory-intro">
        Find a guild member or consultant to guide your journey through mythology, storytelling, healing, media, or adventure.
      </p>

      {/* Filter tabs */}
      <div className="guild-member-directory-filters">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`guild-member-filter-tab${activeFilter === tab.id ? ' active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredMembers.length === 0 ? (
        <div className="profile-empty">
          {activeFilter === 'all'
            ? 'No guild members are currently available.'
            : `No ${FILTER_TABS.find(t => t.id === activeFilter)?.label || ''} guild members are currently available.`}
        </div>
      ) : (
        <div className="guild-directory-grid">
          {filteredMembers.map(member => {
            const canGuildReq = user && member.uid !== user.uid && canRequestGuildMember(guildPairings, member.uid) && (member.availableSlots || 0) > 0;
            const existingPairing = guildPairings.find(p => (p.guildMemberUid || p.mentorUid) === member.uid && (p.status === 'pending' || p.status === 'accepted'));
            const canConsultReq = user && member.uid !== user.uid && member.consultingAvailable && canRequestConsulting(consultingRequests, member.uid);
            const isSelf = user && member.uid === user.uid;
            const isExpanded = expandedCard === member.id;

            return (
              <div key={member.id} className={`guild-directory-card${isExpanded ? ' expanded' : ''}`}>
                <div className="guild-directory-card-header" onClick={() => setExpandedCard(isExpanded ? null : member.id)}>
                  <div className="guild-photo">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt="" className="guild-photo-img" />
                    ) : (
                      <span className="guild-photo-initial">{(member.handle || member.displayName || 'G').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="guild-directory-card-info">
                    <div className="guild-directory-card-name">
                      {member.guildIcon || member.mentorIcon} {member.guildTitle || member.mentorTitle}
                      {member.handle && <span className="guild-directory-card-handle"> @{member.handle}</span>}
                    </div>
                    <div className="guild-badges-row">
                      <span className="guild-badge">L{member.credentialLevel} {member.credentialName || CRED_LEVEL_NAMES[member.credentialLevel]}</span>
                      {member.consultingAvailable && <span className="guild-badge consulting">Consulting</span>}
                      {(member.consultingTypes || []).map(t => (
                        <span key={t} className="guild-badge consulting-type">{t}</span>
                      ))}
                    </div>
                    {member.bio && !isExpanded && (
                      <div className="guild-directory-card-bio-snippet">{member.bio.length > 100 ? member.bio.slice(0, 100) + '...' : member.bio}</div>
                    )}
                  </div>
                  <div className="guild-directory-card-slots">
                    {(member.availableSlots || 0) > 0
                      ? `${member.availableSlots} slot${member.availableSlots === 1 ? '' : 's'}`
                      : 'Full'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="guild-directory-card-expanded">
                    {member.bio && (
                      <div className="guild-directory-card-bio-full">{member.bio}</div>
                    )}

                    {(member.consultingProjectCount || 0) > 0 && (
                      <div className="guild-consulting-section">
                        <strong>Consulting:</strong> {member.consultingProjectCount} projects
                        {(member.consultingTypes || []).length > 0 && (
                          <span> in {member.consultingTypes.join(', ')}</span>
                        )}
                      </div>
                    )}

                    {!isSelf && (
                      <div className="guild-directory-card-actions">
                        {/* Guild member request */}
                        {requestingMember === member.uid ? (
                          <div className="guild-member-card-request-form">
                            <textarea
                              className="guild-member-request-textarea"
                              placeholder="Introduce yourself..."
                              value={requestMessage}
                              onChange={e => setRequestMessage(e.target.value)}
                              maxLength={500}
                              rows={3}
                            />
                            <div className="guild-member-request-form-actions">
                              <button className="guild-member-card-request-btn" disabled={submitting} onClick={() => handleGuildMemberRequest(member.uid)}>
                                {submitting ? 'Sending...' : 'Send Request'}
                              </button>
                              <button className="guild-member-card-cancel-btn" onClick={() => { setRequestingMember(null); setRequestMessage(''); setError(null); }}>Cancel</button>
                            </div>
                            {error && <div className="guild-member-request-error">{error}</div>}
                          </div>
                        ) : existingPairing ? (
                          <span className="guild-member-card-paired-label">
                            {existingPairing.status === 'accepted' ? 'Active Membership' : 'Request Pending'}
                          </span>
                        ) : canGuildReq ? (
                          <button className="guild-member-card-request-btn" onClick={() => { setRequestingMember(member.uid); setError(null); }}>
                            Request Guild Member
                          </button>
                        ) : null}

                        {/* Consulting request */}
                        {canConsultReq && requestingConsulting !== member.uid && (
                          <button className="guild-consulting-btn" onClick={() => { setRequestingConsulting(member.uid); setError(null); }}>
                            Request Consulting
                          </button>
                        )}
                        {requestingConsulting === member.uid && (
                          <div className="guild-member-card-request-form">
                            <textarea
                              className="guild-member-request-textarea"
                              placeholder="Describe what you're looking for..."
                              value={requestMessage}
                              onChange={e => setRequestMessage(e.target.value)}
                              maxLength={500}
                              rows={3}
                            />
                            <div className="guild-member-request-form-actions">
                              <button className="guild-consulting-btn" disabled={submitting} onClick={() => handleConsultingRequest(member.uid)}>
                                {submitting ? 'Sending...' : 'Send Consulting Request'}
                              </button>
                              <button className="guild-member-card-cancel-btn" onClick={() => { setRequestingConsulting(null); setRequestMessage(''); setError(null); }}>Cancel</button>
                            </div>
                            {error && <div className="guild-member-request-error">{error}</div>}
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
