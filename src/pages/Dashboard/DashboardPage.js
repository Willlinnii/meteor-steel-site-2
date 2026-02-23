import React from 'react';
import { Link } from 'react-router-dom';
import { useScope } from '../../contexts/ScopeContext';
import { useFamily } from '../../contexts/FamilyContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { activeScope, scopeType } = useScope();
  const { activeFamily } = useFamily();

  const scopeName = activeScope?.name || 'No group selected';

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      {activeScope && (
        <p className="dashboard-scope-label">
          {scopeType === 'family' ? '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' : '\uD83D\uDC65'} {scopeName}
        </p>
      )}

      {/* Shared feature cards */}
      {activeScope ? (
        <div className="dashboard-cards">
          <Link to="/app/feed" className="dashboard-card">
            <div className="dashboard-card-icon">📰</div>
            <div className="dashboard-card-label">Feed</div>
            <div className="dashboard-card-desc">Share updates with your {scopeType === 'family' ? 'family' : 'friends'}</div>
          </Link>
          <Link to="/app/traditions" className="dashboard-card">
            <div className="dashboard-card-icon">🕯️</div>
            <div className="dashboard-card-label">Traditions</div>
            <div className="dashboard-card-desc">Record and celebrate shared traditions</div>
          </Link>
          <Link to="/app/creations" className="dashboard-card">
            <div className="dashboard-card-icon">🎨</div>
            <div className="dashboard-card-label">Creations</div>
            <div className="dashboard-card-desc">Collaborative creative projects</div>
          </Link>
          <Link to="/app/storybook" className="dashboard-card">
            <div className="dashboard-card-icon">📖</div>
            <div className="dashboard-card-label">Story Book</div>
            <div className="dashboard-card-desc">Collect stories from members</div>
          </Link>
          <Link to="/app/translator" className="dashboard-card">
            <div className="dashboard-card-icon">🌍</div>
            <div className="dashboard-card-label">Translator</div>
            <div className="dashboard-card-desc">Translate between languages</div>
          </Link>

          {/* Family-only cards */}
          {scopeType === 'family' && activeFamily && (
            <Link to="/app/genealogy" className="dashboard-card">
              <div className="dashboard-card-icon">🌳</div>
              <div className="dashboard-card-label">Family Tree</div>
              <div className="dashboard-card-desc">Build your family genealogy</div>
            </Link>
          )}
        </div>
      ) : (
        <div className="dashboard-empty">
          <p>Create or join a family or friend group to get started.</p>
          <div className="dashboard-empty-actions">
            <Link to="/app/family" className="dashboard-empty-btn">Manage Families</Link>
            <Link to="/app/friends" className="dashboard-empty-btn">Manage Friends</Link>
          </div>
        </div>
      )}

      {/* Personal section */}
      <h2 className="dashboard-section-title">Personal</h2>
      <div className="dashboard-cards">
        <Link to="/app/will" className="dashboard-card">
          <div className="dashboard-card-icon">📜</div>
          <div className="dashboard-card-label">Will</div>
          <div className="dashboard-card-desc">Manage your will and wishes</div>
        </Link>
        <Link to="/app/trusts" className="dashboard-card">
          <div className="dashboard-card-icon">🏛️</div>
          <div className="dashboard-card-label">Trusts</div>
          <div className="dashboard-card-desc">Manage trust documents</div>
        </Link>
      </div>
    </div>
  );
}
