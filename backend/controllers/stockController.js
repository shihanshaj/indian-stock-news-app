const cache = require('../utils/cache');
const logger = require('../utils/logger');
const { fetchCompanyProfile, fetchQuote, fetchCompanyNews, mapFinnhubArticle, searchSymbols } = require('../services/finnhubService');
const { fetchNews, mapNewsApiArticle } = require('../services/newsapiService');
const { fetchGoogleNews, mapGoogleNewsArticle } = require('../services/googleNewsService');
const { clusterNarratives } = require('../services/narrativeEngine');
const { splitAndScore } = require('../services/scoringEngine');
const { computeOverallSentiment } = require('../services/sentimentService');

// ─── Expanded Indian stock list (NSE symbols) ────────────────────────────────
const INDIAN_STOCKS = [
  { symbol: 'TCS',          name: 'Tata Consultancy Services',         sector: 'Information Technology' },
  { symbol: 'INFY',         name: 'Infosys',                           sector: 'Information Technology' },
  { symbol: 'RELIANCE',     name: 'Reliance Industries',               sector: 'Energy & Petrochemicals' },
  { symbol: 'HDFCBANK',     name: 'HDFC Bank',                         sector: 'Banking & Finance' },
  { symbol: 'ICICIBANK',    name: 'ICICI Bank',                        sector: 'Banking & Finance' },
  { symbol: 'AXISBANK',     name: 'Axis Bank',                         sector: 'Banking & Finance' },
  { symbol: 'BAJAJFINSV',   name: 'Bajaj Finserv',                     sector: 'Banking & Finance' },
  { symbol: 'BAJFINANCE',   name: 'Bajaj Finance',                     sector: 'Banking & Finance' },
  { symbol: 'MARUTI',       name: 'Maruti Suzuki',                     sector: 'Automobile' },
  { symbol: 'SBIN',         name: 'State Bank of India',               sector: 'Banking & Finance' },
  { symbol: 'WIPRO',        name: 'Wipro',                             sector: 'Information Technology' },
  { symbol: 'HCLTECH',      name: 'HCL Technologies',                  sector: 'Information Technology' },
  { symbol: 'TECHM',        name: 'Tech Mahindra',                     sector: 'Information Technology' },
  { symbol: 'LT',           name: 'Larsen & Toubro',                   sector: 'Infrastructure' },
  { symbol: 'ITC',          name: 'ITC Limited',                       sector: 'FMCG' },
  { symbol: 'SUNPHARMA',    name: 'Sun Pharmaceutical',                sector: 'Pharmaceuticals' },
  { symbol: 'DMART',        name: 'Avenue Supermarts (DMart)',          sector: 'Retail' },
  { symbol: 'NESTLEIND',    name: 'Nestle India',                      sector: 'FMCG' },
  { symbol: 'ADANIPORTS',   name: 'Adani Ports and SEZ',               sector: 'Infrastructure' },
  { symbol: 'BHARTIARTL',   name: 'Bharti Airtel',                     sector: 'Telecom' },
  { symbol: 'JSWSTEEL',     name: 'JSW Steel',                         sector: 'Metals & Mining' },
  { symbol: 'TATASTEEL',    name: 'Tata Steel',                        sector: 'Metals & Mining' },
  { symbol: 'TATAMOTORS',   name: 'Tata Motors',                       sector: 'Automobile' },
  { symbol: 'M&M',          name: 'Mahindra & Mahindra',               sector: 'Automobile' },
  { symbol: 'HINDUNILVR',   name: 'Hindustan Unilever',                sector: 'FMCG' },
  { symbol: 'KOTAKBANK',    name: 'Kotak Mahindra Bank',               sector: 'Banking & Finance' },
  { symbol: 'INDUSINDBK',   name: 'IndusInd Bank',                     sector: 'Banking & Finance' },
  { symbol: 'ASIANPAINT',   name: 'Asian Paints',                      sector: 'Consumer Goods' },
  { symbol: 'ULTRACEMCO',   name: 'UltraTech Cement',                  sector: 'Cement' },
  { symbol: 'TITAN',        name: 'Titan Company',                     sector: 'Consumer Goods' },
  { symbol: 'POWERGRID',    name: 'Power Grid Corporation',            sector: 'Power' },
  { symbol: 'NTPC',         name: 'NTPC Limited',                      sector: 'Power' },
  { symbol: 'ONGC',         name: 'Oil & Natural Gas Corporation',     sector: 'Energy & Petrochemicals' },
  { symbol: 'COALINDIA',    name: 'Coal India',                        sector: 'Mining' },
  { symbol: 'BPCL',         name: 'Bharat Petroleum Corporation',      sector: 'Energy & Petrochemicals' },
  { symbol: 'IOC',          name: 'Indian Oil Corporation',            sector: 'Energy & Petrochemicals' },
  { symbol: 'GAIL',         name: 'GAIL (India)',                      sector: 'Energy & Petrochemicals' },
  { symbol: 'CIPLA',        name: 'Cipla',                             sector: 'Pharmaceuticals' },
  { symbol: 'DRREDDY',      name: 'Dr. Reddy\'s Laboratories',         sector: 'Pharmaceuticals' },
  { symbol: 'DIVISLAB',     name: 'Divi\'s Laboratories',              sector: 'Pharmaceuticals' },
  { symbol: 'APOLLOHOSP',   name: 'Apollo Hospitals Enterprise',       sector: 'Healthcare' },
  { symbol: 'NATCOPHARM',   name: 'Natco Pharma Limited',              sector: 'Pharmaceuticals' },
  { symbol: 'LUPIN',        name: 'Lupin Limited',                     sector: 'Pharmaceuticals' },
  { symbol: 'AUROPHARMA',   name: 'Aurobindo Pharma',                  sector: 'Pharmaceuticals' },
  { symbol: 'BIOCON',       name: 'Biocon',                            sector: 'Pharmaceuticals' },
  { symbol: 'TORNTPHARM',   name: 'Torrent Pharmaceuticals',           sector: 'Pharmaceuticals' },
  { symbol: 'ZYDUSLIFE',    name: 'Zydus Lifesciences',                sector: 'Pharmaceuticals' },
  { symbol: 'ALKEM',        name: 'Alkem Laboratories',                sector: 'Pharmaceuticals' },
  { symbol: 'GLAND',        name: 'Gland Pharma',                      sector: 'Pharmaceuticals' },
  { symbol: 'ABBOTINDIA',   name: 'Abbott India',                      sector: 'Pharmaceuticals' },
  { symbol: 'EICHERMOT',    name: 'Eicher Motors',                     sector: 'Automobile' },
  { symbol: 'BAJAJ-AUTO',   name: 'Bajaj Auto',                        sector: 'Automobile' },
  { symbol: 'HEROMOTOCO',   name: 'Hero MotoCorp',                     sector: 'Automobile' },
  { symbol: 'TATAPOWER',    name: 'Tata Power Company',                sector: 'Power' },
  { symbol: 'ADANIENT',     name: 'Adani Enterprises',                 sector: 'Conglomerate' },
  { symbol: 'ADANIGREEN',   name: 'Adani Green Energy',                sector: 'Power' },
  { symbol: 'ADANITRANS',   name: 'Adani Transmission',                sector: 'Power' },
  { symbol: 'VEDL',         name: 'Vedanta Limited',                   sector: 'Metals & Mining' },
  { symbol: 'HINDALCO',     name: 'Hindalco Industries',               sector: 'Metals & Mining' },
  { symbol: 'SAIL',         name: 'Steel Authority of India',          sector: 'Metals & Mining' },
  { symbol: 'NMDC',         name: 'NMDC Limited',                      sector: 'Mining' },
  { symbol: 'GODREJCP',     name: 'Godrej Consumer Products',          sector: 'FMCG' },
  { symbol: 'MARICO',       name: 'Marico',                            sector: 'FMCG' },
  { symbol: 'DABUR',        name: 'Dabur India',                       sector: 'FMCG' },
  { symbol: 'COLPAL',       name: 'Colgate-Palmolive India',           sector: 'FMCG' },
  { symbol: 'BRITANNIA',    name: 'Britannia Industries',              sector: 'FMCG' },
  { symbol: 'TATACONSUM',   name: 'Tata Consumer Products',            sector: 'FMCG' },
  { symbol: 'PIDILITIND',   name: 'Pidilite Industries',               sector: 'Consumer Goods' },
  { symbol: 'BERGEPAINT',   name: 'Berger Paints India',               sector: 'Consumer Goods' },
  { symbol: 'HAVELLS',      name: 'Havells India',                     sector: 'Consumer Goods' },
  { symbol: 'VOLTAS',       name: 'Voltas',                            sector: 'Consumer Goods' },
  { symbol: 'WHIRLPOOL',    name: 'Whirlpool of India',                sector: 'Consumer Goods' },
  { symbol: 'PAGEIND',      name: 'Page Industries',                   sector: 'Consumer Goods' },
  { symbol: 'JUBLFOOD',     name: 'Jubilant Foodworks',                sector: 'Retail' },
  { symbol: 'TRENT',        name: 'Trent Limited',                     sector: 'Retail' },
  { symbol: 'VEDANT',       name: 'Vedant Fashions',                   sector: 'Retail' },
  { symbol: 'ZOMATO',       name: 'Zomato',                            sector: 'Technology' },
  { symbol: 'NYKAA',        name: 'FSN E-Commerce (Nykaa)',            sector: 'Technology' },
  { symbol: 'PAYTM',        name: 'One97 Communications (Paytm)',      sector: 'Technology' },
  { symbol: 'POLICYBZR',    name: 'PB Fintech (Policybazaar)',         sector: 'Technology' },
  { symbol: 'IRCTC',        name: 'Indian Railway Catering & Tourism', sector: 'Travel & Tourism' },
  { symbol: 'INDIGO',       name: 'InterGlobe Aviation (IndiGo)',      sector: 'Aviation' },
  { symbol: 'SPICEJET',     name: 'SpiceJet',                          sector: 'Aviation' },
  { symbol: 'MCDOWELL-N',   name: 'United Spirits (McDowell\'s)',      sector: 'Consumer Goods' },
  { symbol: 'UBL',          name: 'United Breweries',                  sector: 'Consumer Goods' },
  { symbol: 'MUTHOOTFIN',   name: 'Muthoot Finance',                   sector: 'Banking & Finance' },
  { symbol: 'CHOLAFIN',     name: 'Cholamandalam Investment',          sector: 'Banking & Finance' },
  { symbol: 'SHRIRAMFIN',   name: 'Shriram Finance',                   sector: 'Banking & Finance' },
  { symbol: 'MANAPPURAM',   name: 'Manappuram Finance',                sector: 'Banking & Finance' },
  { symbol: 'BANDHANBNK',   name: 'Bandhan Bank',                      sector: 'Banking & Finance' },
  { symbol: 'FEDERALBNK',   name: 'Federal Bank',                      sector: 'Banking & Finance' },
  { symbol: 'IDFCFIRSTB',   name: 'IDFC First Bank',                   sector: 'Banking & Finance' },
  { symbol: 'RBLBANK',      name: 'RBL Bank',                          sector: 'Banking & Finance' },
  { symbol: 'HDFCLIFE',     name: 'HDFC Life Insurance',               sector: 'Insurance' },
  { symbol: 'SBILIFE',      name: 'SBI Life Insurance',                sector: 'Insurance' },
  { symbol: 'ICICIPRULI',   name: 'ICICI Prudential Life Insurance',   sector: 'Insurance' },
  { symbol: 'SBICARD',      name: 'SBI Cards and Payment Services',    sector: 'Banking & Finance' },
  { symbol: 'DELHIVERY',    name: 'Delhivery',                         sector: 'Logistics' },
  { symbol: 'MAPMYINDIA',   name: 'CE Info Systems (MapmyIndia)',       sector: 'Technology' },
  { symbol: 'HAPPSTMNDS',   name: 'Happiest Minds Technologies',       sector: 'Information Technology' },
  { symbol: 'LTIM',         name: 'LTIMindtree',                       sector: 'Information Technology' },
  { symbol: 'MPHASIS',      name: 'Mphasis',                           sector: 'Information Technology' },
  { symbol: 'PERSISTENT',   name: 'Persistent Systems',                sector: 'Information Technology' },
  { symbol: 'COFORGE',      name: 'Coforge',                           sector: 'Information Technology' },
  { symbol: 'KPITTECH',     name: 'KPIT Technologies',                 sector: 'Information Technology' },
  { symbol: 'TATAELXSI',    name: 'Tata Elxsi',                        sector: 'Information Technology' },
  { symbol: 'OFSS',         name: 'Oracle Financial Services Software',sector: 'Information Technology' },
  { symbol: 'MASTEK',       name: 'Mastek',                            sector: 'Information Technology' },
  { symbol: 'SIEMENS',      name: 'Siemens India',                     sector: 'Capital Goods' },
  { symbol: 'ABB',          name: 'ABB India',                         sector: 'Capital Goods' },
  { symbol: 'BHEL',         name: 'Bharat Heavy Electricals',          sector: 'Capital Goods' },
  { symbol: 'BEL',          name: 'Bharat Electronics',                sector: 'Defence' },
  { symbol: 'HAL',          name: 'Hindustan Aeronautics',             sector: 'Defence' },
  { symbol: 'COCHINSHIP',   name: 'Cochin Shipyard',                   sector: 'Defence' },
  { symbol: 'MAZDA',        name: 'Mazda Limited',                     sector: 'Defence' },
  { symbol: 'APARINDS',     name: 'Apar Industries',                   sector: 'Capital Goods' },
  { symbol: 'CUMMINSIND',   name: 'Cummins India',                     sector: 'Capital Goods' },
  { symbol: 'THERMAX',      name: 'Thermax',                           sector: 'Capital Goods' },
  { symbol: 'GRINDWELL',    name: 'Grindwell Norton',                  sector: 'Capital Goods' },
  { symbol: 'CONCOR',       name: 'Container Corporation of India',    sector: 'Logistics' },
  { symbol: 'BLUESTARCO',   name: 'Blue Star',                         sector: 'Consumer Goods' },
  { symbol: 'CROMPTON',     name: 'Crompton Greaves Consumer',         sector: 'Consumer Goods' },
  { symbol: 'POLYCAB',      name: 'Polycab India',                     sector: 'Capital Goods' },
  { symbol: 'SCHNEIDER',    name: 'Schneider Electric India',          sector: 'Capital Goods' },
  { symbol: 'AMBER',        name: 'Amber Enterprises India',           sector: 'Consumer Goods' },
  { symbol: 'DIXON',        name: 'Dixon Technologies',                sector: 'Consumer Goods' },
  { symbol: 'CAMPUS',       name: 'Campus Activewear',                 sector: 'Consumer Goods' },
  { symbol: 'BATAINDIA',    name: 'Bata India',                        sector: 'Consumer Goods' },
  { symbol: 'RELAXO',       name: 'Relaxo Footwears',                  sector: 'Consumer Goods' },
  { symbol: 'VBL',          name: 'Varun Beverages',                   sector: 'FMCG' },
  { symbol: 'EMAMILTD',     name: 'Emami',                             sector: 'FMCG' },
  { symbol: 'JYOTHYLAB',    name: 'Jyothy Labs',                       sector: 'FMCG' },
  { symbol: 'BIKAJI',       name: 'Bikaji Foods International',        sector: 'FMCG' },
  { symbol: 'SULA',         name: 'Sula Vineyards',                    sector: 'FMCG' },
  { symbol: 'METROPOLIS',   name: 'Metropolis Healthcare',             sector: 'Healthcare' },
  { symbol: 'LALPATHLAB',   name: 'Dr Lal PathLabs',                   sector: 'Healthcare' },
  { symbol: 'THYROCARE',    name: 'Thyrocare Technologies',            sector: 'Healthcare' },
  { symbol: 'MAXHEALTH',    name: 'Max Healthcare Institute',          sector: 'Healthcare' },
  { symbol: 'FORTIS',       name: 'Fortis Healthcare',                 sector: 'Healthcare' },
  { symbol: 'NH',           name: 'Narayana Hrudayalaya',              sector: 'Healthcare' },
  { symbol: 'KIMS',         name: 'Krishna Institute of Medical Sciences', sector: 'Healthcare' },
  { symbol: 'RAINBOW',      name: 'Rainbow Childrens Medicare',        sector: 'Healthcare' },
  { symbol: 'CLEAN',        name: 'Clean Science and Technology',      sector: 'Chemicals' },
  { symbol: 'PIIND',        name: 'PI Industries',                     sector: 'Agrochemicals' },
  { symbol: 'UPL',          name: 'UPL Limited',                       sector: 'Agrochemicals' },
  { symbol: 'BAYER',        name: 'Bayer CropScience',                 sector: 'Agrochemicals' },
  { symbol: 'SUMICHEM',     name: 'Sumitomo Chemical India',           sector: 'Agrochemicals' },
  { symbol: 'SRF',          name: 'SRF Limited',                       sector: 'Chemicals' },
  { symbol: 'AAVAS',        name: 'Aavas Financiers',                  sector: 'Banking & Finance' },
  { symbol: 'HOMEFIRST',    name: 'Home First Finance Company',        sector: 'Banking & Finance' },
  { symbol: 'APTUS',        name: 'Aptus Value Housing Finance',       sector: 'Banking & Finance' },
  { symbol: 'CREDITACC',    name: 'CreditAccess Grameen',              sector: 'Banking & Finance' },
  { symbol: 'UJJIVAN',      name: 'Ujjivan Financial Services',        sector: 'Banking & Finance' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const findStock = (symbol) =>
  INDIAN_STOCKS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());

/**
 * Deduplicate articles from multiple sources by URL then title similarity.
 */
const deduplicateRaw = (...sources) => {
  const seenLinks  = new Set();
  const seenTitles = new Set();
  const merged = [];

  for (const article of sources.flat()) {
    if (!article.title || article.title === '[Removed]') continue;

    const normTitle = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').slice(0, 60).trim();

    if (article.link && seenLinks.has(article.link)) continue;
    if (seenTitles.has(normTitle)) continue;

    if (article.link)  seenLinks.add(article.link);
    seenTitles.add(normTitle);
    merged.push(article);
  }

  return merged;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/stock-news?symbol=TCS
 * Multi-timeframe intelligence: fetches up to 12 months of news,
 * clusters into narratives, scores by relevance+impact+recency+continuity.
 */
const getStockNews = async (req, res, next) => {
  try {
    const symbol = (req.query.symbol || '').trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Query parameter "symbol" is required.' });
    }

    if (!/^[A-Z0-9&\-]{1,20}$/.test(symbol)) {
      return res.status(400).json({ success: false, error: `Invalid symbol format: "${symbol}"` });
    }

    // ── Cache hit ──────────────────────────────────────────────────────────
    const cacheKey = `stock_news_v2_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Cache hit', { symbol });
      return res.json({ success: true, data: cached, cached: true });
    }

    logger.info('Cache miss – fetching from APIs', { symbol });

    // ── Resolve company meta ───────────────────────────────────────────────
    let stockMeta = findStock(symbol);
    if (!stockMeta) {
      try {
        const results = await searchSymbols(symbol);
        const match = results.find((r) => r.symbol.toUpperCase() === symbol) || results[0];
        if (match) {
          stockMeta = { symbol, name: match.name, sector: 'NSE Listed' };
        }
      } catch (_) {}
    }
    if (!stockMeta) {
      stockMeta = { symbol, name: symbol, sector: 'NSE Listed' };
    }

    // ── Parallel API calls ────────────────────────────────────────────────
    const [profile, quote, finnhubRaw, newsapiRaw, googleRaw] = await Promise.all([
      fetchCompanyProfile(symbol),
      fetchQuote(symbol),
      fetchCompanyNews(symbol),
      fetchNews(symbol, stockMeta.name !== symbol ? stockMeta.name : null),
      fetchGoogleNews(symbol, stockMeta.name !== symbol ? stockMeta.name : null),
    ]);

    // ── Map & deduplicate articles ─────────────────────────────────────────
    const finnhubArticles = finnhubRaw.map(mapFinnhubArticle);
    const newsapiArticles = newsapiRaw.map(mapNewsApiArticle);
    const googleArticles  = googleRaw.map(mapGoogleNewsArticle);
    const rawNews = deduplicateRaw(finnhubArticles, newsapiArticles, googleArticles);

    logger.info('Articles fetched', {
      symbol,
      finnhub:  finnhubArticles.length,
      newsapi:  newsapiArticles.length,
      google:   googleArticles.length,
      total:    rawNews.length,
    });

    // ── Narrative clustering ───────────────────────────────────────────────
    const companyName = profile?.name || stockMeta.name;
    const { narratives, articlesWithNarrative } = clusterNarratives(rawNews, symbol, companyName);

    // ── Two-layer scoring ─────────────────────────────────────────────────
    // Layer 1: 0–48h → strict chronological (latest_news)
    // Layer 2: >48h  → weighted score formula (context_news)
    const { latestNews, contextNews } = splitAndScore(articlesWithNarrative, symbol, companyName);

    // ── Overall sentiment from latest news first, fallback to all ─────────
    const sentimentSource = latestNews.length > 0 ? latestNews : contextNews;
    const overallSentiment = computeOverallSentiment(sentimentSource);

    // ── Build response payload (only include valid price data) ────────────
    // Omit price/change_percent/market_cap when unavailable — never send
    // N/A strings or zero-price placeholders to the frontend.
    const rawPrice = quote?.c;
    const validPrice = rawPrice != null && rawPrice > 0 ? rawPrice : null;

    const rawChange = quote?.dp;
    const validChange = rawChange != null && isFinite(rawChange) ? Math.round(rawChange * 100) / 100 : null;

    const rawMarketCap = profile?.marketCapitalization;
    const validMarketCap = rawMarketCap && rawMarketCap > 0
      ? `${(rawMarketCap / 1e5).toFixed(2)} Trillion INR`
      : null;

    const payload = {
      symbol:         stockMeta.symbol,
      company_name:   companyName,
      currency:       profile?.currency || 'INR',
      sector:         profile?.finnhubIndustry || stockMeta.sector,
      last_updated:   new Date().toISOString(),
      sentiment: {
        overall_score: overallSentiment.overall_score,
        label:         overallSentiment.label,
        trend:         overallSentiment.trend,
      },
      narratives,
      latest_news:  latestNews,
      context_news: contextNews,
    };

    // Only attach fields that have real values
    if (validPrice     !== null) payload.price          = validPrice;
    if (validChange    !== null) payload.change_percent = validChange;
    if (validMarketCap !== null) payload.market_cap     = validMarketCap;

    cache.set(cacheKey, payload);
    logger.info('Response cached', {
      symbol,
      latestCount:  latestNews.length,
      contextCount: contextNews.length,
      narrativeCount: narratives.length,
    });

    return res.json({ success: true, data: payload, cached: false });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stocks/list
 */
const getStocksList = (_req, res) => {
  res.json({ success: true, stocks: INDIAN_STOCKS });
};

/**
 * GET /api/stocks/search?q=natco
 */
const searchStocks = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().slice(0, 50);
    if (!q || q.length < 1) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required.' });
    }

    const qUpper = q.toUpperCase();

    const localMatches = INDIAN_STOCKS.filter(
      (s) =>
        s.symbol.startsWith(qUpper) ||
        s.name.toUpperCase().includes(qUpper)
    ).slice(0, 6);

    let liveMatches = [];
    if (localMatches.length < 6) {
      try {
        const results = await searchSymbols(q);
        const localSymbols = new Set(localMatches.map((s) => s.symbol.toUpperCase()));
        liveMatches = results
          .filter((r) => !localSymbols.has(r.symbol.toUpperCase()))
          .map((r) => ({ symbol: r.symbol, name: r.name, sector: 'NSE Listed' }))
          .slice(0, 6 - localMatches.length);
      } catch (_) {}
    }

    const combined = [...localMatches, ...liveMatches].slice(0, 8);
    return res.json({ success: true, results: combined });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStockNews, getStocksList, searchStocks };
