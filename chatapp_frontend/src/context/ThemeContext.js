import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme state with a function to get the initial value synchronously
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    console.log('Initial theme from localStorage:', savedTheme);
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    } else {
      return 'system';
    }
  });
  
  const [actualTheme, setActualTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') return 'light';
    if (savedTheme === 'dark') return 'dark';
    // For 'system' or no saved theme, get system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Function to get system theme preference
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Function to apply theme to document
  const applyTheme = useCallback((themeToApply) => {
    console.log('Applying theme:', themeToApply);
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to document');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from document');
    }
    setActualTheme(themeToApply);
  }, []);

  // Apply initial theme immediately on mount
  useEffect(() => {
    let effectiveTheme;
    
    if (theme === 'system') {
      effectiveTheme = getSystemTheme();
      console.log('Using system theme on mount:', effectiveTheme);
    } else {
      effectiveTheme = theme;
    }
    
    applyTheme(effectiveTheme);
  }, []);

  // Apply theme changes
  useEffect(() => {
    console.log('Theme changed to:', theme);
    let effectiveTheme;
    
    if (theme === 'system') {
      effectiveTheme = getSystemTheme();
      console.log('Using system theme:', effectiveTheme);
    } else {
      effectiveTheme = theme;
    }
    
    applyTheme(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        console.log('System theme changed to:', newSystemTheme);
        applyTheme(newSystemTheme);
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [theme]);

  const setThemePreference = (newTheme) => {
    console.log('Setting theme to:', newTheme);
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  // Legacy toggle function for backward compatibility
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };

  const value = {
    theme,
    actualTheme,
    setTheme: setThemePreference,
    toggleTheme,
    isDark: actualTheme === 'dark',
    isSystem: theme === 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
