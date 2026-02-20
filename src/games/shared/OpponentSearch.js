import React, { useState, useEffect, useRef } from 'react';
import { searchHandles } from '../../multiplayer/handleService';

export default function OpponentSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchHandles(query);
        setResults(r);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="opponent-search">
      <input
        className="opponent-search-input"
        type="text"
        placeholder="Search by handle..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoComplete="off"
      />
      {searching && <div className="opponent-search-status">Searching...</div>}
      {results.length > 0 && (
        <div className="opponent-search-results">
          {results.map(r => (
            <button
              key={r.uid}
              className="opponent-search-result"
              onClick={() => { onSelect(r); setQuery(''); setResults([]); }}
            >
              @{r.handle}
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="opponent-search-status">No players found</div>
      )}
    </div>
  );
}
