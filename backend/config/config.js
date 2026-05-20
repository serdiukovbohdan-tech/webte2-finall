require('dotenv').config();

module.exports = {
  apiKey: process.env.API_KEY || 'secret123',
  slowdownMs: parseInt(process.env.SLOWDOWN_MS, 10) || 50,
  statsCooldownMin: parseInt(process.env.STATS_COOLDOWN_MIN, 10) || 10,
  dbUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:PASSWORD@localhost:5432/webte2',
  port: process.env.PORT || 3000
};
