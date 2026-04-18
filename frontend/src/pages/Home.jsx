import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import StockInfo from '../components/StockInfo';
import NarrativeSection from '../components/NarrativeSection';
import LatestNewsFeed from '../components/LatestNewsFeed';
import ContextNewsFeed from '../components/NewsFeed';
import ErrorMessage from '../components/ErrorMessage';
import useStockNews from '../hooks/useStockNews';
import { Brain, Zap, Radio, BookOpen } from 'lucide-react';
import { INDIAN_STOCKS } from '../utils/constants';

const FEATURED = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK'];

const Toggle = ({ label, icon: Icon, active, color, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all
      ${active
        ? `${color.bg} ${color.text} ${color.border}`
        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80'
      }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    <span className={`ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
      ${active ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
      {active ? 'ON' : 'OFF'}
    </span>
  </button>
);

const Home = () => {
  const { data, loading, error, search } = useStockNews();
  const [showLatest,  setShowLatest]  = useState(true);
  const [showContext, setShowContext] = useState(true);

  const hasLatest  = (data?.latest_news?.length  ?? 0) > 0;
  const hasContext = (data?.context_news?.length ?? 0) > 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
          <Brain className="w-3.5 h-3.5" />
          Two-Layer Intelligence System
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Indian Stock <span className="text-blue-600 dark:text-blue-400">Intelligence</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Latest news always first — then narratives and historical context to explain the WHY.
        </p>
      </section>

      {/* Search */}
      <SearchBar onSearch={search} loading={loading} />

      {/* Quick picks */}
      {!data && !loading && !error && (
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Quick search
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED.map((sym) => {
              const meta = INDIAN_STOCKS.find((s) => s.symbol === sym);
              return (
                <button
                  key={sym}
                  onClick={() => search(sym)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800"
                >
                  {sym}
                  {meta && <span className="ml-1.5 font-normal text-xs text-gray-400">{meta.sector}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={search} />}

      {/* Results */}
      {data && (
        <div className="space-y-5">
          {/* Stock overview */}
          <StockInfo data={data} />

          {/* Layer toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mr-1">Show:</span>
            <Toggle
              label="Latest News"
              icon={Radio}
              active={showLatest}
              onToggle={() => setShowLatest((v) => !v)}
              color={{ bg: 'bg-red-600', text: 'text-white', border: 'border-red-600' }}
            />
            <Toggle
              label="Context & Narratives"
              icon={BookOpen}
              active={showContext}
              onToggle={() => setShowContext((v) => !v)}
              color={{ bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' }}
            />
          </div>

          {/* ── LAYER 1: Latest news (dominant, always on top) ─────────────── */}
          {showLatest && (
            <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10 p-4">
              <LatestNewsFeed
                latestNews={data.latest_news}
                loading={false}
                symbol={data.symbol}
              />
            </div>
          )}

          {/* ── LAYER 2: Narratives + context news ────────────────────────── */}
          {showContext && (
            <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 p-4 space-y-5">
              <NarrativeSection narratives={data.narratives} />
              <ContextNewsFeed
                contextNews={data.context_news}
                loading={false}
                symbol={data.symbol}
                narratives={data.narratives}
              />
            </div>
          )}

          {/* Both off */}
          {!showLatest && !showContext && (
            <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm">Both layers are hidden. Toggle at least one above.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 p-4">
            <LatestNewsFeed latestNews={null} loading={true} symbol="" />
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
