import { formatDate, isOverdue } from '../utils/dates';

const GripIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <circle cx="7" cy="5"  r="1.4"/><circle cx="13" cy="5"  r="1.4"/>
    <circle cx="7" cy="10" r="1.4"/><circle cx="13" cy="10" r="1.4"/>
    <circle cx="7" cy="15" r="1.4"/><circle cx="13" cy="15" r="1.4"/>
  </svg>
);

const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
  </svg>
);

export default function TaskCard({
  task,
  isDragging,
  onToggleComplete,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const overdue = isOverdue(task.dueDate) && !task.completed;
  const dueFmt  = formatDate(task.dueDate);

  function handleDragOver(e) {
    e.preventDefault();
    const rect  = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    onDragOver(e, after);
  }

  const cls = [
    'task-card',
    task.completed ? 'done'    : '',
    overdue        ? 'overdue' : '',
    isDragging     ? 'dragging': '',
  ].filter(Boolean).join(' ');

  return (
    <li
      className={cls}
      draggable
      data-priority={task.priority}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="drag-handle" aria-hidden="true"><GripIcon /></div>

      <div className="task-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggleComplete}
          aria-label={`Mark '${task.title}' complete`}
        />
      </div>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div className="task-desc">{task.description}</div>
        )}
        <div className="task-meta">
          <span className="badge badge-cat" data-cat={task.category}>{task.category}</span>
          <span className="badge badge-priority" data-p={task.priority}>{task.priority}</span>
          {dueFmt && (
            <span className={`task-due${overdue ? ' overdue' : ''}`}>
              <CalIcon />
              {overdue ? 'Overdue · ' : ''}{dueFmt}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          className="action-btn edit"
          onClick={onEdit}
          title="Edit task"
          aria-label="Edit task"
        >
          <EditIcon />
        </button>
        <button
          className="action-btn delete"
          onClick={onDelete}
          title="Delete task"
          aria-label="Delete task"
        >
          <DeleteIcon />
        </button>
      </div>
    </li>
  );
}
