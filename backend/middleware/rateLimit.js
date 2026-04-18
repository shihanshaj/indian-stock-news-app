const rateLimit = require('express-rate-limit');

// Heavy endpoint — triggers 5 external API calls per cache miss
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please wait a minute and try again.',
  },
});

// Light endpoints — local list/search, minimal cost
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please wait a minute and try again.',
  },
});

module.exports = { apiLimiter, searchLimiter };
