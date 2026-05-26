// /**
//  * Premium HSL-based Color Palette
//  * Curated for a modern, trustworthy, and premium personal finance experience.
//  */

// export const colors = {
//   light: {
//     primary: '#4F46E5', // Indigo-600
//     primaryLight: '#EEF2FF', // Indigo-50
//     primaryDark: '#3730A3', // Indigo-800
    
//     secondary: '#10B981', // Emerald-500
//     secondaryLight: '#ECFDF5', // Emerald-50
//     secondaryDark: '#065F46', // Emerald-800

//     accent: '#F59E0B', // Amber-500
//     accentLight: '#FEF3C7', // Amber-50
//     accentDark: '#92400E', // Amber-800

//     background: '#FAFAFA', // Warm white
//     backgroundSecondary: '#F3F4F6', // Gray-100
//     backgroundTertiary: '#E5E7EB', // Gray-200
//     surface: '#FFFFFF', // Pure white
//     surfaceElevated: '#FFFFFF',
//     surfacePressed: '#F3F4F6',

//     border: '#E5E7EB', // Gray-200
//     borderLight: '#F3F4F6', // Gray-100
//     borderFocused: '#4F46E5', // Indigo-600
    
//     text: '#111827', // Gray-900 (primary text)
//     textSecondary: '#4B5563', // Gray-600 (secondary text)
//     textTertiary: '#6B7280', // Gray-500
//     textMuted: '#9CA3AF', // Gray-400 (muted text)
//     textOnPrimary: '#FFFFFF',
//     textOnSecondary: '#FFFFFF',

//     success: '#10B981',
//     successLight: '#DEF7EC',
//     warning: '#F59E0B',
//     warningLight: '#FDF6B2',
//     error: '#EF4444',
//     errorLight: '#FDE8E8',
//     info: '#3B82F6',
//     infoLight: '#E1EFFE',

//     cardBg: '#FFFFFF',
//     cardBorder: 'rgba(0, 0, 0, 0.05)',
//     glassBg: 'rgba(255, 255, 255, 0.8)',
//     shadow: 'rgba(0, 0, 0, 0.08)',
//   },
//   dark: {
//     primary: '#6366F1', // Indigo-500
//     primaryLight: '#1E1B4B', // Indigo-950
//     primaryDark: '#4338CA', // Indigo-700
    
//     secondary: '#34D399', // Emerald-400
//     secondaryLight: '#064E3B', // Emerald-950
//     secondaryDark: '#047857', // Emerald-700

//     accent: '#FBBF24', // Amber-400
//     accentLight: '#78350F', // Amber-950
//     accentDark: '#B45309', // Amber-700

//     background: '#0B0F19', // Premium dark blue-gray
//     backgroundSecondary: '#151E2E', // Slate-800
//     backgroundTertiary: '#1F2937', // Gray-800
//     surface: '#151E2E', // Slate-800
//     surfaceElevated: '#1E293B', // Slate-700
//     surfacePressed: '#1E293B',

//     border: '#1F2937', // Gray-800
//     borderLight: '#374151', // Gray-700
//     borderFocused: '#6366F1', // Indigo-500
    
//     text: '#F9FAFB', // Gray-50
//     textSecondary: '#9CA3AF', // Gray-400
//     textTertiary: '#9CA3AF', // Gray-400
//     textMuted: '#6B7280', // Gray-500
//     textOnPrimary: '#FFFFFF',
//     textOnSecondary: '#FFFFFF',

//     success: '#34D399',
//     successLight: '#052E16',
//     warning: '#FBBF24',
//     warningLight: '#451A03',
//     error: '#F87171',
//     errorLight: '#450A0A',
//     info: '#60A5FA',
//     infoLight: '#172554',

//     cardBg: '#151E2E',
//     cardBorder: 'rgba(255, 255, 255, 0.05)',
//     glassBg: 'rgba(21, 30, 46, 0.8)',
//     shadow: 'rgba(0, 0, 0, 0.3)',
//   },
// } as const;

// export type ThemeColors = {
//   [K in keyof typeof colors.light]: string;
// };

/**
 * Premium Orange + Blue Theme
 * Crafted for a modern fintech / lending / banking experience.
 * Focus: trustworthy blue + energetic premium orange.
 */

export const colors = {
  light: {
    // PRIMARY BRAND (Blue)
    primary: '#2563EB', // Blue-600
    primaryLight: '#DBEAFE', // Blue-100
    primaryDark: '#1D4ED8', // Blue-700

    // SECONDARY BRAND (Orange)
    secondary: '#F97316', // Orange-500
    secondaryLight: '#FFEDD5', // Orange-100
    secondaryDark: '#C2410C', // Orange-700

    // ACCENT
    accent: '#FB923C', // Orange-400
    accentLight: '#FFF7ED', // Orange-50
    accentDark: '#EA580C', // Orange-600

    // BACKGROUNDS
    background: '#F8FAFC', // Slate-50
    backgroundSecondary: '#EFF6FF', // Blue tint
    backgroundTertiary: '#E2E8F0', // Slate-200

    // SURFACES
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F1F5F9',

    // BORDERS
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderFocused: '#2563EB',

    // TEXT
    text: '#0F172A', // Slate-900
    textSecondary: '#475569', // Slate-600
    textTertiary: '#64748B', // Slate-500
    textMuted: '#94A3B8', // Slate-400
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    // STATES
    success: '#10B981',
    successLight: '#DCFCE7',

    warning: '#F59E0B',
    warningLight: '#FEF3C7',

    error: '#EF4444',
    errorLight: '#FEE2E2',

    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // UI ELEMENTS
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(37, 99, 235, 0.08)',

    glassBg: 'rgba(255, 255, 255, 0.75)',

    shadow: 'rgba(37, 99, 235, 0.08)',

    // OPTIONAL PREMIUM GRADIENTS
    gradientPrimary: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    gradientSecondary: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
    gradientHero: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 45%, #F97316 100%)',
  },

  dark: {
    // PRIMARY BRAND (Blue)
    primary: '#60A5FA', // Blue-400
    primaryLight: '#172554', // Blue-950
    primaryDark: '#2563EB', // Blue-600

    // SECONDARY BRAND (Orange)
    secondary: '#FB923C', // Orange-400
    secondaryLight: '#431407', // Orange-950
    secondaryDark: '#EA580C', // Orange-600

    // ACCENT
    accent: '#FDBA74', // Orange-300
    accentLight: '#7C2D12',
    accentDark: '#F97316',

    // BACKGROUNDS
    background: '#0B1120', // Premium navy
    backgroundSecondary: '#111827',
    backgroundTertiary: '#1E293B',

    // SURFACES
    surface: '#111827',
    surfaceElevated: '#1E293B',
    surfacePressed: '#334155',

    // BORDERS
    border: '#1E293B',
    borderLight: '#334155',
    borderFocused: '#60A5FA',

    // TEXT
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    // STATES
    success: '#34D399',
    successLight: '#052E16',

    warning: '#FBBF24',
    warningLight: '#451A03',

    error: '#F87171',
    errorLight: '#450A0A',

    info: '#60A5FA',
    infoLight: '#172554',

    // UI ELEMENTS
    cardBg: '#111827',

    cardBorder: 'rgba(96, 165, 250, 0.08)',

    glassBg: 'rgba(17, 24, 39, 0.72)',

    shadow: 'rgba(0, 0, 0, 0.35)',

    // OPTIONAL PREMIUM GRADIENTS
    gradientPrimary: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    gradientSecondary: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)',
    gradientHero: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #F97316 100%)',
  },
} as const;

export type ThemeColors = {
  [K in keyof typeof colors.light]: string;
};