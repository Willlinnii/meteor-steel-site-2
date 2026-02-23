import React, { useState } from 'react';

export default function StoryCard({ card }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`story-card${expanded ? ' story-card-expanded' : ''}`}
      style={{ borderLeftColor: card.color || '#888' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="story-card-header">
        <span className="story-card-icon">{card.icon}</span>
        <div className="story-card-info">
          <div className="story-card-title">{card.title}</div>
          <div className="story-card-subtitle">{card.subtitle}</div>
        </div>
        <span className={`story-card-chevron${expanded ? ' open' : ''}`}>{'\u25BE'}</span>
      </div>
      {expanded && (
        <div className="story-card-body">
          {card.summary && <div className="story-card-summary">{card.summary}</div>}
          {card.fullContent && (
            <div className="story-card-full">{card.fullContent}</div>
          )}
        </div>
      )}
    </div>
  );
}
