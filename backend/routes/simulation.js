const express = require('express');

const auth = require('../middleware/auth');
const { runBallBeam, runPendulum } = require('../services/simulation.service');

const router = express.Router();

router.use(auth);

router.post('/pendulum', async (req, res) => {
  try {
    const result = await runPendulum(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Simulation failed'
    });
  }
});

router.post('/ballbeam', async (req, res) => {
  try {
    const result = await runBallBeam(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Simulation failed'
    });
  }
});

module.exports = router;
