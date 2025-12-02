import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createContext, useContext, useEffect, useState } from 'react';
import { createAppTheme } from '../theme';

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    // Initialize from localStorage or default to 'dark'
    return localStorage.getItem('theme') || 'dark';
  });

  // Create MUI theme based on current mode
  const theme = createAppTheme(mode);

  // Update localStorage and document attribute when theme changes
  useEffect(() => {
    localStorage.setItem('theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  };

  const contextValue = {
    mode,
    theme,
    toggleTheme,
    setMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}