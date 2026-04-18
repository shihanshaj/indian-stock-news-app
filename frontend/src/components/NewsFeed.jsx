import React, { useState, useMemo } from 'react';
import NewsCard from './NewsCard';
import FilterBar from './FilterBar';
import LoadingSpinner from './LoadingSpinner';
import { BookOpen, SlidersHorizontal, Newspaper } from 'lucide-react';

const DEFAULT_FILTERS = {
  sentiment: 'all',
  impact:    'all',
  narrative: 'all',
  category:  'all',
};

const SkeletonCard = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-36 w-full" />
    <div className="p-3.5 space-y-3">
      <div className="skeleton h-3 w-20 rounded-full" />
      <div className="skeleton h-3 w-28 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  </div>
);

const ContextNewsFeed = ({ contextNews, loading, symbol, narratives }) => {
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const filteredNews = useMemo(() => {
    if (!contextNews) return [];
    return contextNews.filter((a) => {
      if (filters.sentiment !== 'all' && a.sentiment    !== filters.sentiment)  return false;
      if (filters.impact    !== 'all' && a.impact_level !== filters.impact)     return false;
      if (filters.narrative !== 'all' && a.narrative_id !== filters.narrative)  return false;
      if (filters.category  !== 'all' && a.category     !== filters.category)   return false;
      return true;
    });
  }, [contextNews, filters]);

  const hasActiveFilter =
    filters.sentiment !== 'all' ||
    filters.impact    !== 'all' ||
    filters.narrative !== 'all' ||
    filters.category  !== 'all';

  if (loading) {
    return (
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <LoadingSpinner size="sm" />
          Building context intelligence…
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  if (!contextNews || contextNews.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">No historical context available for {symbol}.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-base">Context & Background</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {hasActiveFilter ? `${filteredNews.length} of ${contextNews.length}` : contextNews.length} articles
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
            ${showFilters || hasActiveFilter
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter{hasActiveFilter ? ' (on)' : ''}
        </button>
      </div>

      {/* Filter bar — no timeframe chip (all context_news is already > 48h) */}
      {showFilters && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          narratives={narratives}
          resultCount={filteredNews.length}
          totalCount={contextNews.length}
        />
      )}

      {/* No results */}
      {filteredNews.length === 0 && (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium text-sm">No articles match these filters.</p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredNews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((article, idx) => (
            <NewsCard key={article.link || idx} article={article} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ContextNewsFeed;
