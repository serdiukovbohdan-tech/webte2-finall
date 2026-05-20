const express = require('express');

const docsRouter = require('./docs');
const auth = require('../middleware/auth');
const { query } = require('../db/db');
const { createSession, runCommand } = require('../services/octave.service');
const logsRouter = require('./logs');
const simulationRouter = require('./simulation');
const statsRouter = require('./stats');

const router = express.Router();

router.use('/docs', docsRouter);
router.use(auth);

router.post('/session/new', async (req, res, next) => {
  try {
    const sessionId = createSession();

    await query(
      `INSERT INTO sessions (id)
       VALUES ($1)
       ON CONFLICT (id) DO NOTHING`,
      [sessionId]
    );

    res.json({ sessionId });
  } catch (error) {
    next(error);
  }
});

router.post('/compute', async (req, res, next) => {
  const { command, sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  try {
    const { output, error } = await runCommand(sessionId, command || '');

    await query(
      `INSERT INTO sessions (id, last_active)
       VALUES ($1, NOW())
       ON CONFLICT (id)
       DO UPDATE SET last_active = EXCLUDED.last_active`,
      [sessionId]
    );

    await query(
      `INSERT INTO logs (session_id, command, output, is_error)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, command || '', error || output, Boolean(error)]
    );

    return res.json({
      result: output,
      sessionId,
      error: error || null
    });
  } catch (error) {
    return next(error);
  }
});

router.use('/logs', logsRouter);
router.use('/simulation', simulationRouter);
router.use('/stats', statsRouter);

module.exports = router;
