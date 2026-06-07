import { useState, useEffect, useMemo } from 'react';
import { isOverdue } from '../utils/dates';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

function computeVisible(tasks, { activeCategory, activeFilter, searchQuery, sortOrder }) {
  let result = tasks.slice();

  if (activeCategory !== 'All')
    result = result.filter(t => t.category === activeCategory);

  if (activeFilter === 'active')
    result = result.filter(t => !t.completed);
  else if (activeFilter === 'completed')
    result = result.filter(t => t.completed);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  if (sortOrder !== 'custom') {
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':   return new Date(a.createdAt) - new Date(b.createdAt);
        case 'due':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority': return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        default:         return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  return result;
}

export function useTasks() {
  const { user } = useAuth();

  const [tasks, setTasks]               = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter,   setActiveFilter]   = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortOrder,      setSortOrder]      = useState(
    () => localStorage.getItem('taskflow_sort') || 'newest'
  );

  useEffect(() => {
    if (!user) { setTasks([]); return; }
    apiFetch('/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('taskflow_sort', sortOrder);
  }, [sortOrder]);

  const visibleTasks = useMemo(
    () => computeVisible(tasks, { activeCategory, activeFilter, searchQuery, sortOrder }),
    [tasks, activeCategory, activeFilter, searchQuery, sortOrder]
  );

  const stats = useMemo(() => ({
    total:   tasks.length,
    done:    tasks.filter(t => t.completed).length,
    active:  tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => isOverdue(t.dueDate) && !t.completed).length,
  }), [tasks]);

  async function addTask(data) {
    const task = {
      id:          crypto.randomUUID(),
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      category:    data.category   || 'Personal',
      priority:    data.priority   || 'Medium',
      dueDate:     data.dueDate    || '',
      completed:   false,
      createdAt:   new Date().toISOString(),
      sortOrder:   0,
    };
    setTasks(prev => [task, ...prev]);
    apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(task) })
      .catch(console.error);
  }

  async function updateTask(id, data) {
    const current = tasks.find(t => t.id === id);
    if (!current) return;
    const updated = {
      ...current,
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      category:    data.category,
      priority:    data.priority,
      dueDate:     data.dueDate || '',
    };
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updated) })
      .catch(console.error);
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(console.error);
  }

  function toggleComplete(id) {
    const current = tasks.find(t => t.id === id);
    if (!current) return;
    const updated = { ...current, completed: !current.completed };
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updated) })
      .catch(console.error);
  }

  function reorderTasks(fromId, toId, after) {
    const arr      = [...tasks];
    const fromIdx  = arr.findIndex(t => t.id === fromId);
    const [moved]  = arr.splice(fromIdx, 1);
    const toIdx    = arr.findIndex(t => t.id === toId);
    arr.splice(after ? toIdx + 1 : toIdx, 0, moved);
    setTasks(arr);
    if (sortOrder !== 'custom') setSortOrder('custom');
    const order = arr.map((t, i) => ({ id: t.id, sortOrder: i }));
    apiFetch('/api/tasks/reorder', { method: 'POST', body: JSON.stringify({ order }) })
      .catch(console.error);
  }

  return {
    tasks, visibleTasks, stats,
    addTask, updateTask, deleteTask, toggleComplete, reorderTasks,
    activeCategory, setActiveCategory,
    activeFilter,   setActiveFilter,
    searchQuery,    setSearchQuery,
    sortOrder,      setSortOrder,
  };
}
