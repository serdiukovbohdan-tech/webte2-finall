const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const { query } = require('./db/db');
const logger = require('./middleware/logger');
const apiRouter = require('./routes/api');
const docsRouter = require('./routes/docs');
const logsRouter = require('./routes/logs');
const simulationRouter = require('./routes/simulation');
const statsRouter = require('./routes/stats');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:8080',
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(logger);

app.get('/', (req, res) => {
  res.json({
    message: 'WEBTE2 backend is running.',
    docs: '/api/docs'
  });
});

app.use('/api/docs', docsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/stats', statsRouter);
app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  return res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

const server = app.listen(config.port, async () => {
  console.log(`Server listening on port ${config.port}`);

  try {
    await query('SELECT 1');
    console.log('Database connection test succeeded.');
  } catch (error) {
    console.error('Database connection test failed:', error.message);
  }
});

module.exports = {
  app,
  server
};
