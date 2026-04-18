import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { INDIAN_STOCKS, SEARCH_HISTORY_KEY } from '../utils/constants';
import { searchStocksApi } from '../utils/api';

const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory]         = useState([]);
  const [open, setOpen]               = useState(false);
  const [searching, setSearching]     = useState(false);
  const inputRef    = useRef(null);
  const containerRef = useRef(null);
  const debounceRef  = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch (_) {}
  }, []);

  const handleFocus = () => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch (_) {}
    setOpen(true);
  };

  // Debounced autocomplete — hit backend search API after 250 ms of inactivity
  const fetchSuggestions = useCallback((q) => {
    clearTimeout(debounceRef.current);

    if (!q || q.length < 1) {
      setSuggestions([]);
      return;
    }

    const qUpper = q.toUpperCase();

    // Immediate local filter for instant feedback
    const local = INDIAN_STOCKS.filter(
      (s) => s.symbol.startsWith(qUpper) || s.name.toUpperCase().includes(qUpper)
    ).slice(0, 6);
    setSuggestions(local);

    // Then hit the backend to potentially add more results
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchStocksApi(q);
        if (res.success && Array.isArray(res.results)) {
          setSuggestions(res.results.slice(0, 8));
        }
      } catch (_) {
        // Keep local suggestions on failure
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    fetchSuggestions(query.trim());
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = query.trim().toUpperCase();
    if (!val) return;
    setOpen(false);
    onSearch(val);
  };

  const selectSymbol = (symbol) => {
    setQuery(symbol);
    setOpen(false);
    onSearch(symbol);
  };

  const showDropdown = open && (suggestions.length > 0 || history.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={handleFocus}
            placeholder="Type any NSE symbol or company name (e.g. NATCOPHARM, TCS, Infosys)"
            className="input-field pl-9 pr-8"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary">
          {loading ? 'Loading…' : 'Search'}
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full card shadow-lg overflow-hidden">
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                Suggestions
                {searching && (
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </p>
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectSymbol(s.symbol)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 w-24 shrink-0 text-sm">
                    {s.symbol}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{s.name}</span>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{s.sector}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent searches */}
          {history.length > 0 && suggestions.length === 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent
              </p>
              {history.map((sym) => {
                const meta = INDIAN_STOCKS.find((s) => s.symbol === sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => selectSymbol(sym)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono font-semibold text-sm">{sym}</span>
                    {meta && <span className="text-xs text-gray-400 truncate">{meta.name}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
