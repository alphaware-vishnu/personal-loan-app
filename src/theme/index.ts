import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, radii, shadows, SCREEN_PADDING } from './spacing';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  screenPadding: number;
}

interface ThemeContextType {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>((systemScheme as ThemeMode) || 'light');

  useEffect(() => {
    if (systemScheme) {
      setMode(systemScheme as ThemeMode);
    }
  }, [systemScheme]);

  const activeColors = colors[mode];

  const theme: AppTheme = {
    mode,
    colors: activeColors,
    typography,
    spacing,
    radii,
    shadows,
    screenPadding: SCREEN_PADDING,
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, mode, setMode } },
    children
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};
