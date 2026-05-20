const express = require('express');
const { randomUUID } = require('crypto');

const config = require('../config/config');
const auth = require('../middleware/auth');
const { query } = require('../db/db');
const { getLocation } = require('../services/geo.service');

const router = express.Router();
const ALLOWED_ANIMATIONS = new Set(['pendulum', 'ballbeam']);

router.use(auth);

router.post('/track', async (req, res) => {
  const { animationType } = req.body || {};

  if (!ALLOWED_ANIMATIONS.has(animationType)) {
    return res.status(400).json({
      error: 'Invalid animationType'
    });
  }

  const cookies = parseCookies(req.headers.cookie);
  const userToken = cookies.user_token || randomUUID();
  const ip = normalizeIp(req.ip);

  if (!cookies.user_token) {
    res.cookie('user_token', userToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  }

  try {
    const cooldownResult = await query(
      `SELECT id
       FROM animation_stats
       WHERE user_token = $1
         AND animation_type = $2
         AND used_at >= NOW() - ($3::int * INTERVAL '1 minute')
       LIMIT 1`,
      [userToken, animationType, config.statsCooldownMin]
    );

    if (cooldownResult.rowCount > 0) {
      return res.json({
        tracked: false,
        reason: 'cooldown'
      });
    }

    const location = await getLocation(ip);

    await query(
      `INSERT INTO animation_stats (animation_type, user_token, ip, city, country)
       VALUES ($1, $2, $3, $4, $5)`,
      [animationType, userToken, ip, location.city, location.country]
    );

    return res.json({
      tracked: true
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to track stats'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT animation_type, COUNT(*)::int AS count
       FROM animation_stats
       GROUP BY animation_type`
    );

    const stats = {
      pendulum: 0,
      ballbeam: 0
    };

    result.rows.forEach((row) => {
      stats[row.animation_type] = row.count;
    });

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to load stats'
    });
  }
});

router.get('/details', async (req, res) => {
  try {
    const result = await query(
      `SELECT animation_type, user_token, city, country, used_at
       FROM animation_stats
       ORDER BY used_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to load stats details'
    });
  }
});

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function normalizeIp(ip) {
  if (!ip) {
    return '127.0.0.1';
  }

  return String(ip).replace(/^::ffff:/, '');
}

module.exports = router;
