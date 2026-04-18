import React, { useState } from 'react';
import { ExternalLink, Calendar, Newspaper, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

const TIMEFRAME_STYLES = {
  Breaking:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  Developing: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Trend:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Context:    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
};

const TIMEFRAME_ICONS = {
  Breaking:   '🔴',
  Developing: '🟡',
  Trend:      '🔵',
  Context:    '⚪',
};

const SENTIMENT_STYLES = {
  Bullish: 'text-emerald-600 dark:text-emerald-400',
  Bearish: 'text-red-600 dark:text-red-400',
  Neutral: 'text-gray-500 dark:text-gray-400',
};

const IMPACT_STYLES = {
  HIGH:   'text-red-600 dark:text-red-400 font-bold',
  MEDIUM: 'text-amber-600 dark:text-amber-400 font-semibold',
  LOW:    'text-gray-400 dark:text-gray-500',
};

const SIGNAL_STYLES = {
  'Strong Buy Signal':  'bg-emerald-600 text-white',
  'Bullish Signal':     'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'Strong Sell Signal': 'bg-red-600 text-white',
  'Bearish Signal':     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  'Watch':              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'Monitor':            'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const SentimentBadge = ({ sentiment }) => {
  const Icon = sentiment === 'Bullish' ? TrendingUp : sentiment === 'Bearish' ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.Neutral}`}>
      <Icon className="w-3 h-3" />{sentiment}
    </span>
  );
};

const NewsCard = ({ article }) => {
  const [imgError, setImgError] = useState(false);

  const formattedDate = article.publish_date
    ? new Date(article.publish_date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  const tag     = article.timeframe_tag;
  const tagStyle = TIMEFRAME_STYLES[tag] || TIMEFRAME_STYLES.Context;
  const tagIcon  = TIMEFRAME_ICONS[tag]  || '⚪';

  const signalStyle = SIGNAL_STYLES[article.trading_signal] || SIGNAL_STYLES['Monitor'];

  return (
    <article className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-150">
      {/* Featured image */}
      {article.image_url && !imgError && (
        <div className="h-36 overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <div className="p-3.5 flex flex-col flex-1 gap-2">
        {/* Top row: timeframe tag + rank */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagStyle}`}>
            {tagIcon} {tag}
          </span>
          {article.rank && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">#{article.rank}</span>
          )}
        </div>

        {/* Meta row: source + date */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <Newspaper className="w-3 h-3 shrink-0" />
          <span className="font-medium truncate">{article.source}</span>
          {formattedDate && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formattedDate}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-3">{article.title}</h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}

        {/* Category + Narrative */}
        <div className="flex items-center gap-1.5 flex-wrap min-h-0">
          {article.category && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {article.category}
            </span>
          )}
          {article.narrative_title && (
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate" title={article.narrative_title}>
              {article.narrative_title}
            </p>
          )}
        </div>

        {/* Signal row */}
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700">
          {article.sentiment && <SentimentBadge sentiment={article.sentiment} />}

          {article.impact_level && (
            <span className={`text-[10px] uppercase ${IMPACT_STYLES[article.impact_level] || ''}`}>
              {article.impact_level} impact
            </span>
          )}

          {article.trading_signal && (
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${signalStyle}`}>
              <Zap className="w-2.5 h-2.5" />{article.trading_signal}
            </span>
          )}
        </div>

        {/* CTA */}
        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Read Full Article
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  );
};

export default NewsCard;
