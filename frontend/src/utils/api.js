import axios from 'axios';

// In production this will be set to the Railway backend URL via Vercel env vars.
// During local dev, Vite proxies /api → localhost:3001 so BASE_URL can be empty.
const BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const fetchStockNews = async (symbol) => {
  const { data } = await client.get(`/api/stock-news`, { params: { symbol } });
  return data;
};

export const fetchStocksList = async () => {
  const { data } = await client.get('/api/stocks/list');
  return data;
};

export const searchStocksApi = async (q) => {
  const { data } = await client.get('/api/stocks/search', { params: { q } });
  return data;
};
