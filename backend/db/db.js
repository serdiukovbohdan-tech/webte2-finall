const { Pool } = require('pg');

const config = require('../config/config');

const pool = new Pool({
  connectionString: config.dbUrl
});

pool
  .connect()
  .then((client) => {
    console.log('PostgreSQL connected successfully.');
    client.release();
  })
  .catch((error) => {
    console.error('PostgreSQL connection error:', error.message);
  });

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL client error:', error.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  query
};
