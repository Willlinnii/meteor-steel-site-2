import React from 'react';
import { useStoryMatching } from '../../storyMatching/useStoryMatching';
import { useMatchRequests } from '../../contexts/MatchRequestsContext';
import MatchRequestCard from './MatchRequestCard';
import '../Profile/StoryMatchingSection.css';

const MODES = [
  { key: 'friends', label: 'Friends' },
  { key: 'family', label: 'Family' },
  { key: 'new-friends', label: 'New Friends' },
  { key: 'romantic', label: 'Romantic' },
];

const PRIVACY_TEXT = {
  friends: 'Friends who also have matching on can discover shared stories and connections.',
  family: 'Family members with matching enabled will appear here.',
  'new-friends': 'Anyone on Mythouse with matching enabled can see your profile.',
  romantic: 'People in Romantic or New Friends mode can discover you. Family is always excluded.',
};

const EMPTY_TEXT = {
  friends: 'No matches yet. Your friends need to enable matching too!',
  family: 'No family members have matching enabled yet.',
  'new-friends': 'No one else has matching enabled yet. Check back soon!',
  romantic: 'No romantic matches found. More people will join over time.',
};

export default function DiscoverTab() {
  const {
    matchingEnabled,
    toggleMatching,
    matchMode,
    setMatchMode,
    matchExcludeFriends,
    setExcludeFriends,
    matches,
    loading,
    sendMatchRequest,
    matchConnectedUids,
  } = useStoryMatching();

  const {
    incomingRequests,
    outgoingRequests,
    acceptMatchRequest,
    declineMatchRequest,
    cancelMatchRequest,
    mutualMatches,
  } = useMatchRequests();

  // UIDs that already have a match relationship
  const mutualUids = new Set(mutualMatches.map(m => m.uid));
  const outgoingUids = new Set(outgoingRequests.map(r => r.recipientUid));

  return (
    <div>
      {/* Enable/disable toggle */}
      <div className="discover-toggle-row">
        <span className="discover-toggle-label">Enable story matching</span>
        <button
          className={`story-matching-toggle ${matchingEnabled ? 'story-matching-toggle-on' : ''}`}
          onClick={toggleMatching}
          aria-pressed={matchingEnabled}
        >
          <span className="story-matching-toggle-knob" />
        </button>
      </div>

      {matchingEnabled && (
        <>
          {/* Mode pills */}
          <div className="discover-modes">
            {MODES.map(m => (
              <button
                key={m.key}
                className={`discover-mode-btn${matchMode === m.key ? ' active' : ''}`}
                onClick={() => setMatchMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {matchMode === 'romantic' && (
            <label className="story-matching-checkbox">
              <input
                type="checkbox"
                checked={matchExcludeFriends}
                onChange={e => setExcludeFriends(e.target.checked)}
              />
              Don't show friends
            </label>
          )}

          <p className="discover-privacy">{PRIVACY_TEXT[matchMode]}</p>

          {/* Incoming match requests */}
          {incomingRequests.length > 0 && (
            <div className="discover-incoming">
              <h3 className="discover-section-title">
                Incoming Requests ({incomingRequests.length})
              </h3>
              <div className="discover-incoming-list">
                {incomingRequests.map(req => (
                  <MatchRequestCard
                    key={req.id}
                    uid={req.senderUid}
                    handle={req.senderHandle}
                    photoURL={req.senderPhotoURL}
                    score={req.quickScore}
                    matchMode={req.matchMode}
                    variant="incoming"
                    onAccept={() => acceptMatchRequest(req.id)}
                    onDecline={() => declineMatchRequest(req.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Match pool */}
          {loading ? (
            <p className="discover-loading">Loading matches...</p>
          ) : matches.length > 0 ? (
            <>
              <h3 className="discover-section-title">
                Discover ({matches.length})
              </h3>
              <div className="discover-match-list">
                {matches.map(m => {
                  // Determine variant
                  let variant = 'pool';
                  if (mutualUids.has(m.uid)) variant = 'mutual';
                  else if (outgoingUids.has(m.uid)) variant = 'outgoing';
                  else if (matchConnectedUids.has(m.uid)) variant = 'mutual';

                  const outReq = outgoingRequests.find(r => r.recipientUid === m.uid);

                  return (
                    <MatchRequestCard
                      key={m.uid}
                      uid={m.uid}
                      handle={m.handle}
                      photoURL={m.photoURL}
                      score={m.score}
                      variant={variant}
                      onSendRequest={() => sendMatchRequest(m.uid, m.handle, m.photoURL, m.score)}
                      onCancel={outReq ? () => cancelMatchRequest(outReq.id) : undefined}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <p className="discover-empty">{EMPTY_TEXT[matchMode]}</p>
          )}
        </>
      )}
    </div>
  );
}
