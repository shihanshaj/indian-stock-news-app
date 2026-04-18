import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Zap, Clock } from 'lucide-react';

const SENTIMENT_STYLES = {
  Bullish: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
  Bearish: { text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'               },
  Neutral: { text: 'text-gray-500 dark:text-gray-400',       bg: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'           },
};

const SIGNAL_STYLES = {
  'Strong Buy Signal':  'bg-emerald-600 text-white',
  'Bullish Signal':     'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'Strong Sell Signal': 'bg-red-600 text-white',
  'Bearish Signal':     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  'Watch':              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'Monitor':            'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const IMPACT_DOT = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-gray-300 dark:bg-gray-600',
};

const SentIcon = ({ sentiment }) => {
  const Icon = sentiment === 'Bullish' ? TrendingUp : sentiment === 'Bearish' ? TrendingDown : Minus;
  return <Icon className={`w-3.5 h-3.5 ${(SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.Neutral).text}`} />;
};

/** Compact horizontal card optimised for speed-reading */
const LatestNewsCard = ({ article, index }) => {
  const styles = SENTIMENT_STYLES[article.sentiment] || SENTIMENT_STYLES.Neutral;
  const signalStyle = SIGNAL_STYLES[article.trading_signal] || SIGNAL_STYLES['Monitor'];

  const timeLabel = article.publish_date
    ? new Date(article.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div className={`group flex gap-3 p-3.5 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all`}>
      {/* Rank badge */}
      <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <span className={`w-2 h-2 rounded-full ${IMPACT_DOT[article.impact_level] || 'bg-gray-300'}`} title={`${article.impact_level} impact`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
            {article.source}
          </span>
          {timeLabel && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
              <Clock className="w-2.5 h-2.5" />{timeLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{article.summary}</p>
        )}

        {/* Bottom row */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${styles.text}`}>
            <SentIcon sentiment={article.sentiment} />
            {article.sentiment}
          </span>

          {article.category && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {article.category}
            </span>
          )}
          {article.narrative_title && (
            <span className="text-[10px] text-blue-500 dark:text-blue-400 truncate max-w-[140px]" title={article.narrative_title}>
              {article.narrative_title}
            </span>
          )}

          {article.trading_signal && (
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 shrink-0 ${signalStyle}`}>
              <Zap className="w-2.5 h-2.5" />{article.trading_signal}
            </span>
          )}
        </div>
      </div>

      {/* Link */}
      {article.link && (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-center p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          aria-label="Read full article"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};

export default LatestNewsCard;
