const axios = require('axios');
const logger = require('../utils/logger');

const NEWSAPI_BASE = 'https://newsapi.org/v2';

/**
 * Fetch news from NewsAPI for a given stock symbol / company name
 */
const fetchNews = async (symbol, companyName) => {
  const apiKey = process.env.NEWSAPI_API_KEY;
  if (!apiKey) {
    logger.warn('NEWSAPI_API_KEY not configured, skipping NewsAPI');
    return [];
  }

  // Require the company name or symbol — avoids generic market noise
  const query = companyName
    ? `"${companyName}" OR "${symbol}"`
    : `"${symbol}"`;

  // Cover 30 days (free tier max is 1 month)
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  try {
    const { data } = await axios.get(`${NEWSAPI_BASE}/everything`, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100,
        from,
        apiKey,
      },
      timeout: 10000,
    });

    if (data.status !== 'ok') {
      logger.warn('NewsAPI returned non-ok status', { status: data.status, code: data.code });
      return [];
    }

    return Array.isArray(data.articles) ? data.articles : [];
  } catch (err) {
    logger.warn('NewsAPI fetch failed', { symbol, error: err.message });
    return [];
  }
};

/**
 * Map NewsAPI article to our standard format
 */
const mapNewsApiArticle = (article) => ({
  title: article.title || '',
  source: article.source?.name || 'NewsAPI',
  publish_date: article.publishedAt ? article.publishedAt.split('T')[0] : null,
  link: article.url || '',
  summary: article.description || article.content || '',
  image_url: article.urlToImage || null,
  _origin: 'newsapi',
});

module.exports = { fetchNews, mapNewsApiArticle };
