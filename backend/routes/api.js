const express = require('express');
const { getStockNews, getStocksList, searchStocks } = require('../controllers/stockController');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Heavy: 5 external API calls per cache miss — stricter limit
router.get('/stock-news', apiLimiter, getStockNews);

// Light: local data only — relaxed limit
router.get('/stocks/list', searchLimiter, getStocksList);
router.get('/stocks/search', searchLimiter, searchStocks);

module.exports = router;
