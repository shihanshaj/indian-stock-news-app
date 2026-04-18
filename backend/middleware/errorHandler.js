const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error. Please try again later.' : err.message,
  });
};

module.exports = { errorHandler };
