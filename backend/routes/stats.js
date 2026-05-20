const express = require('express');

const config = require('../config/config');
const auth = require('../middleware/auth');
const { getStats } = require('../services/simulation.service');

const router = express.Router();

let lastServedAt = 0;

router.get('/', auth, (req, res) => {
  const cooldownMs = config.statsCooldownMin * 60 * 1000;
  const elapsedMs = Date.now() - lastServedAt;
  const retryAfterMs = lastServedAt === 0 ? 0 : cooldownMs - elapsedMs;

  if (retryAfterMs > 0) {
    return res.status(429).json({
      error: 'Stats endpoint is cooling down.',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    });
  }

  lastServedAt = Date.now();
  return res.json(getStats());
});

module.exports = router;
