import React from 'react';

/**
 * Match card with Accept/Decline/Request Match/Cancel actions.
 * Used in both the incoming requests section and the browse pool.
 */
export default function MatchRequestCard({
  uid,
  handle,
  photoURL,
  score,
  matchMode,
  // Action state
  variant, // 'incoming' | 'outgoing' | 'pool' | 'mutual'
  onAccept,
  onDecline,
  onSendRequest,
  onCancel,
  disabled,
}) {
  return (
    <div className="match-request-card">
      <div className="match-request-card-header">
        <div className="match-request-card-identity">
          {photoURL ? (
            <img src={photoURL} alt="" className="match-request-card-avatar" />
          ) : (
            <div className="match-request-card-avatar match-request-card-avatar-placeholder">
              {(handle || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="match-request-card-handle">@{handle}</span>
          {matchMode && (
            <span className="match-request-card-mode">{matchMode}</span>
          )}
        </div>
        {score > 0 && (
          <span className="match-request-card-score">{score}%</span>
        )}
      </div>

      <div className="match-request-card-actions">
        {variant === 'incoming' && (
          <>
            <button
              className="match-request-btn match-request-btn-accept"
              onClick={() => onAccept?.()}
              disabled={disabled}
            >
              Accept
            </button>
            <button
              className="match-request-btn match-request-btn-decline"
              onClick={() => onDecline?.()}
              disabled={disabled}
            >
              Decline
            </button>
          </>
        )}

        {variant === 'outgoing' && (
          <>
            <button className="match-request-btn match-request-btn-pending" disabled>
              Pending...
            </button>
            <button
              className="match-request-btn match-request-btn-cancel"
              onClick={() => onCancel?.()}
              disabled={disabled}
            >
              Cancel
            </button>
          </>
        )}

        {variant === 'pool' && (
          <button
            className="match-request-btn match-request-btn-send"
            onClick={() => onSendRequest?.()}
            disabled={disabled}
          >
            Request Match
          </button>
        )}

        {variant === 'mutual' && (
          <button className="match-request-btn match-request-btn-pending" disabled>
            Matched
          </button>
        )}
      </div>
    </div>
  );
}
