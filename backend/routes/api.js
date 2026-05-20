const express = require('express');

const docsRouter = require('./docs');
const logsRouter = require('./logs');
const simulationRouter = require('./simulation');
const statsRouter = require('./stats');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'webte2-backend',
    timestamp: new Date().toISOString()
  });
});

router.use('/simulation', simulationRouter);
router.use('/logs', logsRouter);
router.use('/stats', statsRouter);
router.use('/docs', docsRouter);

module.exports = router;
