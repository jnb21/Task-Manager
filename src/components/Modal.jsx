import { useState, useEffect, useRef } from 'react';

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
  </svg>
);

const EMPTY = { title: '', description: '', category: 'Personal', priority: 'Medium', dueDate: '' };

export default function Modal({ isOpen, task, onSave, onClose }) {
  const [form,      setForm]      = useState(EMPTY);
  const [titleErr,  setTitleErr]  = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(task
      ? { title: task.title, description: task.description, category: task.category,
          priority: task.priority, dueDate: task.dueDate }
      : EMPTY
    );
    setTitleErr('');
    // Focus title on next frame so the animation doesn't fight it
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  function set(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setTitleErr('Title is required.');
      titleRef.current?.focus();
      return;
    }
    onSave(form);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
  }

  if (!isOpen) return null;

  const isEditing = Boolean(task);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              {isEditing ? <EditIcon /> : <PlusIcon />}
            </div>
            <h3>{isEditing ? 'Edit Task' : 'New Task'}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="f-title">
              Title <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="f-title"
              ref={titleRef}
              type="text"
              placeholder="What needs to be done?"
              maxLength={120}
              autoComplete="off"
              value={form.title}
              onChange={set('title')}
              onKeyDown={handleKeyDown}
            />
            {titleErr && (
              <span className="field-error" role="alert">{titleErr}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="f-desc">Description</label>
            <textarea
              id="f-desc"
              placeholder="Add some details (optional)..."
              rows={3}
              maxLength={400}
              value={form.description}
              onChange={set('description')}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-category">Category</label>
              <select id="f-category" value={form.category} onChange={set('category')}>
                <option value="Personal">Personal</option>
                <option value="School">School</option>
                <option value="Work">Work</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-priority">Priority</label>
              <select id="f-priority" value={form.priority} onChange={set('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-due">Due Date</label>
            <input
              id="f-due"
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
