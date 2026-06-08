const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL || `file:${process.env.DB_PATH || 'taskflow.db'}`,
  authToken: process.env.TURSO_TOKEN,
});

module.exports = db;
