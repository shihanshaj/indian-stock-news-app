import { useState, useCallback } from 'react';
import { fetchStockNews } from '../utils/api';
import { SEARCH_HISTORY_KEY, MAX_SEARCH_HISTORY } from '../utils/constants';

const useStockNews = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const addToHistory = (symbol) => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      const updated = [symbol, ...history.filter((s) => s !== symbol)].slice(0, MAX_SEARCH_HISTORY);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (_) {
      // localStorage may not be available
    }
  };

  const search = useCallback(async (symbol) => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchStockNews(trimmed);
      if (result.success) {
        setData(result.data);
        addToHistory(trimmed);
      } else {
        setError(result.error || 'Something went wrong.');
      }
    } catch (err) {
      const serverError = err.response?.data?.error;
      setError(serverError || 'Failed to fetch data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, search };
};

export default useStockNews;
