/**
 * Environment configuration
 * Switch between dev/staging/prod environments.
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  environment: Environment;
  apiBaseUrl: string;
  userManagement: string;
  lmsApi: string;
  tenantId: string;
  enableDebugTools: boolean;
  enableNetworkLogger: boolean;
  sessionTimeoutMs: number;
  otpLength: number;
  otpResendCooldownSec: number;
  maxUploadSizeMb: number;
  eligibilityPollIntervalMs: number;
  eligibilityPollMaxAttempts: number;
  apiRetryAttempts: number;
  apiRetryDelayMs: number;
  /** Razorpay Key ID for payment checkout */
  razorpayKeyId: string;
  /** Digio SDK Configuration */
  digioEnvironment: 'SANDBOX' | 'PRODUCTION';
  digioLogoUrl: string;
  digioThemePrimaryColor: string;
  digioThemeSecondaryColor: string;
}

const configs: Record<Environment, EnvConfig> = {
  development: {
    environment: 'development',
    apiBaseUrl: 'https://personal-product.alfinnext.com/api/los-personal/',
    userManagement: 'https://ums-product.alfinnext.com/api/user-management/',
    lmsApi: 'https://6hfnsmjd-8085.inc1.devtunnels.ms/api/v1/loans/',
    tenantId: 'product-dev',
    enableDebugTools: true,
    enableNetworkLogger: true,
    sessionTimeoutMs: 30 * 60 * 1000, // 30 min in dev
    otpLength: 4,
    otpResendCooldownSec: 30,
    maxUploadSizeMb: 10,
    eligibilityPollIntervalMs: 3000,
    eligibilityPollMaxAttempts: 20,
    apiRetryAttempts: 3,
    apiRetryDelayMs: 1000,
    razorpayKeyId: 'rzp_test_SrUlrOqO3qLPxv',
    digioEnvironment: 'SANDBOX',
    digioLogoUrl: 'https://cbslms.s3.ap-south-1.amazonaws.com/static/Documents/2026/5/28/07cd685d-ee1d-45f1-a35e-b10ba0b1be63.png',
    digioThemePrimaryColor: '#0c36abff',
    digioThemeSecondaryColor: '#0c5cabff',
  },
  staging: {
    environment: 'staging',
    apiBaseUrl: 'https://6hfnsmjd-9092.inc1.devtunnels.ms/api/los-personal/',
    userManagement: 'https://personal-product.alfinnext.com/api/los-personal/',
    lmsApi: 'https://6hfnsmjd-8085.inc1.devtunnels.ms/api/v1/loans/',
    tenantId: 'product-dev',
    enableDebugTools: true,
    enableNetworkLogger: false,
    sessionTimeoutMs: 15 * 60 * 1000,
    otpLength: 4,
    otpResendCooldownSec: 30,
    maxUploadSizeMb: 10,
    eligibilityPollIntervalMs: 3000,
    eligibilityPollMaxAttempts: 20,
    apiRetryAttempts: 3,
    apiRetryDelayMs: 1000,
    razorpayKeyId: 'rzp_test_SrUlrOqO3qLPxv',
    digioEnvironment: 'SANDBOX',
    digioLogoUrl: 'https://cbslms.s3.ap-south-1.amazonaws.com/static/Documents/2026/5/28/07cd685d-ee1d-45f1-a35e-b10ba0b1be63.png',
    digioThemePrimaryColor: '#0c36abff',
    digioThemeSecondaryColor: '#0c5cabff',
  },
  production: {
    environment: 'production',
    // apiBaseUrl: 'https://apipersonalproduct.alphawarenext.com/api/lms',
    apiBaseUrl: 'https://personal-product.alfinnext.com/api/los-personal/',
    userManagement: 'https://ums-product.alfinnext.com/api/user-management/',
    lmsApi: 'https://6hfnsmjd-8085.inc1.devtunnels.ms/api/v1/loans/',
    tenantId: 'product-dev',
    enableDebugTools: false,
    enableNetworkLogger: false,
    sessionTimeoutMs: 15 * 60 * 1000,
    otpLength: 4,
    otpResendCooldownSec: 30,
    maxUploadSizeMb: 10,
    eligibilityPollIntervalMs: 5000,
    eligibilityPollMaxAttempts: 30,
    apiRetryAttempts: 3,
    apiRetryDelayMs: 1500,
    razorpayKeyId: 'rzp_test_SrUlrOqO3qLPxv', // Replace with your Razorpay live key
    digioEnvironment: 'SANDBOX',
    digioLogoUrl: 'https://cbslms.s3.ap-south-1.amazonaws.com/static/Documents/2026/5/28/07cd685d-ee1d-45f1-a35e-b10ba0b1be63.png',
    digioThemePrimaryColor: '#0c36abff',
    digioThemeSecondaryColor: '#0c5cabff',
  },
};

// Set active environment configuration
const currentEnv: Environment = __DEV__ ? 'development' : 'production';
export const ENV = configs[currentEnv];
export const env = ENV;