'use strict';

// ============================================================
// STATE
// ============================================================
const STORAGE_KEY       = 'taskflow_v1';
const NOTIF_SESSION_KEY = 'taskflow_notified';

let tasks          = [];
let activeCategory = 'All';
let activeFilter   = 'all';
let searchQuery    = '';
let sortOrder      = 'newest';
let editingId      = null;
let dragSrcId      = null;
let dragOverId     = null;
let dragAfter      = false;

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

  if (sortOrder !== 'custom') {
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
  }

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

// Returns enriched task objects with .diffDays (0 = today, <0 = overdue)
function getNotifiableTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks
    .filter(t => !t.completed && t.dueDate)
    .map(t => {
      const [y, m, d] = t.dueDate.split('-').map(Number);
      const due      = new Date(y, m - 1, d);
      const diffDays = Math.round((due - today) / 86400000);
      return { ...t, diffDays };
    })
    .filter(t => t.diffDays <= 0)
    .sort((a, b) => a.diffDays - b.diffDays);
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
  updateNotifBadge();
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
  const visible = getVisibleTasks();
  const listEl  = document.getElementById('task-list');
  const emptyEl = document.getElementById('empty-state');
  const countEl = document.getElementById('task-count-label');

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
    <li class="task-card${task.completed ? ' done' : ''}${overdue ? ' overdue' : ''}"
        draggable="true"
        data-id="${task.id}"
        data-priority="${task.priority}">
      <div class="drag-handle" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <circle cx="7" cy="5" r="1.4"/><circle cx="13" cy="5" r="1.4"/>
          <circle cx="7" cy="10" r="1.4"/><circle cx="13" cy="10" r="1.4"/>
          <circle cx="7" cy="15" r="1.4"/><circle cx="13" cy="15" r="1.4"/>
        </svg>
      </div>
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

  document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('modal-save').textContent  = task ? 'Save Changes' : 'Add Task';
  document.getElementById('f-title').value           = task ? task.title       : '';
  document.getElementById('f-desc').value            = task ? task.description : '';
  document.getElementById('f-category').value        = task ? task.category    : 'Personal';
  document.getElementById('f-priority').value        = task ? task.priority    : 'Medium';
  document.getElementById('f-due').value             = task ? task.dueDate     : '';
  document.getElementById('title-error').textContent = '';

  const icon = document.querySelector('.modal-title-icon');
  if (icon) icon.innerHTML = task
    ? `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>`
    : `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>`;

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
// NOTIFICATIONS — IN-APP
// ============================================================
function updateNotifBadge() {
  const count = getNotifiableTasks().length;
  const badge = document.getElementById('notif-badge');
  const btn   = document.getElementById('notif-btn');
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.hidden = false;
    btn.classList.add('has-notif');
  } else {
    badge.hidden = true;
    btn.classList.remove('has-notif');
  }
}

function renderNotifPanel() {
  const notifiable = getNotifiableTasks();
  const body       = document.getElementById('notif-body');

  if (notifiable.length === 0) {
    body.innerHTML = `
      <div class="notif-empty">
        <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <p>All caught up!</p>
        <span>No tasks due today or overdue.</span>
      </div>`;
    return;
  }

  const overdue  = notifiable.filter(t => t.diffDays < 0);
  const dueToday = notifiable.filter(t => t.diffDays === 0);

  let html = '';
  if (overdue.length) {
    html += `<div class="notif-section-label">Overdue · ${overdue.length}</div>`;
    html += overdue.map(notifItemHTML).join('');
  }
  if (dueToday.length) {
    html += `<div class="notif-section-label">Due Today · ${dueToday.length}</div>`;
    html += dueToday.map(notifItemHTML).join('');
  }

  body.innerHTML = html;
}

function notifItemHTML(task) {
  const days    = Math.abs(task.diffDays);
  const subtext = task.diffDays === 0
    ? 'Due today'
    : `${days} day${days !== 1 ? 's' : ''} overdue`;
  const dotColor = task.priority === 'High' ? 'var(--high)'
                 : task.priority === 'Medium' ? 'var(--medium)' : 'var(--low)';

  return `
    <div class="notif-item" data-id="${task.id}">
      <div class="notif-dot" style="background:${dotColor}"></div>
      <div class="notif-item-body">
        <div class="notif-item-title">${esc(task.title)}</div>
        <div class="notif-item-sub">
          <span class="badge badge-cat" data-cat="${task.category}"
                style="font-size:10px;padding:1px 6px">${task.category}</span>
          <span class="notif-item-date${task.diffDays < 0 ? ' overdue' : ''}">${subtext}</span>
        </div>
      </div>
      <button class="notif-done-btn" data-action="notif-done" data-id="${task.id}"
              title="Mark as done" aria-label="Mark done">
        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>`;
}

function openNotifPanel() {
  renderNotifPanel();
  updateNotifEnableBtn();
  const panel = document.getElementById('notif-panel');
  panel.classList.add('open');
}

function closeNotifPanel() {
  document.getElementById('notif-panel').classList.remove('open');
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel.classList.contains('open')) {
    closeNotifPanel();
  } else {
    openNotifPanel();
  }
}

// ============================================================
// NOTIFICATIONS — BROWSER (OS-LEVEL)
// ============================================================
function getNotifiedSessionIds() {
  try { return new Set(JSON.parse(sessionStorage.getItem(NOTIF_SESSION_KEY)) || []); }
  catch { return new Set(); }
}

function markNotifiedSession(ids) {
  const existing = getNotifiedSessionIds();
  ids.forEach(id => existing.add(id));
  sessionStorage.setItem(NOTIF_SESSION_KEY, JSON.stringify([...existing]));
}

async function requestBrowserPermission() {
  if (!('Notification' in window)) return 'unavailable';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

function sendBrowserNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notifiable  = getNotifiableTasks();
  const notifiedIds = getNotifiedSessionIds();
  const fresh       = notifiable.filter(t => !notifiedIds.has(t.id));

  fresh.forEach(t => {
    const days = Math.abs(t.diffDays);
    const body = t.diffDays === 0
      ? `Due today · ${t.category} · ${t.priority} priority`
      : `${days} day${days !== 1 ? 's' : ''} overdue · ${t.category}`;

    new Notification(t.title, {
      body,
      tag: `taskflow-${t.id}`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%236366f1"/><path d="M9 16l5 5 9-9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    });
  });

  if (fresh.length) markNotifiedSession(fresh.map(t => t.id));
}

function updateNotifEnableBtn() {
  const btn = document.getElementById('notif-enable-btn');
  if (!('Notification' in window)) {
    btn.hidden = true;
    return;
  }
  const perm = Notification.permission;
  if (perm === 'granted') {
    btn.textContent = '✓ Alerts on';
    btn.className   = 'notif-enable-btn is-on';
    btn.disabled    = true;
  } else if (perm === 'denied') {
    btn.textContent = 'Alerts blocked';
    btn.className   = 'notif-enable-btn is-blocked';
    btn.disabled    = true;
  } else {
    btn.textContent = 'Enable alerts';
    btn.className   = 'notif-enable-btn';
    btn.disabled    = false;
  }
}

// ============================================================
// DARK MODE
// ============================================================
function initTheme() {
  if (localStorage.getItem('taskflow_theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('taskflow_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('taskflow_theme', 'dark');
  }
}

// ============================================================
// DRAG AND DROP
// ============================================================
function enableCustomSort() {
  if (sortOrder === 'custom') return;
  sortOrder = 'custom';
  localStorage.setItem('taskflow_sort', 'custom');
  const sel = document.getElementById('sort-select');
  if (!sel.querySelector('[value="custom"]')) {
    sel.insertBefore(new Option('Custom order', 'custom'), sel.firstChild);
  }
  sel.value = 'custom';
}

function setupDragAndDrop() {
  const listEl = document.getElementById('task-list');

  listEl.addEventListener('dragstart', e => {
    const card = e.target.closest('[data-id]');
    if (!card) return;
    dragSrcId = card.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcId);
    requestAnimationFrame(() => card.classList.add('dragging'));
  });

  listEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('[data-id]');
    if (!card || card.dataset.id === dragSrcId) return;

    const rect  = card.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    if (card.dataset.id === dragOverId && after === dragAfter) return;

    dragOverId = card.dataset.id;
    dragAfter  = after;

    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    const line = document.createElement('div');
    line.className = 'drop-indicator';
    card.insertAdjacentElement(dragAfter ? 'afterend' : 'beforebegin', line);
  });

  listEl.addEventListener('dragleave', e => {
    if (!listEl.contains(e.relatedTarget)) {
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
      dragOverId = null;
    }
  });

  listEl.addEventListener('drop', e => {
    e.preventDefault();
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    if (!dragSrcId || !dragOverId || dragSrcId === dragOverId) return;

    const fromIdx = tasks.findIndex(t => t.id === dragSrcId);
    const [moved] = tasks.splice(fromIdx, 1);
    const toIdx   = tasks.findIndex(t => t.id === dragOverId);
    tasks.splice(dragAfter ? toIdx + 1 : toIdx, 0, moved);

    enableCustomSort();
    saveTasks();
    render();
  });

  listEl.addEventListener('dragend', () => {
    document.querySelectorAll('.task-card.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    dragSrcId = null;
    dragOverId = null;
  });
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
  document.getElementById('add-task-btn').addEventListener('click', () => openModal());

  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('f-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });

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

  document.getElementById('task-list').addEventListener('change', e => {
    if (e.target.type === 'checkbox') {
      const card = e.target.closest('[data-id]');
      if (card) toggleComplete(card.dataset.id);
    }
  });

  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderTasks();
  });

  document.getElementById('sort-select').addEventListener('change', e => {
    sortOrder = e.target.value;
    localStorage.setItem('taskflow_sort', sortOrder);
    renderTasks();
  });

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

  document.getElementById('filter-list').addEventListener('click', e => {
    const item = e.target.closest('.nav-item[data-filter]');
    if (!item) return;
    document.querySelectorAll('#filter-list .nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    activeFilter = item.dataset.filter;
    renderTasks();
    if (window.innerWidth <= 768) closeSidebar();
  });

  document.getElementById('menu-btn').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Notification bell
  document.getElementById('notif-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleNotifPanel();
  });

  // "Enable alerts" button inside panel
  document.getElementById('notif-enable-btn').addEventListener('click', async () => {
    const result = await requestBrowserPermission();
    updateNotifEnableBtn();
    if (result === 'granted') sendBrowserNotifications();
  });

  // "Mark done" inside notification panel
  document.getElementById('notif-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="notif-done"]');
    if (!btn) return;
    toggleComplete(btn.dataset.id);
    // Refresh panel content without closing it
    renderNotifPanel();
    updateNotifBadge();
  });

  // Close notification panel on outside click
  document.addEventListener('click', e => {
    if (!document.getElementById('notif-wrapper').contains(e.target)) {
      closeNotifPanel();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('modal-backdrop').style.display === 'flex') {
      closeModal();
    } else if (document.getElementById('notif-panel').classList.contains('open')) {
      closeNotifPanel();
    } else {
      closeSidebar();
    }
  });

  setupDragAndDrop();
}

// ============================================================
// INIT
// ============================================================
function loadSettings() {
  const saved = localStorage.getItem('taskflow_sort');
  if (saved) {
    sortOrder = saved;
    if (sortOrder === 'custom') {
      const sel = document.getElementById('sort-select');
      sel.insertBefore(new Option('Custom order', 'custom'), sel.firstChild);
      sel.value = 'custom';
    } else {
      document.getElementById('sort-select').value = sortOrder;
    }
  }
}

function init() {
  initTheme();
  loadTasks();
  loadSettings();
  setupEvents();
  render();
  // Send browser notifications once on load; re-check every minute
  sendBrowserNotifications();
  setInterval(sendBrowserNotifications, 60_000);
}

init();
