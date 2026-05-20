const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'WEBTE2 REST API',
    auth: {
      type: 'API key',
      header: 'x-api-key',
      alternative: 'Authorization: Bearer <API_KEY>'
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint.'
      },
      {
        method: 'POST',
        path: '/api/simulation',
        description: 'Run a simulated Octave-backed task.'
      },
      {
        method: 'GET',
        path: '/api/logs',
        description: 'List recent request logs.'
      },
      {
        method: 'GET',
        path: '/api/stats',
        description: 'Read aggregated runtime statistics.'
      },
      {
        method: 'GET',
        path: '/api/docs',
        description: 'Return API documentation in JSON format.'
      }
    ]
  });
});

module.exports = router;
