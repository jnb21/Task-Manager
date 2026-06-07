import { useState } from 'react';
import { useTasks }                  from './hooks/useTasks';
import { useTheme }                  from './hooks/useTheme';
import { useNotificationScheduler }  from './hooks/useNotifications';
import { useAuth }   from './context/AuthContext';
import Sidebar       from './components/Sidebar';
import Topbar        from './components/Topbar';
import MetricsGrid   from './components/MetricsGrid';
import TaskList      from './components/TaskList';
import Modal         from './components/Modal';
import AuthPage      from './components/AuthPage';

export default function App() {
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="auth-page" />;
  if (!user)   return <AuthPage />;

  return <Dashboard onLogout={logout} />;
}

function Dashboard({ onLogout }) {
  const {
    tasks, visibleTasks, stats,
    addTask, updateTask, deleteTask, toggleComplete, reorderTasks,
    activeCategory, setActiveCategory,
    activeFilter,   setActiveFilter,
    searchQuery,    setSearchQuery,
    sortOrder,      setSortOrder,
  } = useTasks();

  const { isDark, toggleTheme } = useTheme();
  useNotificationScheduler(tasks);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal]             = useState({ open: false, editingId: null });

  const openModal  = (id = null) => setModal({ open: true,  editingId: id });
  const closeModal = ()          => setModal({ open: false, editingId: null });

  function handleSave(data) {
    if (modal.editingId) {
      updateTask(modal.editingId, data);
    } else {
      addTask(data);
    }
    closeModal();
  }

  const editingTask = modal.editingId
    ? tasks.find(t => t.id === modal.editingId) ?? null
    : null;

  const pageTitle = activeCategory === 'All' ? 'All Tasks' : activeCategory;

  return (
    <>
      {sidebarOpen && (
        <div className="overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onLogout={onLogout}
        />

        <main className="main">
          <Topbar
            pageTitle={pageTitle}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onAddTask={() => openModal()}
            onMenuClick={() => setSidebarOpen(true)}
            tasks={tasks}
            onToggleComplete={toggleComplete}
          />

          <div className="content">
            <MetricsGrid stats={stats} />

            <div className="content-header">
              <span className="task-count-label">
                {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
              </span>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-label="Sort tasks"
              >
                {sortOrder === 'custom' && (
                  <option value="custom">Custom order</option>
                )}
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="due">By due date</option>
                <option value="priority">By priority</option>
              </select>
            </div>

            <TaskList
              tasks={visibleTasks}
              onToggleComplete={toggleComplete}
              onEdit={openModal}
              onDelete={deleteTask}
              onReorder={reorderTasks}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
            />
          </div>
        </main>
      </div>

      <Modal
        isOpen={modal.open}
        task={editingTask}
        onSave={handleSave}
        onClose={closeModal}
      />
    </>
  );
}
