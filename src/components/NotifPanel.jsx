import { useState, useEffect, useRef } from 'react';
import {
  getNotifiableTasks,
  requestBrowserPermission,
  sendBrowserNotifications,
} from '../hooks/useNotifications';
import { formatDate } from '../utils/dates';

const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
);

function permState() {
  if (!('Notification' in window)) return 'unavailable';
  return Notification.permission;
}

export default function NotifPanel({ tasks, onToggleComplete }) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [perm,    setPerm]    = useState(permState);
  const wrapperRef            = useRef(null);

  const notifiable = getNotifiableTasks(tasks);
  const count      = notifiable.length;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  async function handleEnableAlerts() {
    const result = await requestBrowserPermission();
    setPerm(result);
    if (result === 'granted') sendBrowserNotifications(tasks);
  }

  function handleMarkDone(id) {
    onToggleComplete(id);
  }

  const overdue  = notifiable.filter(t => t.diffDays < 0);
  const dueToday = notifiable.filter(t => t.diffDays === 0);

  const dotColor = (priority) =>
    priority === 'High' ? 'var(--high)' : priority === 'Medium' ? 'var(--medium)' : 'var(--low)';

  const enableBtnLabel = perm === 'granted' ? '✓ Alerts on'
                       : perm === 'denied'  ? 'Alerts blocked'
                       : 'Enable alerts';
  const enableBtnClass = `notif-enable-btn${perm === 'granted' ? ' is-on' : perm === 'denied' ? ' is-blocked' : ''}`;

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        className={`notif-btn${count > 0 ? ' has-notif' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon />
        {count > 0 && (
          <span className="notif-badge">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      <div className={`notif-panel${isOpen ? ' open' : ''}`}>
        <div className="notif-panel-header">
          <span className="notif-panel-title">Reminders</span>
          {perm !== 'unavailable' && (
            <button
              className={enableBtnClass}
              onClick={handleEnableAlerts}
              disabled={perm === 'granted' || perm === 'denied'}
            >
              {enableBtnLabel}
            </button>
          )}
        </div>

        <div id="notif-body">
          {notifiable.length === 0 ? (
            <div className="notif-empty">
              <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <p>All caught up!</p>
              <span>No tasks due today or overdue.</span>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <>
                  <div className="notif-section-label">Overdue · {overdue.length}</div>
                  {overdue.map(t => (
                    <NotifItem key={t.id} task={t} dotColor={dotColor(t.priority)} onDone={handleMarkDone} />
                  ))}
                </>
              )}
              {dueToday.length > 0 && (
                <>
                  <div className="notif-section-label">Due Today · {dueToday.length}</div>
                  {dueToday.map(t => (
                    <NotifItem key={t.id} task={t} dotColor={dotColor(t.priority)} onDone={handleMarkDone} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifItem({ task, dotColor, onDone }) {
  const days    = Math.abs(task.diffDays);
  const subtext = task.diffDays === 0
    ? 'Due today'
    : `${days} day${days !== 1 ? 's' : ''} overdue`;

  return (
    <div className="notif-item">
      <div className="notif-dot" style={{ background: dotColor }} />
      <div className="notif-item-body">
        <div className="notif-item-title">{task.title}</div>
        <div className="notif-item-sub">
          <span className="badge badge-cat" data-cat={task.category}
                style={{ fontSize: '10px', padding: '1px 6px' }}>
            {task.category}
          </span>
          <span className={`notif-item-date${task.diffDays < 0 ? ' overdue' : ''}`}>
            {subtext}
          </span>
        </div>
      </div>
      <button
        className="notif-done-btn"
        onClick={() => onDone(task.id)}
        title="Mark as done"
        aria-label="Mark done"
      >
        <CheckIcon />
      </button>
    </div>
  );
}
