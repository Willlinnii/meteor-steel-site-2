import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useScope } from '../../contexts/ScopeContext';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const { activeScope, allScopes, setActiveScope, scopeType } = useScope();
  const [scopeOpen, setScopeOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="sidebar">
      {/* Dashboard */}
      <nav className="sidebar-section">
        <Link className={`sidebar-link${isActive('/app/dashboard') ? ' active' : ''}`} to="/app/dashboard">
          Dashboard
        </Link>
      </nav>

      {/* Scope Switcher */}
      {allScopes.length > 0 && (
        <div className="scope-switcher">
          <button className="scope-switcher-toggle" onClick={() => setScopeOpen(!scopeOpen)}>
            <span className="scope-switcher-icon">{activeScope?.type === 'family' ? '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' : '\uD83D\uDC65'}</span>
            <span className="scope-switcher-name">{activeScope?.name || 'Select group'}</span>
            <span className="scope-switcher-arrow">{scopeOpen ? '\u25B2' : '\u25BC'}</span>
          </button>
          {scopeOpen && (
            <div className="scope-switcher-dropdown">
              {allScopes.map(scope => (
                <button
                  key={`${scope.type}:${scope.id}`}
                  className={`scope-option${activeScope && scope.type === activeScope.type && scope.id === activeScope.id ? ' active' : ''}`}
                  onClick={() => { setActiveScope(scope); setScopeOpen(false); }}
                >
                  <span className="scope-option-icon">{scope.type === 'family' ? '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' : '\uD83D\uDC65'}</span>
                  <span className="scope-option-name">{scope.name}</span>
                  <span className="scope-option-type">{scope.type === 'family' ? 'Family' : 'Friends'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared Features (scope-aware) */}
      {activeScope && (
        <nav className="sidebar-section">
          <div className="sidebar-section-label">Shared</div>
          <Link className={`sidebar-link${isActive('/app/feed') ? ' active' : ''}`} to="/app/feed">Feed</Link>
          <Link className={`sidebar-link${isActive('/app/traditions') ? ' active' : ''}`} to="/app/traditions">Traditions</Link>
          <Link className={`sidebar-link${isActive('/app/creations') ? ' active' : ''}`} to="/app/creations">Creations</Link>
          <Link className={`sidebar-link${isActive('/app/storybook') ? ' active' : ''}`} to="/app/storybook">Story Book</Link>
          <Link className={`sidebar-link${isActive('/app/translator') ? ' active' : ''}`} to="/app/translator">Translator</Link>
        </nav>
      )}

      {/* Family Only (shown when scope is family) */}
      {scopeType === 'family' && (
        <nav className="sidebar-section">
          <div className="sidebar-section-label">Family Only</div>
          <Link className={`sidebar-link${isActive('/app/genealogy') ? ' active' : ''}`} to="/app/genealogy">Family Tree</Link>
        </nav>
      )}

      {/* Personal (always visible) */}
      <nav className="sidebar-section">
        <div className="sidebar-section-label">Personal</div>
        <Link className={`sidebar-link${isActive('/app/will') ? ' active' : ''}`} to="/app/will">Will</Link>
        <Link className={`sidebar-link${isActive('/app/trusts') ? ' active' : ''}`} to="/app/trusts">Trusts</Link>
      </nav>

      {/* Management */}
      <nav className="sidebar-section">
        <div className="sidebar-section-label">Manage</div>
        <Link className={`sidebar-link${isActive('/app/family') ? ' active' : ''}`} to="/app/family">My Families</Link>
        <Link className={`sidebar-link${isActive('/app/friends') ? ' active' : ''}`} to="/app/friends">My Friends</Link>
      </nav>
    </aside>
  );
}
