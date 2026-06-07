'use strict';

// ============================================================
// STATE
// ============================================================
const STORAGE_KEY = 'taskflow_v1';

let tasks         = [];
let activeCategory = 'All';
let activeFilter   = 'all';
let searchQuery    = '';
let sortOrder      = 'newest';
let editingId      = null;

// ============================================================
// STORAGE
// ============================================================
function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ============================================================
// TASK CRUD
// ============================================================
function buildTask(data) {
  return {
    id:          crypto.randomUUID(),
    title:       data.title.trim(),
    description: (data.description || '').trim(),
    category:    data.category   || 'Personal',
    priority:    data.priority   || 'Medium',
    dueDate:     data.dueDate    || '',
    completed:   false,
    createdAt:   new Date().toISOString(),
  };
}

function addTask(data) {
  tasks.unshift(buildTask(data));
  saveTasks();
  render();
}

function updateTask(id, data) {
  tasks = tasks.map(t =>
    t.id === id
      ? { ...t, title: data.title.trim(), description: (data.description || '').trim(),
          category: data.category, priority: data.priority, dueDate: data.dueDate }
      : t
  );
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  render();
}

// ============================================================
// FILTER & SORT
// ============================================================
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

function getVisibleTasks() {
  let result = tasks.slice();

  if (activeCategory !== 'All') {
    result = result.filter(t => t.category === activeCategory);
  }

  if (activeFilter === 'active') {
    result = result.filter(t => !t.completed);
  } else if (activeFilter === 'completed') {
    result = result.filter(t => t.completed);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'due':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority':
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return result;
}

// ============================================================
// DATE UTILITIES
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d) < today;
}

// ============================================================
// ESCAPE HELPER
// ============================================================
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ============================================================
// RENDER
// ============================================================
function render() {
  renderStats();
  renderTasks();
}

function renderStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const active  = total - done;
  const overdue = tasks.filter(t => isOverdue(t.dueDate) && !t.completed).length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('metric-total').textContent   = total;
  document.getElementById('metric-active').textContent  = active;
  document.getElementById('metric-done').textContent    = done;
  document.getElementById('metric-overdue').textContent = overdue;
  document.getElementById('progress-fill').style.width  = pct + '%';
  document.getElementById('progress-pct').textContent   = pct + '%';
}

function renderTasks() {
  const visible  = getVisibleTasks();
  const listEl   = document.getElementById('task-list');
  const emptyEl  = document.getElementById('empty-state');
  const countEl  = document.getElementById('task-count-label');

  countEl.textContent = `${visible.length} task${visible.length !== 1 ? 's' : ''}`;

  if (visible.length === 0) {
    listEl.innerHTML      = '';
    emptyEl.style.display = 'flex';
    document.getElementById('empty-message').textContent = searchQuery
      ? `No tasks match "${searchQuery}".`
      : activeFilter !== 'all'
        ? 'No tasks match this filter.'
        : 'Add your first task to get started.';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = visible.map(taskHTML).join('');
}

function taskHTML(task) {
  const overdue = isOverdue(task.dueDate) && !task.completed;
  const dueFmt  = formatDate(task.dueDate);

  const calIcon = `<svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
  </svg>`;

  const editIcon = `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
  </svg>`;

  const deleteIcon = `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
  </svg>`;

  return `
    <li class="task-card${task.completed ? ' done' : ''}${overdue ? ' overdue' : ''}" data-id="${task.id}" data-priority="${task.priority}">
      <div class="task-check">
        <input type="checkbox" ${task.completed ? 'checked' : ''}
          aria-label="Mark '${esc(task.title)}' complete"
          data-action="toggle">
      </div>
      <div class="task-body">
        <div class="task-title">${esc(task.title)}</div>
        ${task.description ? `<div class="task-desc">${esc(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-cat" data-cat="${task.category}">${task.category}</span>
          <span class="badge badge-priority" data-p="${task.priority}">${task.priority}</span>
          ${dueFmt ? `
            <span class="task-due${overdue ? ' overdue' : ''}">
              ${calIcon}
              ${overdue ? 'Overdue · ' : ''}${dueFmt}
            </span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn edit" data-action="edit" title="Edit task" aria-label="Edit task">${editIcon}</button>
        <button class="action-btn delete" data-action="delete" title="Delete task" aria-label="Delete task">${deleteIcon}</button>
      </div>
    </li>`;
}

// ============================================================
// MODAL
// ============================================================
function openModal(taskId = null) {
  editingId = taskId;
  const task = taskId ? tasks.find(t => t.id === taskId) : null;

  document.getElementById('modal-title').textContent    = task ? 'Edit Task' : 'New Task';
  document.getElementById('modal-save').textContent     = task ? 'Save Changes' : 'Add Task';
  document.getElementById('f-title').value              = task ? task.title       : '';
  document.getElementById('f-desc').value               = task ? task.description : '';
  document.getElementById('f-category').value           = task ? task.category    : 'Personal';
  document.getElementById('f-priority').value           = task ? task.priority    : 'Medium';
  document.getElementById('f-due').value                = task ? task.dueDate     : '';
  document.getElementById('title-error').textContent    = '';

  document.getElementById('modal-backdrop').style.display = 'flex';
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-backdrop').style.display = 'none';
  editingId = null;
}

function saveModal() {
  const title = document.getElementById('f-title').value.trim();

  if (!title) {
    document.getElementById('title-error').textContent = 'Title is required.';
    document.getElementById('f-title').focus();
    return;
  }

  document.getElementById('title-error').textContent = '';

  const data = {
    title,
    description: document.getElementById('f-desc').value,
    category:    document.getElementById('f-category').value,
    priority:    document.getElementById('f-priority').value,
    dueDate:     document.getElementById('f-due').value,
  };

  if (editingId) {
    updateTask(editingId, data);
  } else {
    addTask(data);
  }

  closeModal();
}

// ============================================================
// SIDEBAR (MOBILE)
// ============================================================
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// ============================================================
// EVENTS
// ============================================================
function setupEvents() {
  // Add task button
  document.getElementById('add-task-btn').addEventListener('click', () => openModal());

  // Modal controls
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Submit on Enter in title field
  document.getElementById('f-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });

  // Task list: delegated events (toggle, edit, delete)
  document.getElementById('task-list').addEventListener('click', e => {
    const card = e.target.closest('[data-id]');
    if (!card) return;
    const id     = card.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'toggle' || e.target.dataset.action === 'toggle') {
      toggleComplete(id);
    } else if (action === 'edit') {
      openModal(id);
    } else if (action === 'delete') {
      deleteTask(id);
    }
  });

  // Checkbox change (for keyboard interaction)
  document.getElementById('task-list').addEventListener('change', e => {
    if (e.target.type === 'checkbox') {
      const card = e.target.closest('[data-id]');
      if (card) toggleComplete(card.dataset.id);
    }
  });

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderTasks();
  });

  // Sort
  document.getElementById('sort-select').addEventListener('change', e => {
    sortOrder = e.target.value;
    renderTasks();
  });

  // Category filter
  document.getElementById('category-list').addEventListener('click', e => {
    const item = e.target.closest('.nav-item[data-category]');
    if (!item) return;
    document.querySelectorAll('#category-list .nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    activeCategory = item.dataset.category;
    document.getElementById('page-title').textContent =
      activeCategory === 'All' ? 'All Tasks' : activeCategory;
    renderTasks();
    if (window.innerWidth <= 768) closeSidebar();
  });

  // Status filter
  document.getElementById('filter-list').addEventListener('click', e => {
    const item = e.target.closest('.nav-item[data-filter]');
    if (!item) return;
    document.querySelectorAll('#filter-list .nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    activeFilter = item.dataset.filter;
    renderTasks();
    if (window.innerWidth <= 768) closeSidebar();
  });

  // Mobile sidebar
  document.getElementById('menu-btn').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('modal-backdrop').style.display === 'flex') {
      closeModal();
    } else {
      closeSidebar();
    }
  });
}

// ============================================================
// INIT
// ============================================================
function init() {
  loadTasks();
  setupEvents();
  render();
}

init();
