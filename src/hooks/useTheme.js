import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('taskflow_theme') === 'dark'
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('taskflow_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('taskflow_theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(d => !d) };
}
