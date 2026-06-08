const db = require('./db');

async function migrate() {
  // CREATE TABLE IF NOT EXISTS is idempotent — safe to run on every startup
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT    PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      category    TEXT    NOT NULL DEFAULT 'Personal',
      priority    TEXT    NOT NULL DEFAULT 'Medium',
      due_date    TEXT    NOT NULL DEFAULT '',
      completed   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log('Migration complete');
}

module.exports = { migrate };

if (require.main === module) {
  migrate().catch(console.error).finally(() => process.exit());
}
