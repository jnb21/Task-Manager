import { useState, useEffect, useMemo } from 'react';
import { isOverdue } from '../utils/dates';

const STORAGE_KEY  = 'taskflow_v1';
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

function loadFromStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

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
  const [tasks, setTasks] = useState(loadFromStorage);

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter,   setActiveFilter]   = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortOrder,      setSortOrder]      = useState(
    () => localStorage.getItem('taskflow_sort') || 'newest'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

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

  function addTask(data) {
    const task = {
      id:          crypto.randomUUID(),
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      category:    data.category   || 'Personal',
      priority:    data.priority   || 'Medium',
      dueDate:     data.dueDate    || '',
      completed:   false,
      createdAt:   new Date().toISOString(),
    };
    setTasks(prev => [task, ...prev]);
  }

  function updateTask(id, data) {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, title: data.title.trim(), description: (data.description || '').trim(),
            category: data.category, priority: data.priority, dueDate: data.dueDate }
        : t
    ));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function toggleComplete(id) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }

  function reorderTasks(fromId, toId, after) {
    setTasks(prev => {
      const arr      = [...prev];
      const fromIdx  = arr.findIndex(t => t.id === fromId);
      const [moved]  = arr.splice(fromIdx, 1);
      const toIdx    = arr.findIndex(t => t.id === toId);
      arr.splice(after ? toIdx + 1 : toIdx, 0, moved);
      return arr;
    });
    if (sortOrder !== 'custom') setSortOrder('custom');
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
