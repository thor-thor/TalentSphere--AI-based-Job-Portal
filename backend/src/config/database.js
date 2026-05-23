const { Pool } = require('pg');
require('dotenv').config();

function parseDatabaseUrl(url) {
  // postgresql://user:pass@host:5432/dbname
  const pattern = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(pattern);
  if (!match) return null;
  return { user: match[1], password: match[2], host: match[3], port: parseInt(match[4], 10), database: match[5] };
}

const dbUrl = process.env.DATABASE_URL;
let config;
if (dbUrl) {
  const parsed = parseDatabaseUrl(dbUrl);
  if (!parsed) {
    console.error('Invalid DATABASE_URL format:', dbUrl);
    process.exit(1);
  }
  config = {
    host: parsed.host,
    port: parsed.port,
    database: parsed.database,
    user: parsed.user,
    password: parsed.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false },
  };
} else {
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'jobportal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;