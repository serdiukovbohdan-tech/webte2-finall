const config = require('../config/config');

module.exports = function auth(req, res, next) {
  const authorization = req.get('authorization');
  const expectedHeader = `Bearer ${config.apiKey}`;

  if (!authorization || authorization !== expectedHeader) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  return next();
};
