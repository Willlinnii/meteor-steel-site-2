import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFamily } from './FamilyContext';
import { useFriends } from './FriendsContext';

const STORAGE_KEY = 'mythouse-active-scope';

const ScopeContext = createContext(null);

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within ScopeProvider');
  return ctx;
}

export function ScopeProvider({ children }) {
  const { families } = useFamily();
  const { groups } = useFriends();
  const [selectedKey, setSelectedKey] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; }
  });

  // Build allScopes: tagged families + friend groups
  const allScopes = useMemo(() => [
    ...families.map(f => ({ type: 'family', id: f.id, name: f.name, memberUids: f.memberUids, members: f.members, collection: 'families' })),
    ...groups.map(g => ({ type: 'friends', id: g.id, name: g.name, memberUids: g.memberUids, members: g.members, collection: 'friendGroups' })),
  ], [families, groups]);

  // Derive activeScope from selectedKey
  const activeScope = useMemo(() => {
    if (selectedKey) {
      const found = allScopes.find(s => `${s.type}:${s.id}` === selectedKey);
      if (found) return found;
    }
    // Fallback: first family, then first friend group
    return allScopes[0] || null;
  }, [selectedKey, allScopes]);

  const scopeType = activeScope?.type || null;

  // Persist selection
  useEffect(() => {
    if (activeScope) {
      const key = `${activeScope.type}:${activeScope.id}`;
      try { localStorage.setItem(STORAGE_KEY, key); } catch {}
      setSelectedKey(key);
    }
  }, [activeScope]);

  const setActiveScope = useCallback((scope) => {
    if (!scope) {
      setSelectedKey(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return;
    }
    const key = `${scope.type}:${scope.id}`;
    setSelectedKey(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
  }, []);

  return (
    <ScopeContext.Provider value={{ activeScope, allScopes, setActiveScope, scopeType }}>
      {children}
    </ScopeContext.Provider>
  );
}
