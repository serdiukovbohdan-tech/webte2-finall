const express = require('express');

const auth = require('../middleware/auth');
const { runSimulation } = require('../services/simulation.service');

const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const simulation = await runSimulation(req.body || {});
    res.status(201).json(simulation);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
