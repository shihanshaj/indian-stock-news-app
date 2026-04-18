const axios = require('axios');
const logger = require('../utils/logger');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Finnhub uses US symbols by default. For Indian stocks on NSE/BSE we append .NS
// The company profile and quote endpoints also accept .NS suffixed symbols.
const toFinnhubSymbol = (symbol) => {
  // Already has exchange suffix
  if (symbol.includes('.')) return symbol.toUpperCase();
  return `${symbol.toUpperCase()}.NS`;
};

/**
 * Fetch company profile (name, sector, market cap, currency)
 */
const fetchCompanyProfile = async (symbol) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY is not configured');

  const fSymbol = toFinnhubSymbol(symbol);
  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/stock/profile2`, {
      params: { symbol: fSymbol, token: apiKey },
      timeout: 8000,
    });
    return data;
  } catch (err) {
    logger.warn('Finnhub profile fetch failed', { symbol, error: err.message });
    return null;
  }
};

/**
 * Fetch current quote (price)
 */
const fetchQuote = async (symbol) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY is not configured');

  const fSymbol = toFinnhubSymbol(symbol);
  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/quote`, {
      params: { symbol: fSymbol, token: apiKey },
      timeout: 8000,
    });
    return data;
  } catch (err) {
    logger.warn('Finnhub quote fetch failed', { symbol, error: err.message });
    return null;
  }
};

/**
 * Fetch company news from Finnhub (EXTENDED: last 12 months for multi-timeframe intelligence)
 */
const fetchCompanyNews = async (symbol) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY is not configured');

  const fSymbol = toFinnhubSymbol(symbol);
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 365); // 12 months historical

  const toDate = today.toISOString().split('T')[0];
  const fromDate = from.toISOString().split('T')[0];

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/company-news`, {
      params: { symbol: fSymbol, from: fromDate, to: toDate, token: apiKey },
      timeout: 10000,
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    logger.warn('Finnhub news fetch failed', { symbol, error: err.message });
    return [];
  }
};

/**
 * Map Finnhub news article to our standard format
 */
const mapFinnhubArticle = (article) => ({
  title: article.headline || '',
  source: article.source || 'Finnhub',
  publish_date: article.datetime
    ? new Date(article.datetime * 1000).toISOString().split('T')[0]
    : null,
  link: article.url || '',
  summary: article.summary || '',
  image_url: article.image || null,
  _origin: 'finnhub',
});

/**
 * Search for NSE-listed symbols via Finnhub symbol search
 * Returns array of { symbol, name } objects (without .NS suffix)
 */
const searchSymbols = async (query) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY is not configured');

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
      params: { q: query, token: apiKey },
      timeout: 8000,
    });

    if (!data || !Array.isArray(data.result)) return [];

    // Filter to NSE-listed stocks only (.NS suffix) and deduplicate
    const seen = new Set();
    return data.result
      .filter((r) => r.type === 'Common Stock' && r.symbol && r.symbol.endsWith('.NS'))
      .map((r) => ({
        symbol: r.symbol.replace(/\.NS$/, ''),
        name: r.description || r.symbol,
        displaySymbol: r.displaySymbol || r.symbol,
      }))
      .filter((r) => {
        if (seen.has(r.symbol)) return false;
        seen.add(r.symbol);
        return true;
      })
      .slice(0, 10);
  } catch (err) {
    logger.warn('Finnhub symbol search failed', { query, error: err.message });
    return [];
  }
};

module.exports = { fetchCompanyProfile, fetchQuote, fetchCompanyNews, mapFinnhubArticle, searchSymbols };
