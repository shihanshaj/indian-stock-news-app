import React from 'react';
import { Filter, X } from 'lucide-react';

const SENTIMENT_OPTIONS = [
  { value: 'all',     label: 'All Sentiment' },
  { value: 'Bullish', label: 'Bullish' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Bearish', label: 'Bearish' },
];

const IMPACT_OPTIONS = [
  { value: 'all',    label: 'All Impact' },
  { value: 'HIGH',   label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
];

const CATEGORY_OPTIONS = [
  { value: 'all',         label: 'All Categories' },
  { value: 'PROJECT',     label: 'Projects' },
  { value: 'ORDER',       label: 'Orders' },
  { value: 'ACQUISITION', label: 'Acquisitions' },
  { value: 'EXPANSION',   label: 'Expansion' },
  { value: 'PRODUCT',     label: 'Products' },
  { value: 'FINANCIAL',   label: 'Financial' },
];

const chipBase =
  'px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap';
const chipActive =
  'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500';
const chipInactive =
  'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500';

const ChipGroup = ({ options, value, onChange }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`${chipBase} ${value === opt.value ? chipActive : chipInactive}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const FilterBar = ({ filters, onChange, narratives, resultCount, totalCount }) => {
  const { sentiment, impact, narrative, category } = filters;

  const hasActiveFilter =
    sentiment !== 'all' || impact !== 'all' || narrative !== 'all' || category !== 'all';

  const narrativeOptions = [
    { value: 'all', label: 'All Topics' },
    ...(narratives || []).map((n) => ({ value: n.id, label: n.title })),
  ];

  const clearAll = () =>
    onChange({ ...filters, sentiment: 'all', impact: 'all', narrative: 'all', category: 'all' });

  return (
    <div className="card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          Context Filters
          {hasActiveFilter && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px]">
              {resultCount} / {totalCount}
            </span>
          )}
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">Category</p>
        <ChipGroup
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => onChange({ ...filters, category: v })}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">Sentiment</p>
        <ChipGroup
          options={SENTIMENT_OPTIONS}
          value={sentiment}
          onChange={(v) => onChange({ ...filters, sentiment: v })}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">Impact</p>
        <ChipGroup
          options={IMPACT_OPTIONS}
          value={impact}
          onChange={(v) => onChange({ ...filters, impact: v })}
        />
      </div>

      {narrativeOptions.length > 1 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">Topic</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {narrativeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...filters, narrative: opt.value })}
                className={`${chipBase} ${narrative === opt.value ? chipActive : chipInactive} max-w-[200px] truncate`}
                title={opt.label}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
