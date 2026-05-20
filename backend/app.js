const express = require('express');
const cors = require('cors');

const config = require('./config/config');
const apiRouter = require('./routes/api');
const logger = require('./middleware/logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => {
  res.json({
    message: 'WEBTE2 backend is running.',
    docs: '/api/docs'
  });
});

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

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

module.exports = app;
