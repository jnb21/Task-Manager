export default function MetricsGrid({ stats }) {
  const cards = [
    {
      id:    'total',
      label: 'Total Tasks',
      value: stats.total,
      color: '#6366f1',
      bg:    '#eef2ff',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
      ),
    },
    {
      id:    'active',
      label: 'In Progress',
      value: stats.active,
      color: '#3b82f6',
      bg:    '#eff6ff',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
        </svg>
      ),
    },
    {
      id:    'done',
      label: 'Completed',
      value: stats.done,
      color: '#10b981',
      bg:    '#ecfdf5',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
      ),
    },
    {
      id:    'overdue',
      label: 'Overdue',
      value: stats.overdue,
      color: '#ef4444',
      bg:    '#fef2f2',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map(c => (
        <div key={c.id} className="metric-card">
          <div
            className="metric-icon"
            style={{ '--icon-color': c.color, '--icon-bg': c.bg }}
          >
            {c.icon}
          </div>
          <div className="metric-body">
            <span className="metric-value">{c.value}</span>
            <span className="metric-label">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
