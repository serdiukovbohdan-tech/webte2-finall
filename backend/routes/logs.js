const express = require('express');

const auth = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const items = logger.getLogs();

  res.json({
    count: items.length,
    items
  });
});

module.exports = router;
