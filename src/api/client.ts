/**
 * Core API Client
 * Configures Axios instance, headers, request/response interceptors, 
 * global error handling, and retry policy.
 */

import axios, { InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';

// Extend Axios request config to include custom options
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipRetry?: boolean;
    __retryCount?: number;
  }
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000, // 15 seconds request timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': env.tenantId,
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject auth token if skipAuth is not explicitly true
    if (!config.skipAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (env.enableDebugTools) {
        console.warn(`[API Request] No auth token found for secure endpoint: ${config.url}`);
      }
    }

    if (env.enableNetworkLogger && env.enableDebugTools) {
      console.log(`[API Request] [${config.method?.toUpperCase()}] ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for handling auth expiration, logging, and retry logic
api.interceptors.response.use(
  (response) => {
    if (env.enableNetworkLogger && env.enableDebugTools) {
      console.log(`[API Response] Success [${response.status}] for: ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;

    if (env.enableNetworkLogger && env.enableDebugTools) {
      console.error(
        `[API Response] Error [${config?.method?.toUpperCase()}] ${config?.url}. ` +
        `Status: ${response?.status || 'network error'}. Message: ${response?.data?.message || error.message}`
      );
    }

    // Auto-retry policy: retry on network errors or 5xx server errors
    const isNetworkError = !response;
    const isServerError = response && response.status >= 500;
    const canRetry = config && !config.skipRetry && (isNetworkError || isServerError);

    if (canRetry) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < env.apiRetryAttempts) {
        config.__retryCount += 1;
        const delay = env.apiRetryDelayMs * Math.pow(2, config.__retryCount - 1); // Exponential backoff

        if (env.enableDebugTools) {
          console.log(`[API Retry] Retrying request [${config.__retryCount}/${env.apiRetryAttempts}] in ${delay}ms: ${config.url}`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // Global session expiration handler (401 Unauthorized)
    if (response && response.status === 401 && !config.skipAuth) {
      if (env.enableDebugTools) {
        console.warn('[API Auth] 401 Unauthorized detected. Clearing session.');
      }
      
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
    }

    return Promise.reject(error);
  }
);