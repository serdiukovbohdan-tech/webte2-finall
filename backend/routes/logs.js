const express = require('express');

const auth = require('../middleware/auth');
const { query } = require('../db/db');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
  const offset = (page - 1) * limit;

  try {
    const [logsResult, totalResult] = await Promise.all([
      query(
        `SELECT id, session_id, command, output, is_error, created_at
         FROM logs
         ORDER BY created_at DESC, id DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) AS total FROM logs')
    ]);

    return res.json({
      logs: logsResult.rows,
      total: Number(totalResult.rows[0].total),
      page,
      limit
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, session_id, command, output, is_error, created_at
       FROM logs
       ORDER BY created_at DESC, id DESC`
    );

    const headers = ['id', 'session_id', 'command', 'output', 'is_error', 'created_at'];
    const lines = [
      headers.join(','),
      ...result.rows.map((row) =>
        [
          row.id,
          row.session_id,
          row.command,
          row.output,
          row.is_error,
          row.created_at
        ]
          .map(escapeCsvValue)
          .join(',')
      )
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    return res.send(lines.join('\n'));
  } catch (error) {
    return next(error);
  }
});

function escapeCsvValue(value) {
  const stringValue = value == null ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

module.exports = router;
