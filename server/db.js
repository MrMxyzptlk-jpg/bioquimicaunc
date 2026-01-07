const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',              // VERY likely correct
  host: 'localhost',
  database: 'bioquimica_forum',
  password: '9590-187l39081168-1',
  port: 5432,
});

pool.query('SELECT NOW()')
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('DB connection error', err));

module.exports = pool;
