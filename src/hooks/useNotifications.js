import { useEffect } from 'react';
import { getDiffDays } from '../utils/dates';

const NOTIF_SESSION_KEY = 'taskflow_notified';

export function getNotifiableTasks(tasks) {
  return tasks
    .filter(t => !t.completed && t.dueDate)
    .map(t => ({ ...t, diffDays: getDiffDays(t.dueDate) }))
    .filter(t => t.diffDays <= 0)
    .sort((a, b) => a.diffDays - b.diffDays);
}

function getNotifiedIds() {
  try { return new Set(JSON.parse(sessionStorage.getItem(NOTIF_SESSION_KEY)) || []); }
  catch { return new Set(); }
}

function markNotified(ids) {
  const existing = getNotifiedIds();
  ids.forEach(id => existing.add(id));
  sessionStorage.setItem(NOTIF_SESSION_KEY, JSON.stringify([...existing]));
}

export function sendBrowserNotifications(tasks) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notifiable  = getNotifiableTasks(tasks);
  const notifiedIds = getNotifiedIds();
  const fresh       = notifiable.filter(t => !notifiedIds.has(t.id));

  fresh.forEach(t => {
    const days = Math.abs(t.diffDays);
    new Notification(t.title, {
      body: t.diffDays === 0
        ? `Due today · ${t.category} · ${t.priority} priority`
        : `${days} day${days !== 1 ? 's' : ''} overdue · ${t.category}`,
      tag:  `taskflow-${t.id}`,
    });
  });

  if (fresh.length) markNotified(fresh.map(t => t.id));
}

export async function requestBrowserPermission() {
  if (!('Notification' in window)) return 'unavailable';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function useNotificationScheduler(tasks) {
  useEffect(() => {
    sendBrowserNotifications(tasks);
    const id = setInterval(() => sendBrowserNotifications(tasks), 60_000);
    return () => clearInterval(id);
  }, [tasks]);
}
