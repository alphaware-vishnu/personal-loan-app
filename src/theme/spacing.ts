/**
 * Spacing scale — 4px base unit
 * Consistent spacing across padding, margin, gap, etc.
 */

export const spacing = {
  /** 0px */
  none: 0,
  /** 2px — hairline gaps */
  '0.5': 2,
  /** 4px — icon-text gap */
  '1': 4,
  /** 6px */
  '1.5': 6,
  /** 8px — tight inner padding */
  '2': 8,
  /** 10px */
  '2.5': 10,
  /** 12px — card inner padding, badge padding */
  '3': 12,
  /** 14px */
  '3.5': 14,
  /** 16px — standard padding */
  '4': 16,
  /** 20px — section gap */
  '5': 20,
  /** 24px — card padding, screen horizontal padding */
  '6': 24,
  /** 28px */
  '7': 28,
  /** 32px — section spacing */
  '8': 32,
  /** 36px */
  '9': 36,
  /** 40px — large section gap */
  '10': 40,
  /** 48px */
  '12': 48,
  /** 56px */
  '14': 56,
  /** 64px */
  '16': 64,
  /** 80px */
  '20': 80,
  /** 96px */
  '24': 96,
} as const;

/** Border radius tokens */
export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

/** Shadow presets */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 10,
  },
} as const;

/** Screen horizontal padding constant */
export const SCREEN_PADDING = spacing['6']; // 24px
