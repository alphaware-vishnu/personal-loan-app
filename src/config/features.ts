/**
 * Feature flags — local defaults + remote override architecture
 * Toggle features without code changes.
 */

export interface FeatureFlags {
  /** Enable Aadhaar eKYC verification flow */
  enableAadhaarEkyc: boolean;
  /** Enable selfie/liveliness verification */
  enableSelfieVerification: boolean;
  /** Enable UPI AutoPay mandate setup */
  enableUpiAutopay: boolean;
  /** Enable dark mode toggle in settings */
  enableDarkMode: boolean;
  /** Enable biometric login (fingerprint/face) */
  enableBiometricAuth: boolean;
  /** Enable in-app chat support */
  enableChatSupport: boolean;
  /** Enable push notifications */
  enablePushNotifications: boolean;
  /** Skip OTP for dev/test (auto-verify) */
  skipOtpVerification: boolean;
  /** Enable credit score screen */
  enableCreditScore: boolean;
  /** Enable income & eligibility flow */
  enableEligibilityFlow: boolean;
  /** Enable bank statement upload with OCR */
  enableBankStatementOcr: boolean;
  /** Enable digital agreement signing */
  enableDigitalSignature: boolean;
  /** Enable offline draft saving */
  enableOfflineDrafts: boolean;
  /** Enable analytics/event tracking */
  enableAnalytics: boolean;
  /** Enable network request debug logger */
  enableNetworkDebug: boolean;
  /** Enable Razorpay SDK for payments (requires expo-dev-client) */
  enableRazorpay: boolean;
}

/**
 * Default feature flags (local fallback)
 * These can be overridden by a remote config service.
 */
const defaultFlags: FeatureFlags = {
  enableAadhaarEkyc: false,
  enableSelfieVerification: false,
  enableUpiAutopay: false,
  enableDarkMode: false,
  enableBiometricAuth: false,
  enableChatSupport: false,
  enablePushNotifications: true,
  skipOtpVerification: true, // true in dev for faster testing
  enableCreditScore: true,
  enableEligibilityFlow: true,
  enableBankStatementOcr: false,
  enableDigitalSignature: false,
  enableOfflineDrafts: true,
  enableAnalytics: false,
  enableNetworkDebug: true,
  enableRazorpay: false, // Requires expo-dev-client build; enable when ready
};

// In-memory store for remote overrides
let remoteOverrides: Partial<FeatureFlags> = {};

/**
 * Get current resolved feature flags combining defaults and overrides.
 */
export const getFeatureFlags = (): FeatureFlags => {
  return {
    ...defaultFlags,
    ...remoteOverrides,
  };
};

/**
 * Set remote overrides for feature flags.
 */
export const setFeatureFlagOverrides = (overrides: Partial<FeatureFlags>) => {
  remoteOverrides = { ...remoteOverrides, ...overrides };
};

/**
 * Check if a specific feature is enabled.
 */
export const isFeatureEnabled = (key: keyof FeatureFlags): boolean => {
  return !!getFeatureFlags()[key];
};