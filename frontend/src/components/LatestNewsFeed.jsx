import React, { useState } from 'react';
import LatestNewsCard from './LatestNewsCard';
import LoadingSpinner from './LoadingSpinner';
import { Radio, ChevronDown, ChevronUp } from 'lucide-react';

const SkeletonRow = () => (
  <div className="flex gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="skeleton w-6 h-6 rounded-full shrink-0 mt-0.5" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  </div>
);

const INITIAL_SHOW = 8;

const LatestNewsFeed = ({ latestNews, loading, symbol }) => {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? latestNews : (latestNews || []).slice(0, INITIAL_SHOW);
  const hasMore   = (latestNews?.length ?? 0) > INITIAL_SHOW;

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Fetching latest news…</span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </section>
    );
  }

  if (!latestNews || latestNews.length === 0) {
    return (
      <section className="card p-5 border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-red-500" />
          <h2 className="font-bold text-sm text-red-600 dark:text-red-400 uppercase tracking-wide">Latest News</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No news in the last 48 hours for {symbol}. See context section below for background intelligence.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">Live</span>
          </div>
          <h2 className="font-bold text-base">Latest Market-Moving News</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {latestNews.length} article{latestNews.length !== 1 ? 's' : ''} · last 48h
          </span>
        </div>
      </div>

      {/* Alert bar for high-impact fresh news */}
      {latestNews.some((a) => a.impact_level === 'HIGH') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          High-impact news detected — review before trading
        </div>
      )}

      {/* Article list */}
      <div className="space-y-2">
        {displayed.map((article, idx) => (
          <LatestNewsCard key={article.link || idx} article={article} index={idx} />
        ))}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show all {latestNews.length} latest articles</>
          )}
        </button>
      )}
    </section>
  );
};

export default LatestNewsFeed;
