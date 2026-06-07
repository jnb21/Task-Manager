const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'taskflow.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

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
  );
`);

module.exports = db;
