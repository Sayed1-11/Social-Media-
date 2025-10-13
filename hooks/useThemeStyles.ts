import { useTheme } from '../app/context/ThemeContext';

export function useThemeStyles() {
  const { theme } = useTheme();

  const colors = {
    light: {
      background: '#ffffff',
      surface: '#f8f9fa',
      border: '#e9ecef',
      text: '#212529',
      textSecondary: '#6c757d',
      accent: '#ff375f',
      danger: '#dc3545',
    },
    dark: {
      background: '#0a0a0a',
      surface: '#111111',
      border: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#666666',
      accent: '#ff375f',
      danger: '#dc3545',
    },
  };

  const currentColors = colors[theme];

  return {
    theme,
    colors: currentColors,
    isDark: theme === 'dark',
  };
}