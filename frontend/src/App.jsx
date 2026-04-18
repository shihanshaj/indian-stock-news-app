import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import { DARK_MODE_KEY } from './utils/constants';

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored !== null) return stored === 'true';
      // Respect OS preference on first load
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(DARK_MODE_KEY, darkMode); } catch (_) {}
  }, [darkMode]);

  return (
    <div className="min-h-screen">
      <Header darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
      <Home />
    </div>
  );
};

export default App;
