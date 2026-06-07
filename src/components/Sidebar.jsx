const NAV_CATEGORIES = [
  {
    key: 'All',
    label: 'All Tasks',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    key: 'Personal',
    label: 'Personal',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    key: 'School',
    label: 'School',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
      </svg>
    ),
  },
  {
    key: 'Work',
    label: 'Work',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
      </svg>
    ),
  },
];

const STATUS_FILTERS = [
  { key: 'all',       label: 'All',       dotClass: 'filter-dot all' },
  { key: 'active',    label: 'Active',    dotClass: 'filter-dot active-dot' },
  { key: 'completed', label: 'Completed', dotClass: 'filter-dot done-dot' },
];

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
  </svg>
);

export default function Sidebar({
  isOpen,
  onClose,
  stats,
  activeCategory,
  onCategoryChange,
  activeFilter,
  onFilterChange,
}) {
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="logo-text">TaskFlow</span>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      <div className="sidebar-progress">
        <div className="progress-header">
          <span className="progress-title">Overall Progress</span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Categories</p>
        <ul>
          {NAV_CATEGORIES.map(cat => (
            <li
              key={cat.key}
              className={`nav-item${activeCategory === cat.key ? ' active' : ''}`}
              data-category={cat.key}
              onClick={() => { onCategoryChange(cat.key); if (window.innerWidth <= 768) onClose(); }}
            >
              <span className="nav-icon">{cat.icon}</span>
              {cat.label}
            </li>
          ))}
        </ul>

        <p className="nav-label">Status</p>
        <ul>
          {STATUS_FILTERS.map(f => (
            <li
              key={f.key}
              className={`nav-item${activeFilter === f.key ? ' active' : ''}`}
              data-filter={f.key}
              onClick={() => { onFilterChange(f.key); if (window.innerWidth <= 768) onClose(); }}
            >
              <span className={f.dotClass} />
              {f.label}
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">JB</div>
          <div className="user-info">
            <span className="user-name">Jordan Bikong</span>
            <span className="user-role">Personal workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
