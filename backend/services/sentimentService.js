/**
 * Lightweight keyword-based sentiment analysis.
 * No external API — works entirely offline.
 */

const BULLISH = new Set([
  'surge', 'surged', 'surges', 'jump', 'jumped', 'jumps', 'rally', 'rallied',
  'gain', 'gained', 'gains', 'rise', 'rose', 'rises', 'soar', 'soared',
  'beat', 'beats', 'beaten', 'exceed', 'exceeded', 'exceeds', 'outperform',
  'upgrade', 'upgraded', 'upgrades', 'strong', 'strength', 'growth', 'grew',
  'expand', 'expansion', 'profit', 'profits', 'profitable', 'record',
  'win', 'wins', 'won', 'awarded', 'deal', 'deals', 'contract', 'contracts',
  'positive', 'bullish', 'recovery', 'recover', 'recovered', 'uptick',
  'breakthrough', 'approve', 'approved', 'approval', 'launch', 'launched',
  'partnership', 'milestone', 'dividend', 'buyback', 'acquisition',
  'robust', 'stellar', 'impressive', 'upside', 'outpace', 'momentum',
  'inflow', 'order', 'orders', 'blockbuster', 'optimistic', 'ahead',
  'benefit', 'benefits', 'rebound', 'bounced', 'higher', 'up', 'target raised',
]);

const BEARISH = new Set([
  'fall', 'fell', 'falls', 'drop', 'dropped', 'drops', 'decline', 'declined',
  'declines', 'crash', 'crashed', 'plunge', 'plunged', 'plunges', 'tumble',
  'tumbled', 'loss', 'losses', 'miss', 'missed', 'misses', 'below',
  'downgrade', 'downgraded', 'downgrades', 'weak', 'weakness', 'slow',
  'slowdown', 'slowing', 'shrink', 'shrinking', 'concern', 'concerns',
  'risk', 'risks', 'penalty', 'fine', 'fined', 'investigation', 'probe',
  'lawsuit', 'bearish', 'warning', 'warned', 'cut', 'cuts', 'reduce',
  'reduced', 'layoff', 'layoffs', 'restructure', 'debt', 'default',
  'delay', 'delayed', 'disappointing', 'disappoint', 'underperform',
  'pressure', 'pressured', 'headwind', 'negative', 'recall', 'fraud',
  'irregularity', 'lower', 'down', 'target cut', 'erode', 'erodes',
  'slump', 'slumped', 'bleed', 'bled', 'volatile', 'uncertainty',
]);

const HIGH_WEIGHT = new Set([
  'earnings', 'quarterly results', 'profit', 'revenue', 'merger', 'acquisition',
  'fda', 'usfda', 'sebi', 'rbi', 'regulatory', 'record', 'billion', 'fraud',
  'lawsuit', 'dividend', 'buyback',
]);

/**
 * Tokenize text into lowercase words.
 */
const tokenize = (text) =>
  (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

/**
 * Analyze sentiment of a single article.
 * @returns {{ label: string, score: number }} score is 0–1 (0.5 = neutral)
 */
const analyzeArticle = (article) => {
  const text = `${article.title || ''} ${article.summary || ''}`;
  const tokens = tokenize(text);

  let bullish = 0;
  let bearish  = 0;

  for (const token of tokens) {
    const weight = HIGH_WEIGHT.has(token) ? 2 : 1;
    if (BULLISH.has(token)) bullish += weight;
    if (BEARISH.has(token)) bearish += weight;
  }

  const total = bullish + bearish;
  if (total === 0) return { label: 'Neutral', score: 0.5 };

  // raw is -1..+1, map to 0..1
  const raw = (bullish - bearish) / total;
  const score = Math.round(((raw + 1) / 2) * 100) / 100; // 2 decimal places

  const label = score >= 0.6 ? 'Bullish' : score <= 0.4 ? 'Bearish' : 'Neutral';
  return { label, score };
};

/**
 * Compute overall sentiment across an array of articles and detect trend.
 * @param {Array} articles
 * @returns {{ overall_score: number, label: string, trend: string }}
 */
const computeOverallSentiment = (articles) => {
  if (!articles.length) return { overall_score: 0.5, label: 'Neutral', trend: 'stable' };

  const scored = articles.map((a) => ({ ...a.sentiment_score !== undefined ? { score: a.sentiment_score } : analyzeArticle(a), date: a.publish_date }));

  const avgScore = scored.reduce((s, a) => s + (a.score ?? 0.5), 0) / scored.length;

  // Trend: compare last-7-days avg vs 7–30 days avg
  const now    = Date.now();
  const day7   = now - 7 * 86400000;
  const day30  = now - 30 * 86400000;

  const recent = scored.filter((a) => a.date && new Date(a.date).getTime() >= day7);
  const older  = scored.filter((a) => a.date && new Date(a.date).getTime() < day7 && new Date(a.date).getTime() >= day30);

  let trend = 'stable';
  if (recent.length >= 2 && older.length >= 2) {
    const recentAvg = recent.reduce((s, a) => s + (a.score ?? 0.5), 0) / recent.length;
    const olderAvg  = older.reduce((s, a) => s + (a.score ?? 0.5), 0) / older.length;
    if (recentAvg - olderAvg > 0.08) trend = 'improving';
    else if (olderAvg - recentAvg > 0.08) trend = 'worsening';
  }

  const overall_score = Math.round(avgScore * 100) / 100;
  const label = overall_score >= 0.6 ? 'Bullish' : overall_score <= 0.4 ? 'Bearish' : 'Neutral';
  return { overall_score, label, trend };
};

module.exports = { analyzeArticle, computeOverallSentiment };
