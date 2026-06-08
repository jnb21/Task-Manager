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
    completed:   row.completed === 1 || row.completed === true,
    createdAt:   row.created_at,
    sortOrder:   Number(row.sort_order),
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM tasks WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC',
      args: [req.user.id],
    });
    res.json(result.rows.map(toTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reorder', async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
  try {
    await db.batch(
      order.map(item => ({
        sql: 'UPDATE tasks SET sort_order = ? WHERE id = ? AND user_id = ?',
        args: [item.sortOrder, item.id, req.user.id],
      })),
      'write'
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reorder failed' });
  }
});

router.post('/', async (req, res) => {
  const { id, title, description, category, priority, dueDate, completed, createdAt, sortOrder } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title are required' });
  try {
    await db.execute({
      sql: `INSERT INTO tasks (id, user_id, title, description, category, priority, due_date, completed, created_at, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, req.user.id, title, description || '', category || 'Personal',
        priority || 'Medium', dueDate || '', completed ? 1 : 0,
        createdAt || new Date().toISOString(), sortOrder ?? 0,
      ],
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, description, category, priority, dueDate, completed, sortOrder } = req.body;
  try {
    const result = await db.execute({
      sql: `UPDATE tasks
            SET title = ?, description = ?, category = ?, priority = ?, due_date = ?, completed = ?, sort_order = ?
            WHERE id = ? AND user_id = ?`,
      args: [
        title, description || '', category, priority, dueDate || '',
        completed ? 1 : 0, sortOrder ?? 0, req.params.id, req.user.id,
      ],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
