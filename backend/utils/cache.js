const NodeCache = require('node-cache');

// Cache with 30-minute TTL (1800 seconds)
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

const get = (key) => cache.get(key);

const set = (key, value) => cache.set(key, value);

const del = (key) => cache.del(key);

const flush = () => cache.flushAll();

const stats = () => cache.getStats();

module.exports = { get, set, del, flush, stats };
