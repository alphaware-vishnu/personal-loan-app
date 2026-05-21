/**
 * Premium HSL-based Color Palette
 * Curated for a modern, trustworthy, and premium personal finance experience.
 */

export const colors = {
  light: {
    primary: '#4F46E5', // Indigo-600
    primaryLight: '#EEF2FF', // Indigo-50
    primaryDark: '#3730A3', // Indigo-800
    
    secondary: '#10B981', // Emerald-500
    secondaryLight: '#ECFDF5', // Emerald-50
    secondaryDark: '#065F46', // Emerald-800

    accent: '#F59E0B', // Amber-500
    accentLight: '#FEF3C7', // Amber-50
    accentDark: '#92400E', // Amber-800

    background: '#FAFAFA', // Warm white
    backgroundSecondary: '#F3F4F6', // Gray-100
    backgroundTertiary: '#E5E7EB', // Gray-200
    surface: '#FFFFFF', // Pure white
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F3F4F6',

    border: '#E5E7EB', // Gray-200
    borderLight: '#F3F4F6', // Gray-100
    borderFocused: '#4F46E5', // Indigo-600
    
    text: '#111827', // Gray-900 (primary text)
    textSecondary: '#4B5563', // Gray-600 (secondary text)
    textTertiary: '#6B7280', // Gray-500
    textMuted: '#9CA3AF', // Gray-400 (muted text)
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    success: '#10B981',
    successLight: '#DEF7EC',
    warning: '#F59E0B',
    warningLight: '#FDF6B2',
    error: '#EF4444',
    errorLight: '#FDE8E8',
    info: '#3B82F6',
    infoLight: '#E1EFFE',

    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.05)',
    glassBg: 'rgba(255, 255, 255, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: '#6366F1', // Indigo-500
    primaryLight: '#1E1B4B', // Indigo-950
    primaryDark: '#4338CA', // Indigo-700
    
    secondary: '#34D399', // Emerald-400
    secondaryLight: '#064E3B', // Emerald-950
    secondaryDark: '#047857', // Emerald-700

    accent: '#FBBF24', // Amber-400
    accentLight: '#78350F', // Amber-950
    accentDark: '#B45309', // Amber-700

    background: '#0B0F19', // Premium dark blue-gray
    backgroundSecondary: '#151E2E', // Slate-800
    backgroundTertiary: '#1F2937', // Gray-800
    surface: '#151E2E', // Slate-800
    surfaceElevated: '#1E293B', // Slate-700
    surfacePressed: '#1E293B',

    border: '#1F2937', // Gray-800
    borderLight: '#374151', // Gray-700
    borderFocused: '#6366F1', // Indigo-500
    
    text: '#F9FAFB', // Gray-50
    textSecondary: '#9CA3AF', // Gray-400
    textTertiary: '#9CA3AF', // Gray-400
    textMuted: '#6B7280', // Gray-500
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    success: '#34D399',
    successLight: '#052E16',
    warning: '#FBBF24',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    info: '#60A5FA',
    infoLight: '#172554',

    cardBg: '#151E2E',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    glassBg: 'rgba(21, 30, 46, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

export type ThemeColors = {
  [K in keyof typeof colors.light]: string;
};