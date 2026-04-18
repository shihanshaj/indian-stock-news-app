import React from 'react';
import { TrendingUp, Moon, Sun } from 'lucide-react';

const Header = ({ darkMode, onToggleDark }) => (
  <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2 font-bold text-lg text-blue-600 dark:text-blue-400 select-none">
        <TrendingUp className="w-5 h-5" />
        <span>IndiaStockNews</span>
      </div>

      <button
        onClick={onToggleDark}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {darkMode
          ? <Sun className="w-5 h-5 text-yellow-400" />
          : <Moon className="w-5 h-5 text-gray-600" />
        }
      </button>
    </div>
  </header>
);

export default Header;
