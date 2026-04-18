import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Flame, Activity } from 'lucide-react';

const IMPORTANCE_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STATUS_ORDER     = { Active: 0, Fading: 1, Inactive: 2 };

const SentimentIcon = ({ sentiment, trend }) => {
  if (sentiment === 'Bullish') return <TrendingUp  className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (sentiment === 'Bearish') return <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
};

const TrendArrow = ({ trend }) => {
  if (trend === 'improving') return <span className="text-emerald-500 text-xs font-bold">↑</span>;
  if (trend === 'worsening') return <span className="text-red-500 text-xs font-bold">↓</span>;
  return <span className="text-gray-400 text-xs">→</span>;
};

const sentimentClasses = {
  Bullish: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
  Bearish: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  Neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
};

const statusClasses = {
  Active:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  Fading:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  Inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const importanceDot = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-gray-400',
};

const NarrativeCard = ({ narrative }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg border ${sentimentClasses[narrative.sentiment] || sentimentClasses.Neutral}`}>
    <div className="flex flex-col items-center gap-1 pt-0.5">
      <SentimentIcon sentiment={narrative.sentiment} trend={narrative.sentiment_trend} />
      <span className={`w-2 h-2 rounded-full ${importanceDot[narrative.importance] || 'bg-gray-400'}`} title={`${narrative.importance} importance`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-xs leading-tight truncate">{narrative.title}</p>
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusClasses[narrative.status] || statusClasses.Inactive}`}>
          {narrative.status}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">
        <span>{narrative.sentiment}</span>
        <TrendArrow trend={narrative.sentiment_trend} />
        <span className="opacity-60">{narrative.article_count} articles</span>
      </div>
    </div>
  </div>
);

const NarrativeSection = ({ narratives }) => {
  const [expanded, setExpanded] = useState(false);

  if (!narratives || narratives.length === 0) return null;

  const sorted = [...narratives].sort((a, b) => {
    const sd = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (sd !== 0) return sd;
    return (IMPORTANCE_ORDER[a.importance] ?? 3) - (IMPORTANCE_ORDER[b.importance] ?? 3);
  });

  const activeNarratives = sorted.filter((n) => n.status === 'Active');
  const otherNarratives  = sorted.filter((n) => n.status !== 'Active');
  const displayAll       = expanded ? sorted : sorted.slice(0, 6);

  const activeCount  = activeNarratives.length;
  const bullishCount = activeNarratives.filter((n) => n.sentiment === 'Bullish').length;
  const bearishCount = activeNarratives.filter((n) => n.sentiment === 'Bearish').length;

  return (
    <section className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">Active Narratives</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {activeCount} active &bull; {bullishCount} bullish &bull; {bearishCount} bearish
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{narratives.length} total</span>
        </div>
      </div>

      {/* Active narratives prominently */}
      {activeNarratives.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Currently Active</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeNarratives.slice(0, expanded ? undefined : 4).map((n) => (
              <NarrativeCard key={n.id} narrative={n} />
            ))}
          </div>
        </div>
      )}

      {/* Other narratives (fading / inactive) */}
      {(expanded ? otherNarratives : otherNarratives.slice(0, 2)).length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Background Context</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(expanded ? otherNarratives : otherNarratives.slice(0, 2)).map((n) => (
              <NarrativeCard key={n.id} narrative={n} />
            ))}
          </div>
        </div>
      )}

      {/* Expand/collapse */}
      {sorted.length > 6 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show all {sorted.length} narratives</>
          )}
        </button>
      )}
    </section>
  );
};

export default NarrativeSection;
