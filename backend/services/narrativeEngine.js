/**
 * Narrative clustering engine.
 * Groups articles into topic clusters using keyword pattern matching.
 * No external ML dependency — pure JS.
 */

const { computeOverallSentiment } = require('./sentimentService');

// ─── Narrative patterns ────────────────────────────────────────────────────────
// Order matters: higher patterns take priority on tie.
const NARRATIVE_PATTERNS = [
  {
    id: 'earnings',
    title: 'Earnings & Financial Results',
    keywords: [
      'earnings', 'quarterly', 'results', 'q1', 'q2', 'q3', 'q4', 'fy',
      'fy25', 'fy26', 'net profit', 'operating profit', 'ebitda', 'eps',
      'revenue', 'turnover', 'margin', 'annual results', 'half year',
    ],
    importance: 'HIGH',
  },
  {
    id: 'regulatory',
    title: 'Regulatory & Compliance',
    keywords: [
      'sebi', 'fda', 'usfda', 'rbi', 'regulatory', 'compliance', 'regulation',
      'investigation', 'probe', 'penalty', 'fine', 'notice', 'violation',
      'clearance', 'approval', 'approved', 'vai', 'warning letter', 'anda',
      'nda', 'cdsco', 'inspection',
    ],
    importance: 'HIGH',
  },
  {
    id: 'acquisition',
    title: 'Acquisitions & Takeovers',
    keywords: [
      'acquires', 'acquiring', 'acquired', 'stake purchase', 'stake acquisition',
      'controlling stake', 'majority stake', 'strategic acquisition',
      'merger', 'acquisition', 'acquire', 'takeover', 'buyout',
      'open offer', 'hostile bid', 'demerger', 'spin-off',
      'divest', 'divestiture', 'stake sale',
    ],
    importance: 'HIGH',
  },
  {
    id: 'project',
    title: 'Projects & Infrastructure Awards',
    keywords: [
      'project awarded', 'project award', 'infrastructure project',
      'development project', 'greenfield', 'brownfield', 'commissioned',
      'letter of award', 'loa', 'construction project', 'epc contract',
      'project contract', 'turnkey project', 'power project', 'road project',
      'metro project', 'railway project', 'solar project',
    ],
    importance: 'HIGH',
  },
  {
    id: 'order_win',
    title: 'Order Wins & Contract Wins',
    keywords: [
      'order win', 'order wins', 'contract secured', 'deal signed', 'tender won',
      'tender win', 'order received', 'new order', 'bulk order', 'supply order',
      'purchase order', 'framework agreement', 'work order', 'l1 bidder',
      'lowest bidder', 'qualified bidder',
    ],
    importance: 'HIGH',
  },
  {
    id: 'deals',
    title: 'Deals, Contracts & Partnerships',
    keywords: [
      'contract', 'deal', 'order', 'awarded', 'partnership', 'agreement',
      'mou', 'tie-up', 'collaboration', 'tender', 'win', 'wins', 'secured',
      'client', 'mandate', 'engagement',
    ],
    importance: 'HIGH',
  },
  {
    id: 'expansion',
    title: 'Business Expansion & Capacity',
    keywords: [
      'expansion', 'capacity increase', 'new facility', 'plant setup', 'new plant',
      'capacity expansion', 'manufacturing expansion', 'scale up', 'scale-up',
      'new market entry', 'geographic expansion', 'new geography',
      'new branch', 'new office', 'new location', 'opens in',
    ],
    importance: 'MEDIUM',
  },
  {
    id: 'product',
    title: 'Product Launches & Pipeline',
    keywords: [
      'launch', 'launched', 'launches', 'new product', 'drug', 'patent',
      'pipeline', 'nda', 'anda', 'biosimilar', 'generic', 'innovation',
      'introduce', 'unveil', 'rollout', 'commercialise', 'commercialize',
      'product rollout', 'launches new product',
    ],
    importance: 'MEDIUM',
  },
  {
    id: 'financial_dev',
    title: 'Financial Developments & Capital',
    keywords: [
      'raises funds', 'fund raise', 'fundraising', 'debt reduction', 'debt repayment',
      'capital infusion', 'rights issue', 'preferential allotment',
      'external commercial borrowing', 'ecb', 'ncd issuance', 'bond issuance',
      'credit rating', 'rating upgrade', 'rating downgrade', 'refinancing',
      'dividend', 'buyback', 'share repurchase', 'fpo', 'ipo', 'qip',
      'ncd', 'bond', 'debt', 'fundraise', 'capital raise', 'allotment', 'listing',
    ],
    importance: 'MEDIUM',
  },
  {
    id: 'analyst',
    title: 'Analyst Ratings & Price Targets',
    keywords: [
      'analyst', 'target price', 'target raised', 'target cut', 'upgrade',
      'downgrade', 'rating', 'recommend', 'buy', 'sell', 'hold', 'neutral',
      'initiating', 'coverage', 'overweight', 'underweight', 'outperform',
      'underperform', 'forecast', 'estimate',
    ],
    importance: 'MEDIUM',
  },
  {
    id: 'management',
    title: 'Management & Leadership',
    keywords: [
      'ceo', 'cfo', 'coo', 'cto', 'chairman', 'director', 'management',
      'appoint', 'appointed', 'resign', 'resignation', 'succession',
      'leadership', 'board', 'md',
    ],
    importance: 'MEDIUM',
  },
  {
    id: 'price_action',
    title: 'Price & Market Activity',
    keywords: [
      'surge', 'soar', 'rally', 'fall', 'drop', 'crash', 'plunge',
      '52-week high', '52-week low', 'breakout', 'support', 'resistance',
      'intraday', 'upper circuit', 'lower circuit', 'volume', 'technical',
    ],
    importance: 'LOW',
  },
  {
    id: 'sector',
    title: 'Sector & Macro Trends',
    keywords: [
      'sector', 'industry', 'market', 'economy', 'gdp', 'inflation',
      'interest rate', 'rbi policy', 'fed', 'nifty', 'sensex', 'budget',
      'monsoon', 'global', 'trade war', 'tariff',
    ],
    importance: 'LOW',
  },
];

// ─── Category map (narrative_id → UI category key) ────────────────────────────
// Used by the scoring engine and frontend filters.
const NARRATIVE_TO_CATEGORY = {
  project:      'PROJECT',
  order_win:    'ORDER',
  acquisition:  'ACQUISITION',
  expansion:    'EXPANSION',
  product:      'PRODUCT',
  financial_dev:'FINANCIAL',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const tokenize = (text) =>
  (text || '').toLowerCase().replace(/[^a-z0-9\s\-]/g, ' ');

const scorePattern = (text, pattern) => {
  let score = 0;
  for (const kw of pattern.keywords) {
    if (text.includes(kw)) score += kw.split(' ').length;
  }
  return score;
};

const getStatus = (articles) => {
  if (!articles.length) return 'Inactive';
  const now = Date.now();
  const mostRecent = Math.max(
    ...articles.map((a) => a.publish_date ? new Date(a.publish_date).getTime() : 0)
  );
  const age = now - mostRecent;
  if (age < 7 * 86400000)  return 'Active';
  if (age < 30 * 86400000) return 'Fading';
  return 'Inactive';
};

// ─── Main export ───────────────────────────────────────────────────────────────

const clusterNarratives = (articles, symbol, companyName) => {
  const display = companyName && companyName !== symbol ? companyName : symbol;

  // Step 1: assign each article to best pattern
  const articlesWithNarrative = articles.map((article) => {
    const text = tokenize(`${article.title} ${article.summary}`);

    let bestId    = 'general';
    let bestScore = 0;

    for (const pattern of NARRATIVE_PATTERNS) {
      const s = scorePattern(text, pattern);
      if (s > bestScore) {
        bestScore = s;
        bestId    = pattern.id;
      }
    }

    const category = NARRATIVE_TO_CATEGORY[bestId] || null;
    return { ...article, narrative_id: bestId, category };
  });

  // Step 2: build cluster stats
  const clusters = {};

  for (const pattern of NARRATIVE_PATTERNS) {
    clusters[pattern.id] = {
      id:         pattern.id,
      title:      `${display} ${pattern.title}`,
      importance: pattern.importance,
      articles:   [],
    };
  }

  clusters['general'] = {
    id:         'general',
    title:      `${display} Market News`,
    importance: 'LOW',
    articles:   [],
  };

  for (const article of articlesWithNarrative) {
    if (clusters[article.narrative_id]) {
      clusters[article.narrative_id].articles.push(article);
    }
  }

  // Step 3: compute per-cluster sentiment + status
  const narratives = Object.values(clusters)
    .filter((c) => c.articles.length > 0)
    .map((c) => {
      const sentimentResult = computeOverallSentiment(
        c.articles.map((a) => ({
          title:           a.title,
          summary:         a.summary,
          publish_date:    a.publish_date,
          sentiment_score: a.sentiment_score,
        }))
      );

      return {
        id:              c.id,
        title:           c.title,
        sentiment:       sentimentResult.label,
        sentiment_trend: sentimentResult.trend,
        importance:      c.importance,
        status:          getStatus(c.articles),
        article_count:   c.articles.length,
        category:        NARRATIVE_TO_CATEGORY[c.id] || null,
      };
    })
    .sort((a, b) => {
      const statusOrder = { Active: 0, Fading: 1, Inactive: 2 };
      const impOrder    = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const sd = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (sd !== 0) return sd;
      return (impOrder[a.importance] ?? 3) - (impOrder[b.importance] ?? 3);
    });

  // Step 4: annotate articles with narrative title
  const narrativeMap = {};
  for (const n of narratives) narrativeMap[n.id] = n.title;
  narrativeMap['general'] = clusters['general']?.title || `${display} Market News`;

  const annotated = articlesWithNarrative.map((a) => ({
    ...a,
    narrative_title: narrativeMap[a.narrative_id] || narrativeMap['general'],
  }));

  return { narratives, articlesWithNarrative: annotated };
};

module.exports = { clusterNarratives, NARRATIVE_PATTERNS, NARRATIVE_TO_CATEGORY };
