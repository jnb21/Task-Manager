import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode]       = useState('login');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ email: '', username: '', password: '' });

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, username: form.username, password: form.password };

      const res  = await apiFetch(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      login(data.token, data.user);
    } catch {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError('');
    setForm({ email: '', username: '', password: '' });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="logo-text" style={{ color: 'var(--text)', fontSize: 20 }}>TaskFlow</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
            Sign in
          </button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => switchMode('register')}>
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update}
              required
              autoComplete="email"
            />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={update}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
              value={form.password}
              onChange={update}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
