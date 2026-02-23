import React from 'react';
import { useStoryMatching } from '../../storyMatching/useStoryMatching';
import MatchCard from './MatchCard';
import './StoryMatchingSection.css';

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

export default function StoryMatchingSection() {
  const {
    matchingEnabled,
    toggleMatching,
    matchMode,
    setMatchMode,
    matchExcludeFriends,
    setExcludeFriends,
    pairedWithUid,
    setPair,
    clearPair,
    matches,
    comparisons,
    requestDeepMatch,
    deepMatchLoading,
    loading,
  } = useStoryMatching();

  const pairedMatch = pairedWithUid ? matches.find(m => m.uid === pairedWithUid) : null;

  return (
    <>
      <h3 className="profile-subsection-title" style={{ marginTop: '12px' }}>
        Story Matching
        {matchingEnabled && matches.length > 0 && (
          <span className="friends-badge">{matches.length}</span>
        )}
      </h3>

      <div className="story-matching-toggle-row">
        <span className="story-matching-toggle-label">
          Enable story matching
        </span>
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
          <div className="story-matching-modes">
            {MODES.map(m => (
              <button
                key={m.key}
                className={`story-matching-mode-btn${matchMode === m.key ? ' active' : ''}`}
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

          <p className="story-matching-privacy">
            {PRIVACY_TEXT[matchMode]}
          </p>

          {pairedWithUid && (
            <div className="story-matching-paired-notice">
              <span>
                Paired with <strong>@{pairedMatch?.handle || '...'}</strong>
              </span>
              <button className="story-matching-unpair-btn" onClick={clearPair}>
                Unpair
              </button>
            </div>
          )}

          {!loading && matches.length > 0 && (
            <div className="story-matching-list">
              {matches.map(m => (
                <MatchCard
                  key={m.uid}
                  match={m}
                  comparison={comparisons[m.uid]}
                  onRequestDeep={requestDeepMatch}
                  deepLoading={deepMatchLoading}
                  isPaired={pairedWithUid === m.uid}
                  onPair={setPair}
                  onUnpair={clearPair}
                  showPairButton={!pairedWithUid}
                />
              ))}
            </div>
          )}

          {!loading && matches.length === 0 && (
            <p className="story-matching-empty">
              {EMPTY_TEXT[matchMode]}
            </p>
          )}

          {loading && (
            <p className="story-matching-loading">Loading matches...</p>
          )}
        </>
      )}
    </>
  );
}
