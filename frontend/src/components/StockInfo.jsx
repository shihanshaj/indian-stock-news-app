import React from 'react';
import { IndianRupee, Building2, LayoutGrid, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

// Only renders if value is truthy (non-empty, non-null, non-'N/A')
const Stat = ({ icon: Icon, label, value }) => {
  if (!value || value === 'N/A') return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
};

const SentimentPanel = ({ sentiment }) => {
  if (!sentiment) return null;

  const { label, overall_score, trend } = sentiment;

  const labelColor =
    label === 'Bullish' ? 'text-emerald-600 dark:text-emerald-400' :
    label === 'Bearish' ? 'text-red-600 dark:text-red-400'         :
    'text-gray-500 dark:text-gray-400';

  const bgColor =
    label === 'Bullish' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
    label === 'Bearish' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'               :
    'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';

  const SentIcon =
    label === 'Bullish' ? TrendingUp  :
    label === 'Bearish' ? TrendingDown :
    Minus;

  const trendLabel =
    trend === 'improving' ? '↑ improving' :
    trend === 'worsening' ? '↓ worsening' :
    '→ stable';

  const trendColor =
    trend === 'improving' ? 'text-emerald-500' :
    trend === 'worsening' ? 'text-red-500'      :
    'text-gray-400';

  const pct = Math.round(overall_score * 100);

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${bgColor}`}>
      <SentIcon className={`w-5 h-5 ${labelColor} shrink-0`} />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Market Sentiment</p>
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm ${labelColor}`}>{label}</p>
          <span className={`text-xs font-semibold ${trendColor}`}>{trendLabel}</span>
        </div>
      </div>
      <div className="ml-auto text-right">
        <p className="text-[10px] text-gray-400">Confidence</p>
        <p className={`font-bold text-sm ${labelColor}`}>{pct}%</p>
      </div>
    </div>
  );
};

const StockInfo = ({ data }) => {
  const hasPrice         = data.price != null && data.price > 0;
  const hasChangePercent = data.change_percent != null;
  const hasMarketCap     = data.market_cap != null && data.market_cap !== 'N/A';

  const priceDisplay = hasPrice
    ? `${data.currency === 'INR' ? '₹' : (data.currency || '') + ' '}${Number(data.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  const changeDisplay = hasChangePercent
    ? `${data.change_percent >= 0 ? '+' : ''}${data.change_percent.toFixed(2)}%`
    : null;

  const changeColor =
    data.change_percent > 0  ? 'text-emerald-600 dark:text-emerald-400' :
    data.change_percent < 0  ? 'text-red-600 dark:text-red-400'         :
    'text-gray-500 dark:text-gray-400';

  const totalArticles = (data.latest_news?.length ?? 0) + (data.context_news?.length ?? 0);

  // Collect stats that actually have values to decide grid columns
  const statsWithValues = [
    hasPrice       && 'price',
    data.sector    && 'sector',
    hasMarketCap   && 'market_cap',
    true           && 'articles',   // always shown
  ].filter(Boolean);

  return (
    <div className="card p-4 space-y-3">
      {/* Company header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight truncate">{data.company_name}</h2>
          <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
            NSE: {data.symbol}
          </span>
        </div>

        {/* Price + change — only when valid */}
        {hasPrice && (
          <div className="text-right shrink-0">
            <p className="font-bold text-lg leading-tight">{priceDisplay}</p>
            {changeDisplay && (
              <p className={`text-sm font-semibold ${changeColor}`}>{changeDisplay}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats grid — only non-null stats */}
      {statsWithValues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {hasPrice && (
            <Stat icon={IndianRupee} label="Current Price" value={priceDisplay} />
          )}
          <Stat icon={LayoutGrid} label="Sector"     value={data.sector} />
          {hasMarketCap && (
            <Stat icon={Building2} label="Market Cap" value={data.market_cap} />
          )}
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">News Articles</p>
              <p className="font-semibold text-sm">{totalArticles}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment panel */}
      {data.sentiment && <SentimentPanel sentiment={data.sentiment} />}

      {data.last_updated && (
        <p className="text-xs text-gray-400">
          Last updated: {new Date(data.last_updated).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
};

export default StockInfo;
