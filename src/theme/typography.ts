/**
 * Typography scale
 * Standardized sizes, weights, and line heights.
 */

import { Platform } from 'react-native';

export const typography = {
  fonts: {
    // Falls back to system fonts but styled cleanly. If custom fonts like Inter or Outfit are loaded, they can be mapped here.
    regular: Platform.select({ ios: 'System', android: 'sans-serif' }),
    medium: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    bold: Platform.select({ ios: 'System', android: 'sans-serif' }), // Styled with bold weight
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 28,
    xxl: 32,
    xxxl: 40,
    display: 48,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const textStyles = {
  display: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
    fontWeight: typography.weights.bold,
  },
  h1: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xxxl,
    lineHeight: typography.lineHeights.xxxl,
    fontWeight: typography.weights.bold,
  },
  h2: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xxl,
    lineHeight: typography.lineHeights.xxl,
    fontWeight: typography.weights.bold,
  },
  h3: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xl,
    lineHeight: typography.lineHeights.xl,
    fontWeight: typography.weights.semibold,
  },
  h4: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
    fontWeight: typography.weights.semibold,
  },
  bodyLg: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
    fontWeight: typography.weights.regular,
  },
  bodyMd: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    fontWeight: typography.weights.regular,
  },
  bodySm: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.regular,
  },
  caption: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.weights.regular,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.medium,
  },
  labelSm: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.weights.medium,
  },
  labelMd: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.medium,
  },
  labelLg: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    fontWeight: typography.weights.medium,
  },
  bodyMedium: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.regular,
  },
  buttonLg: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
    fontWeight: typography.weights.semibold,
  },
  buttonMd: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    fontWeight: typography.weights.semibold,
  },
  buttonSm: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.semibold,
  },
  input: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    fontWeight: typography.weights.regular,
  },
};

export type ThemeTypography = typeof typography;