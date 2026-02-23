import React, { useState } from 'react';
import { CATEGORY_CONFIG } from '../../storyCards/storyCardDefs';

export default function MatchCard({ match, comparison, onRequestDeep, deepLoading, isPaired, onPair, onUnpair, showPairButton }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="match-card" onClick={() => setExpanded(e => !e)}>
      <div className="match-card-header">
        <div className="match-card-identity">
          {match.photoURL ? (
            <img src={match.photoURL} alt="" className="match-card-avatar" />
          ) : (
            <div className="match-card-avatar match-card-avatar-placeholder">
              {(match.handle || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="match-card-handle">@{match.handle}</span>
          {isPaired && (
            <span className="match-card-paired-badge">
              Paired
              <button
                className="match-card-paired-x"
                onClick={e => { e.stopPropagation(); onUnpair(); }}
                title="Unpair"
              >
                &times;
              </button>
            </span>
          )}
        </div>
        <div className="match-card-header-right">
          {showPairButton && !isPaired && (
            <button
              className="match-card-pair-btn"
              onClick={e => { e.stopPropagation(); onPair(match.uid); }}
              title="Pair with this person"
            >
              &#x1F517;
            </button>
          )}
          <span className="match-card-score">{match.score}% match</span>
        </div>
      </div>

      <div className="match-card-visual">
        <div className="match-card-overlap-left">
          <span className="match-card-overlap-label">You</span>
        </div>
        <div className="match-card-link-icon">&#x21C4;</div>
        <div className="match-card-overlap-right">
          <span className="match-card-overlap-label">
            @{match.handle}
            {match.cardCount > 0 && <span className="match-card-count"> ({match.cardCount})</span>}
          </span>
        </div>
      </div>

      {match.highlights.length > 0 && (
        <div className="match-card-chips">
          {match.highlights.slice(0, 5).map((h, i) => {
            const cfg = CATEGORY_CONFIG[h.category];
            return (
              <span
                key={i}
                className="match-card-chip"
                style={cfg ? { borderColor: cfg.color, color: cfg.color } : undefined}
              >
                {cfg?.icon} {h.label}
              </span>
            );
          })}
        </div>
      )}

      {expanded && (
        <div className="match-card-detail">
          {match.locationScore > 0 && (
            <div className="match-card-detail-row">
              <span className="match-card-detail-label">Location:</span>
              <span>{match.locationScore === 100 ? `Same city (${match.highlights.find(h => h.category === 'location')?.label?.replace('Same city: ', '') || '—'})` : `Same country`}</span>
            </div>
          )}
          <div className="match-card-detail-row">
            <span className="match-card-detail-label">Overlap:</span>
            <span>{match.overlapScore}%</span>
          </div>

          {comparison ? (
            <div className="match-card-deep">
              <p className="match-card-deep-summary">{comparison.summary}</p>
              {comparison.highlights?.map((h, i) => (
                <div key={i} className="match-card-deep-highlight">
                  <span className="match-card-deep-label">{h.label}:</span> {h.detail}
                </div>
              ))}
              <div className="match-card-detail-row">
                <span className="match-card-detail-label">Story resonance:</span>
                <span>{comparison.score}%</span>
              </div>
            </div>
          ) : (
            <button
              className="match-card-deep-btn"
              onClick={(e) => { e.stopPropagation(); onRequestDeep(match.uid); }}
              disabled={deepLoading === match.uid}
            >
              {deepLoading === match.uid ? 'Analyzing...' : 'Find Deeper Matches'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
