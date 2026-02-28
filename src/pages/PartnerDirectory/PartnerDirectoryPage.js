import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { usePageTracking } from '../../coursework/CourseworkContext';

export default function PartnerDirectoryPage() {
  const { user } = useAuth();
  const { partnerMemberships, requestJoinPartner } = useProfile();
  const { track } = usePageTracking('partner-directory');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingPartner, setRequestingPartner] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseConfigured || !db) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      try {
        const q = query(
          collection(db, 'partner-directory'),
          where('active', '==', true),
          orderBy('entityName'),
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          const results = [];
          snap.forEach(d => results.push({ id: d.id, ...d.data() }));
          setPartners(results);
        }
      } catch (err) {
        console.error('Failed to load partner directory:', err);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleRequest = useCallback(async (partnerUid) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestJoinPartner(partnerUid, requestMessage.trim() || null);
      track('request');
      setRequestingPartner(null);
      setRequestMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
    setSubmitting(false);
  }, [requestJoinPartner, requestMessage, submitting, track]);

  if (loading) {
    return (
      <div className="mentor-directory-page">
        <div className="profile-empty">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="mentor-directory-page">
      {partners.length === 0 ? (
        <div className="profile-empty">No partners are currently listed.</div>
      ) : (
        <div className="mentor-directory-grid">
          {partners.map(partner => {
            const isSelf = user && partner.uid === user.uid;
            const existingMembership = partnerMemberships?.find(
              m => m.partnerUid === partner.uid && (m.status === 'pending' || m.status === 'accepted')
            );
            const canRequest = user && !isSelf && !existingMembership;

            return (
              <div key={partner.id} className="mentor-card">
                <div className="mentor-card-header">
                  <span className="mentor-card-icon">{'\u{1F91D}'}</span>
                  <div>
                    <div className="mentor-card-title">{partner.entityName}</div>
                    {partner.handle && <div className="mentor-card-handle">@{partner.handle}</div>}
                  </div>
                </div>

                {partner.description && (
                  <div className="mentor-card-bio">{partner.description}</div>
                )}

                {partner.websiteUrl && (
                  <div className="mentor-card-bio" style={{ marginTop: 4 }}>
                    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                      {partner.websiteUrl}
                    </a>
                  </div>
                )}

                {partner.mythicRelation && (
                  <div className="mentor-card-bio" style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.85 }}>
                    {partner.mythicRelation}
                  </div>
                )}

                {partner.displayName && (
                  <div className="mentor-card-slots" style={{ opacity: 0.7 }}>
                    Owner: {partner.displayName}
                  </div>
                )}

                <div className="mentor-card-slots">
                  {(partner.representativeCount || 0)} representative{(partner.representativeCount || 0) === 1 ? '' : 's'}
                </div>

                {!isSelf && (
                  <div className="mentor-card-actions">
                    {requestingPartner === partner.uid ? (
                      <div className="mentor-card-request-form">
                        <textarea
                          className="mentor-request-textarea"
                          placeholder="Optional: why would you like to represent this entity?"
                          value={requestMessage}
                          onChange={e => setRequestMessage(e.target.value)}
                          maxLength={500}
                          rows={3}
                        />
                        <div className="mentor-request-form-actions">
                          <button
                            className="mentor-card-request-btn"
                            disabled={submitting}
                            onClick={() => handleRequest(partner.uid)}
                          >
                            {submitting ? 'Sending...' : 'Send Request'}
                          </button>
                          <button
                            className="mentor-card-cancel-btn"
                            onClick={() => { setRequestingPartner(null); setRequestMessage(''); setError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                        {error && <div className="mentor-request-error">{error}</div>}
                      </div>
                    ) : existingMembership ? (
                      <span className="mentor-card-paired-label">
                        {existingMembership.status === 'accepted' ? 'Active Representative' : 'Request Pending'}
                      </span>
                    ) : canRequest ? (
                      <button
                        className="mentor-card-request-btn"
                        onClick={() => { setRequestingPartner(partner.uid); setError(null); }}
                      >
                        Request to Join
                      </button>
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
