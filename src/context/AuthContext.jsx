import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taskflow_token');
    if (!token) { setLoading(false); return; }

    apiFetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.user) setUser(data.user);
        else localStorage.removeItem('taskflow_token');
      })
      .catch(() => localStorage.removeItem('taskflow_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('taskflow_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('taskflow_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
