/**
 * Two-layer scoring and ranking engine.
 *
 * LAYER 1 (latest_news):  0–48h  → strict chronological, newest first
 * LAYER 2 (context_news): >48h   → scored by:
 *   Relevance × 0.35 + Impact × 0.30 + NarrativeStrength × 0.20 + Recency × 0.15
 */

const { analyzeArticle } = require('./sentimentService');

// ─── Time helpers ──────────────────────────────────────────────────────────────

const MS_DAY = 86400000;

/** Age in ms from publish_date string (date-only → treated as start of that day) */
const getAgeMs = (dateStr) => {
  if (!dateStr) return Infinity;
  return Date.now() - new Date(dateStr).getTime();
};

/** True if the article is ≤ 48 hours old (Layer 1) */
const isLatest = (dateStr) => getAgeMs(dateStr) <= 2 * MS_DAY;

const getTimeframeTag = (dateStr) => {
  if (!dateStr) return 'Context';
  const age = getAgeMs(dateStr);
  if (age <= 2 * MS_DAY)  return 'Breaking';   // 0–48h  (Layer 1)
  if (age < 7 * MS_DAY)   return 'Developing'; // 2–7d
  if (age < 30 * MS_DAY)  return 'Trend';      // 1–4w
  return 'Context';                             // 1m+
};

// ─── Layer 2 recency weights (NOT used for Layer 1) ────────────────────────────

const getContextRecencyWeight = (dateStr) => {
  if (!dateStr) return 0.2;
  const age = getAgeMs(dateStr);
  if (age < 7 * MS_DAY)   return 0.8; // 2–7 days
  if (age < 30 * MS_DAY)  return 0.5; // 1–4 weeks
  return 0.2;                          // 1–12 months
};

// ─── Relevance ─────────────────────────────────────────────────────────────────

const buildKeywords = (symbol, companyName) => {
  const parts = new Set([symbol.toLowerCase()]);
  if (companyName) {
    companyName.toLowerCase().split(/\s+/).forEach((w) => {
      if (w.length > 3) parts.add(w);
    });
  }
  return parts;
};

const RELEVANCE_BOOST_WORDS = new Set([
  'nse', 'bse', 'india', 'stock', 'share', 'shares', 'equity', 'investors',
]);

const getRelevanceScore = (article, keywords) => {
  const titleText   = (article.title   || '').toLowerCase();
  const summaryText = (article.summary || '').toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (titleText.includes(kw))   hits += 2;
    if (summaryText.includes(kw)) hits += 1;
  }
  for (const bw of RELEVANCE_BOOST_WORDS) {
    if (titleText.includes(bw) || summaryText.includes(bw)) hits += 0.5;
  }
  return Math.min(hits / 10, 1.0);
};

// ─── Impact ────────────────────────────────────────────────────────────────────

const HIGH_IMPACT = [
  'earnings', 'quarterly results', 'merger', 'acquisition', 'fraud',
  'penalty', 'lawsuit', 'ceo', 'fda', 'usfda', 'sebi', 'rbi',
  'regulatory', 'billion', 'record profit', 'dividend', 'buyback',
  'default', 'insolvency', 'nclt', 'bankruptcy', 'rights issue',
];

const MEDIUM_IMPACT = [
  'analyst', 'target price', 'rating', 'guidance', 'forecast',
  'management', 'outlook', 'strategy', 'contract', 'deal', 'order',
  'upgrade', 'downgrade', 'partnership', 'launch',
];

const getImpactScore = (article) => {
  const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
  for (const kw of HIGH_IMPACT)   { if (text.includes(kw)) return 1.0; }
  for (const kw of MEDIUM_IMPACT) { if (text.includes(kw)) return 0.6; }
  return 0.3;
};

const getImpactLevel = (article) => {
  const score = getImpactScore(article);
  if (score >= 0.9) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  return 'LOW';
};

// ─── Trading Signal ────────────────────────────────────────────────────────────

const getTradingSignal = (sentimentLabel, impactScore, isLayerOne, finalScore) => {
  if (sentimentLabel === 'Bullish' && impactScore >= 0.9 && isLayerOne) return 'Strong Buy Signal';
  if (sentimentLabel === 'Bullish' && (finalScore >= 0.65 || isLayerOne)) return 'Bullish Signal';
  if (sentimentLabel === 'Bearish' && impactScore >= 0.9 && isLayerOne) return 'Strong Sell Signal';
  if (sentimentLabel === 'Bearish' && (finalScore >= 0.65 || isLayerOne)) return 'Bearish Signal';
  if (finalScore >= 0.55 || isLayerOne) return 'Watch';
  return 'Monitor';
};

// ─── Narrative strength map ────────────────────────────────────────────────────

const buildNarrativeStrengthMap = (articles) => {
  const counts = {};
  for (const a of articles) {
    if (a.narrative_id) counts[a.narrative_id] = (counts[a.narrative_id] || 0) + 1;
  }
  const map = {};
  for (const [id, count] of Object.entries(counts)) {
    map[id] = Math.min(count / 10, 1.0);
  }
  return map;
};

// ─── Shared article enrichment ─────────────────────────────────────────────────

const enrichArticle = (article, keywords, narrativeStrengthMap, layerOne) => {
  const sentiment  = analyzeArticle(article);
  const impact     = getImpactScore(article);
  const relevance  = getRelevanceScore(article, keywords);
  const narrative  = narrativeStrengthMap[article.narrative_id] ?? 0;
  const recency    = layerOne ? 1.0 : getContextRecencyWeight(article.publish_date);

  // Layer 1: no composite score; sorted purely by time
  // Layer 2: weighted formula
  const final_score = layerOne
    ? 1.0  // placeholder — Layer 1 sorted by date not score
    : Math.round((relevance * 0.35 + impact * 0.30 + narrative * 0.20 + recency * 0.15) * 1000) / 1000;

  const trading_signal = getTradingSignal(sentiment.label, impact, layerOne, final_score);

  return {
    ...article,
    timeframe_tag:   getTimeframeTag(article.publish_date),
    sentiment:       sentiment.label,
    sentiment_score: sentiment.score,
    impact_level:    getImpactLevel(article),
    relevance_score: Math.round(relevance * 100) / 100,
    final_score,
    trading_signal,
  };
};

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Split pre-clustered articles into two layers and process each.
 *
 * @param {Array}  articles     - Articles with narrative_id set
 * @param {string} symbol
 * @param {string} companyName
 * @returns {{ latestNews: Array, contextNews: Array }}
 */
const splitAndScore = (articles, symbol, companyName) => {
  const keywords              = buildKeywords(symbol, companyName);
  const narrativeStrengthMap  = buildNarrativeStrengthMap(articles);

  const layer1Raw = [];
  const layer2Raw = [];

  for (const a of articles) {
    if (isLatest(a.publish_date)) layer1Raw.push(a);
    else                          layer2Raw.push(a);
  }

  // ── Layer 1: enrich then sort newest-first ─────────────────────────────────
  const latestNews = layer1Raw
    .map((a) => enrichArticle(a, keywords, narrativeStrengthMap, true))
    .sort((a, b) => {
      if (!a.publish_date) return 1;
      if (!b.publish_date) return -1;
      return new Date(b.publish_date) - new Date(a.publish_date);
    })
    .slice(0, 15)
    .map((a, i) => ({ ...a, rank: i + 1 }));

  // ── Layer 2: enrich, filter noise, sort by score ───────────────────────────
  // New business-activity categories (PROJECT, ORDER, ACQUISITION, EXPANSION,
  // PRODUCT, FINANCIAL) are discarded when impact is LOW — they add noise.
  const BUSINESS_CATEGORIES = new Set(['PROJECT','ORDER','ACQUISITION','EXPANSION','PRODUCT','FINANCIAL']);

  const contextNews = layer2Raw
    .map((a) => enrichArticle(a, keywords, narrativeStrengthMap, false))
    .filter((a) => {
      if (a.category && BUSINESS_CATEGORIES.has(a.category) && a.impact_level === 'LOW') return false;
      return true;
    })
    .sort((a, b) => {
      const diff = b.final_score - a.final_score;
      if (Math.abs(diff) > 0.001) return diff;
      if (!a.publish_date) return 1;
      if (!b.publish_date) return -1;
      return new Date(b.publish_date) - new Date(a.publish_date);
    })
    .map((a, i) => ({ ...a, rank: i + 1 }));

  return { latestNews, contextNews };
};

// Legacy export kept for backward compatibility (used by old callers if any)
const scoreAndRank = (articles, symbol, companyName) => {
  const { latestNews, contextNews } = splitAndScore(articles, symbol, companyName);
  return [...latestNews, ...contextNews];
};

module.exports = { splitAndScore, scoreAndRank, getTimeframeTag, isLatest };
