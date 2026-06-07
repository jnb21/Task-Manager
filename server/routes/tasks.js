const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function toTask(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    category:    row.category,
    priority:    row.priority,
    dueDate:     row.due_date,
    completed:   row.completed === 1,
    createdAt:   row.created_at,
    sortOrder:   row.sort_order,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC')
    .all(req.user.id);
  res.json(rows.map(toTask));
});

router.post('/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
  const stmt = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND user_id = ?');
  db.exec('BEGIN');
  try {
    for (const item of order) stmt.run(item.sortOrder, item.id, req.user.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'Reorder failed' });
  }
  res.json({ ok: true });
});

router.post('/', (req, res) => {
  const { id, title, description, category, priority, dueDate, completed, createdAt, sortOrder } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title are required' });
  db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, category, priority, due_date, completed, created_at, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, title, description || '', category || 'Personal',
    priority || 'Medium', dueDate || '', completed ? 1 : 0,
    createdAt || new Date().toISOString(), sortOrder ?? 0
  );
  res.status(201).json({ ok: true });
});

router.put('/:id', (req, res) => {
  const { title, description, category, priority, dueDate, completed, sortOrder } = req.body;
  const result = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, category = ?, priority = ?, due_date = ?, completed = ?, sort_order = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title, description || '', category, priority, dueDate || '',
    completed ? 1 : 0, sortOrder ?? 0, req.params.id, req.user.id
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
