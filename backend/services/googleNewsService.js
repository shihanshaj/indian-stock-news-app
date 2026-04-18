const axios = require('axios');
const logger = require('../utils/logger');

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search';

/**
 * Parse a simple value from XML — handles both plain and CDATA content.
 */
const extractTag = (xml, tag) => {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  return xml.match(re)?.[1]?.trim() || null;
};

/**
 * Parse all <item> blocks from RSS XML.
 */
const parseItems = (xml) => {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title  = extractTag(block, 'title');
    const link   = extractTag(block, 'link')
                || block.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/i)?.[1]
                || null;
    const pubDate = extractTag(block, 'pubDate');
    const source  = extractTag(block, 'source');
    const desc    = extractTag(block, 'description');

    if (title && link) {
      items.push({ title, link, pubDate, source, desc });
    }
  }
  return items;
};

/**
 * Fetch news from Google News RSS for a stock.
 * Runs two queries (symbol + company name) and merges the results.
 *
 * @param {string} symbol      NSE symbol e.g. "NATCOPHARM"
 * @param {string} companyName Full company name e.g. "Natco Pharma Limited"
 * @returns {Promise<Array>}   Array of mapped article objects
 */
const fetchGoogleNews = async (symbol, companyName) => {
  // Build two complementary queries
  const queries = [];

  if (companyName && companyName !== symbol) {
    // Primary: company name scoped to India/stock news
    queries.push(`"${companyName}" NSE stock`);
    // Secondary: symbol-based
    queries.push(`${symbol} NSE India stock`);
  } else {
    queries.push(`${symbol} NSE India stock`);
  }

  const seen   = new Set();
  const merged = [];

  await Promise.all(
    queries.map(async (q) => {
      try {
        const { data } = await axios.get(GOOGLE_NEWS_RSS, {
          params: { q, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockNewsBot/1.0)' },
        });

        const items = parseItems(data);
        for (const item of items) {
          if (!item.link || seen.has(item.link)) continue;
          seen.add(item.link);
          merged.push(item);
        }
      } catch (err) {
        logger.warn('Google News RSS fetch failed', { q, error: err.message });
      }
    })
  );

  return merged;
};

/**
 * Map a parsed Google News item to our standard article format.
 */
const mapGoogleNewsArticle = (item) => {
  let publish_date = null;
  if (item.pubDate) {
    try {
      publish_date = new Date(item.pubDate).toISOString().split('T')[0];
    } catch (_) {}
  }
  return {
    title:        item.title || '',
    source:       item.source || 'Google News',
    publish_date,
    link:         item.link || '',
    summary:      item.desc || '',
    image_url:    null,
    _origin:      'google_news',
  };
};

module.exports = { fetchGoogleNews, mapGoogleNewsArticle };
