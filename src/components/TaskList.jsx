import { useState, Fragment } from 'react';
import TaskCard from './TaskCard';

function EmptyState({ searchQuery, activeFilter }) {
  const msg = searchQuery
    ? `No tasks match "${searchQuery}".`
    : activeFilter !== 'all'
      ? 'No tasks match this filter.'
      : 'Add your first task to get started.';

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="48" height="40" rx="6" fill="#f1f5f9"/>
          <rect x="8" y="12" width="48" height="40" rx="6" stroke="#e2e8f0" strokeWidth="1.5"/>
          <rect x="18" y="24" width="28" height="3" rx="1.5" fill="#cbd5e1"/>
          <rect x="18" y="32" width="20" height="3" rx="1.5" fill="#e2e8f0"/>
          <rect x="18" y="40" width="14" height="3" rx="1.5" fill="#e2e8f0"/>
          <circle cx="50" cy="50" r="10" fill="#6366f1"/>
          <path d="M46 50l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3>No tasks found</h3>
      <p>{msg}</p>
    </div>
  );
}

export default function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onReorder,
  searchQuery,
  activeFilter,
}) {
  const [drag, setDrag] = useState({ srcId: null, overId: null, after: false });

  function handleDragStart(id) {
    setDrag(d => ({ ...d, srcId: id }));
  }

  function handleDragOver(e, id, after) {
    e.preventDefault();
    if (id === drag.srcId) return;
    setDrag(d => (d.overId === id && d.after === after) ? d : { ...d, overId: id, after });
  }

  function handleDrop(e, id) {
    e.preventDefault();
    if (drag.srcId && id && drag.srcId !== id) {
      onReorder(drag.srcId, id, drag.after);
    }
    setDrag({ srcId: null, overId: null, after: false });
  }

  function handleDragEnd() {
    setDrag({ srcId: null, overId: null, after: false });
  }

  function handleListDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDrag(d => ({ ...d, overId: null }));
    }
  }

  if (tasks.length === 0) {
    return <EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />;
  }

  return (
    <ul className="task-list" role="list" onDragLeave={handleListDragLeave}>
      {tasks.map(task => (
        <Fragment key={task.id}>
          {drag.overId === task.id && !drag.after && (
            <div className="drop-indicator" />
          )}
          <TaskCard
            task={task}
            isDragging={drag.srcId === task.id}
            onToggleComplete={() => onToggleComplete(task.id)}
            onEdit={() => onEdit(task.id)}
            onDelete={() => onDelete(task.id)}
            onDragStart={() => handleDragStart(task.id)}
            onDragOver={(e, after) => handleDragOver(e, task.id, after)}
            onDrop={(e) => handleDrop(e, task.id)}
            onDragEnd={handleDragEnd}
          />
          {drag.overId === task.id && drag.after && (
            <div className="drop-indicator" />
          )}
        </Fragment>
      ))}
    </ul>
  );
}
