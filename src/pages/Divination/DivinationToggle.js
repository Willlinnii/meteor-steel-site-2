import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/divination/mythouse-astrology', label: 'Mythouse Astrology' },
  { path: '/divination/traditional-astrology', label: 'Astrology' },
  { path: '/divination/tarot', label: 'Tarot' },
  { path: '/divination/i-ching', label: 'I Ching' },
  {
    label: 'Casting',
    children: [
      { path: '/divination/dice', label: 'Dice' },
      { path: '/divination/cowrie', label: 'Cowrie' },
      { path: '/divination/sticks', label: 'Sticks' },
      { path: '/divination/top', label: 'Top' },
    ],
  },
  {
    label: 'Oracle',
    children: [
      { path: '/divination/geomancy', label: 'Geomancy' },
      { path: '/divination/sortes', label: 'Sortes' },
    ],
  },
];

function isGroupActive(tab, pathname) {
  if (tab.children) return tab.children.some(c => pathname.startsWith(c.path));
  return pathname.startsWith(tab.path);
}

export default function DivinationToggle() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Find the active group (if any) so we can render its sub-tabs */
  const activeGroup = TABS.find(t => t.children && isGroupActive(t, pathname));

  return (
    <>
      {/* ── Primary tabs ────────────────────────────────── */}
      <div className="divination-toggle">
        {TABS.map(tab => {
          const active = isGroupActive(tab, pathname);
          const handleClick = () => {
            if (tab.path) {
              navigate(tab.path);
            } else if (tab.children) {
              navigate(tab.children[0].path);
            }
          };
          return (
            <button
              key={tab.label}
              className={`divination-toggle-btn${active ? ' active' : ''}`}
              onClick={handleClick}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-tabs (only shown when a group is active) ─ */}
      {activeGroup && (
        <div className="divination-subtoggle">
          {activeGroup.children.map(sub => (
            <button
              key={sub.path}
              className={`divination-subtoggle-btn${pathname.startsWith(sub.path) ? ' active' : ''}`}
              onClick={() => navigate(sub.path)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
