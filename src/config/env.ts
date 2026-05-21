/**
 * Environment configuration
 * Switch between dev/staging/prod environments.
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  environment: Environment;
  apiBaseUrl: string;
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
}

const configs: Record<Environment, EnvConfig> = {
  development: {
    environment: 'development',
    apiBaseUrl: 'https://apipersonalproduct.alphawarenext.com/api/lms',
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
    razorpayKeyId: 'rzp_test_XXXXXXXXXXXXXXXXXX', // Replace with your Razorpay test key
  },
  staging: {
    environment: 'staging',
    apiBaseUrl: 'https://apipersonalproduct.alphawarenext.com/api/lms',
    tenantId: 'product-staging',
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
    razorpayKeyId: 'rzp_test_XXXXXXXXXXXXXXXXXX', // Replace with your Razorpay test key
  },
  production: {
    environment: 'production',
    apiBaseUrl: 'https://apipersonalproduct.alphawarenext.com/api/lms',
    tenantId: 'product-prod',
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
    razorpayKeyId: 'rzp_live_XXXXXXXXXXXXXXXXXX', // Replace with your Razorpay live key
  },
};

// Set active environment configuration
const currentEnv: Environment = __DEV__ ? 'development' : 'production';
export const ENV = configs[currentEnv];
export const env = ENV;