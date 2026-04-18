import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { INDIAN_STOCKS } from '../utils/constants';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="card p-6">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-red-600 dark:text-red-400">Error</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{message}</p>

        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Try one of these valid symbols:</p>
          <div className="flex flex-wrap gap-1.5">
            {INDIAN_STOCKS.slice(0, 10).map((s) => (
              <button
                key={s.symbol}
                onClick={() => onRetry && onRetry(s.symbol)}
                className="px-2 py-0.5 text-xs font-mono rounded bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>

        {onRetry && (
          <button
            onClick={() => onRetry()}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ErrorMessage;
