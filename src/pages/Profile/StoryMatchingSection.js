import React from 'react';
import { Link } from 'react-router-dom';
import { useStoryMatching } from '../../storyMatching/useStoryMatching';
import { useMatchRequests } from '../../contexts/MatchRequestsContext';
import { useMatchConversations } from '../../storyMatching/useMatchConversations';
import './StoryMatchingSection.css';

export default function StoryMatchingSection() {
  const {
    matchingEnabled,
    toggleMatching,
    matches,
  } = useStoryMatching();

  const { incomingRequests, mutualMatches } = useMatchRequests();
  const { unreadCount } = useMatchConversations();

  return (
    <>
      <h3 className="profile-subsection-title" style={{ marginTop: '12px' }}>
        Story Matching
        {matchingEnabled && (matches.length + mutualMatches.length) > 0 && (
          <span className="friends-badge">{matches.length + mutualMatches.length}</span>
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
        <div className="story-matching-summary">
          <div className="story-matching-summary-stats">
            {matches.length > 0 && (
              <span className="story-matching-summary-stat">
                {matches.length} potential match{matches.length !== 1 ? 'es' : ''}
              </span>
            )}
            {mutualMatches.length > 0 && (
              <span className="story-matching-summary-stat">
                {mutualMatches.length} mutual match{mutualMatches.length !== 1 ? 'es' : ''}
              </span>
            )}
            {incomingRequests.length > 0 && (
              <span className="story-matching-summary-stat story-matching-summary-incoming">
                {incomingRequests.length} incoming request{incomingRequests.length !== 1 ? 's' : ''}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="story-matching-summary-stat story-matching-summary-unread">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <Link to="/matching" className="story-matching-go-link">
            Go to Matching
          </Link>
        </div>
      )}
    </>
  );
}
