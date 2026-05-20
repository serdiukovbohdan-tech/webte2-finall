const { query } = require('../db/db');

const logs = [];
let databaseWarningShown = false;

async function persistLog(entry) {
  try {
    await query(
      `INSERT INTO request_logs
        (method, path, status_code, duration_ms, requested_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.method,
        entry.path,
        entry.statusCode,
        entry.durationMs,
        entry.timestamp
      ]
    );
  } catch (error) {
    if (!databaseWarningShown) {
      databaseWarningShown = true;
      console.warn(
        'Request log persistence skipped because the PostgreSQL database is unavailable.'
      );
    }
  }
}

function logger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    };

    logs.unshift(entry);

    if (logs.length > 200) {
      logs.length = 200;
    }

    void persistLog(entry);
  });

  next();
}

logger.getLogs = () => logs;

module.exports = logger;
