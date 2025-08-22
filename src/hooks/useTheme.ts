import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useKV<Theme>('theme', 'light');

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}