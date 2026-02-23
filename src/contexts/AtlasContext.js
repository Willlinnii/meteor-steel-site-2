import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCoursework } from '../coursework/CourseworkContext';

const AtlasContext = createContext({
  setPageContext: () => {},
  buildAtlasContext: () => '',
  // Backward compat: replaces AreaOverrideContext
  area: null,
  meta: null,
  register: () => {},
});

export const useAtlasContext = () => useContext(AtlasContext);

// Human-readable labels for areas/modes
const AREA_LABELS = {
  'celestial-clocks': 'Chronosphaera',
  'meteor-steel': 'Monomyth (Meteor Steel)',
  'fallen-starlight': 'Fallen Starlight',
  'story-of-stories': 'Story of Stories',
  'mythology-channel': 'Mythology Channel',
  'story-forge': 'Story Forge',
  'games': 'Games',
  'mythic-earth': 'Mythic Earth',
  'library': 'Library',
};

const PATH_LABELS = {
  '/chronosphaera': 'Chronosphaera',
  '/monomyth': 'Monomyth',
  '/home': 'Home',
  '/': 'Discover',
  '/fallen-starlight': 'Fallen Starlight',
  '/story-forge': 'Story Forge',
  '/mythology-channel': 'Mythology Channel',
  '/games': 'Games',
  '/story-of-stories': 'Story of Stories',
  '/mythic-earth': 'Mythic Earth',
  '/library': 'Library',
  '/atlas': 'Atlas',
  '/profile': 'Profile',
  '/yellow-brick-road': 'Journeys',
  '/myths': 'Myths',
  '/xr': 'XR / VR',
  '/fellowship': 'Fellowship',
  '/mentors': 'Mentors',
  '/guild': 'Guild',
  '/discover': 'Discover',
  '/curated': 'Curated Products',
  '/feed': 'Feed',
};

function labelForPath(pathname) {
  // Exact match first
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname];
  // Prefix match (e.g. /chronosphaera/calendar → Chronosphaera)
  for (const [prefix, label] of Object.entries(PATH_LABELS)) {
    if (prefix !== '/' && pathname.startsWith(prefix)) return label;
  }
  return pathname;
}

function formatSeconds(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function buildFocusDescription(focus) {
  if (!focus) return null;
  const { type, id, label, tab } = focus;
  if (type === 'overview' || !id) return null;
  const name = label || id;
  if (tab) return `${name} (${tab} tab)`;
  return name;
}

function buildPageStatusDescription(pageStatus) {
  if (!pageStatus) return null;
  const parts = [];
  const { visited, totalItems, visitedLabels, sessionTime } = pageStatus;
  if (visited && totalItems) {
    const names = visitedLabels || (Array.isArray(visited) ? visited : null);
    if (names && names.length > 0) {
      parts.push(`Explored: ${names.join(', ')} (${names.length} of ${totalItems})`);
    } else if (typeof visited === 'number') {
      parts.push(`Explored: ${visited} of ${totalItems}`);
    }
  }
  if (sessionTime && sessionTime > 5) {
    parts.push(`Session time on page: ${formatSeconds(sessionTime)}`);
  }
  return parts.length > 0 ? parts.join('\n') : null;
}

export function AtlasContextProvider({ children }) {
  const location = useLocation();
  const { progress, buildCourseSummary, getCourseStates } = useCoursework();
  const pageContextRef = useRef(null);
  const [pageContext, _setPageContext] = useState(null);

  // Navigation history: array of { path, label, enteredAt, duration }
  const navHistoryRef = useRef([]);
  const currentEntryRef = useRef(null);

  // Track navigation
  useEffect(() => {
    const now = Date.now();
    // Close out previous entry
    if (currentEntryRef.current) {
      currentEntryRef.current.duration = Math.round((now - currentEntryRef.current.enteredAt) / 1000);
      navHistoryRef.current.push(currentEntryRef.current);
      // Keep last 10
      if (navHistoryRef.current.length > 10) {
        navHistoryRef.current = navHistoryRef.current.slice(-10);
      }
    }
    // Start new entry
    currentEntryRef.current = {
      path: location.pathname,
      label: labelForPath(location.pathname),
      enteredAt: now,
      duration: 0,
    };
  }, [location.pathname]);

  const setPageContext = useCallback((ctx) => {
    pageContextRef.current = ctx;
    _setPageContext(ctx);
  }, []);

  // Backward compatibility: extract area/meta from pageContext for old AreaOverrideContext consumers
  const area = pageContext?.area || null;
  const meta = pageContext?.episode ? { episode: pageContext.episode } : null;
  const register = useCallback((areaVal, metaVal) => {
    // Legacy AreaOverrideContext.register(area, meta) compatibility
    // Pages that haven't migrated to setPageContext yet use this
    if (areaVal || metaVal) {
      pageContextRef.current = {
        ...(pageContextRef.current || {}),
        area: areaVal,
        ...(metaVal?.episode ? { episode: metaVal.episode } : {}),
        _legacy: true,
      };
      _setPageContext(pageContextRef.current);
    } else {
      pageContextRef.current = null;
      _setPageContext(null);
    }
  }, []);

  const buildAtlasContext = useCallback(() => {
    const isAtlasPage = location.pathname === '/atlas';
    const ctx = pageContextRef.current;
    const lines = [];

    lines.push('--- SITUATIONAL AWARENESS ---');

    // Current page
    const areaLabel = ctx?.area ? AREA_LABELS[ctx.area] : null;
    const pageName = areaLabel || labelForPath(location.pathname);
    const focusDesc = ctx ? buildFocusDescription(ctx.focus) : null;
    if (focusDesc) {
      lines.push(`Currently viewing: ${pageName} > ${focusDesc}`);
    } else {
      lines.push(`Currently viewing: ${pageName}`);
    }

    // Page status
    const statusDesc = ctx ? buildPageStatusDescription(ctx.pageStatus) : null;
    if (statusDesc) {
      lines.push(statusDesc);
    }

    // Episode context (for mythology channel / myths)
    if (ctx?.episode) {
      lines.push(`Watching episode: ${ctx.episode}`);
    }

    // Recent navigation (skip if on Atlas page — show progress instead)
    if (!isAtlasPage) {
      const history = navHistoryRef.current;
      if (history.length > 0) {
        const recent = history.slice(-5);
        const trail = recent
          .map(h => h.duration > 0 ? `${h.label} (${formatSeconds(h.duration)})` : h.label)
          .join(' → ');
        lines.push('');
        lines.push(`Recent navigation: ${trail} → ${pageName} (current)`);
      }
    }

    // Integrated mode: Atlas page gets full progress snapshot
    if (isAtlasPage) {
      lines.push('');
      lines.push('--- INTEGRATED PROGRESS SNAPSHOT ---');

      // Course statuses
      const courseStates = getCourseStates();
      if (courseStates.length > 0) {
        lines.push('Active courses:');
        for (const c of courseStates) {
          if (c.completed) {
            lines.push(`  ${c.name}: COMPLETED`);
          } else {
            const pct = Math.round(c.progress * 100);
            lines.push(`  ${c.name}: ${pct}% complete`);
          }
        }
      }

      // Per-section engagement summary from progress data
      const sectionSummaries = [];
      for (const [sectionId, sectionData] of Object.entries(progress || {})) {
        if (!sectionData?.elements) continue;
        const elementKeys = Object.keys(sectionData.elements);
        if (elementKeys.length === 0) continue;

        // Count unique items tracked
        const count = elementKeys.length;
        // Sum time elements
        let totalTime = 0;
        for (const [key, val] of Object.entries(sectionData.elements)) {
          if (key.endsWith('.time') && typeof val === 'number') {
            totalTime += val;
          }
        }
        const timePart = totalTime > 0 ? `, ${formatSeconds(totalTime)} total` : '';
        sectionSummaries.push(`  ${sectionId}: ${count} tracked elements${timePart}`);
      }
      if (sectionSummaries.length > 0) {
        lines.push('Engagement by section:');
        lines.push(...sectionSummaries);
      }

      // Navigation history (full)
      const history = navHistoryRef.current;
      if (history.length > 0) {
        const trail = history
          .map(h => h.duration > 0 ? `${h.label} (${formatSeconds(h.duration)})` : h.label)
          .join(' → ');
        lines.push('');
        lines.push(`Session trail: ${trail}`);
      }
    }

    // Context guidelines
    lines.push('');
    lines.push('CONTEXT GUIDELINES:');
    if (isAtlasPage) {
      lines.push('- This is a deep consultation. The student may ask about their overall progress or what to explore next.');
      lines.push('- Synthesize awareness across all sections. Give holistic guidance.');
      lines.push("- Don't narrate their progress back unless asked. Weave it into your guidance.");
    } else {
      if (ctx?.focus?.type === 'planet') {
        lines.push(`- Draw on ${ctx.focus.label || ctx.focus.id}'s correspondences if relevant to their question.`);
      } else if (ctx?.focus?.type === 'stage') {
        lines.push(`- Draw on the ${ctx.focus.label || ctx.focus.id} stage's themes if relevant.`);
      }
      lines.push("- Don't narrate their journey back to them.");
      lines.push('- Use awareness of their current view to make responses more relevant.');
    }

    return lines.join('\n');
  }, [location.pathname, progress, getCourseStates]);

  const value = {
    setPageContext,
    buildAtlasContext,
    // Backward compat
    area,
    meta,
    register,
  };

  return (
    <AtlasContext.Provider value={value}>
      {children}
    </AtlasContext.Provider>
  );
}

export default AtlasContext;
