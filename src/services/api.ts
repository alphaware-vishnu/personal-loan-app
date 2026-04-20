import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// Extend Axios request config to include skipAuth
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// Replace with your actual API base URL
// const BASE_URL = 'http://192.168.1.21:9096/api/lms';
const BASE_URL = 'http://192.168.1.30:9096/api/lms';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    
    'X-Tenant-Id': 'product-dev', // Default tenant ID for all requests
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add token if skipAuth is NOT true
    console.log('[Auth Check] skipAuth:', config.skipAuth);
    if (!config.skipAuth) {
      const token = useAuthStore.getState().token;
      console.log(token, 'token')
      console.log('[Auth Check] token present:', !!token);

      if (token) {
        // Use .set() instead of assignment for reliable header injection in Axios 1.x+
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('[Auth Warning] No token found in Zustand store! Request might fail with 401.');
      }
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle global error codes
      if (error.response.status === 401) {
        console.warn('Unauthorized! Logging out...', error?.response?.data?.message);
        // Add logout logic here (e.g., clear tokens, redirect to login)
      }
    }
    return Promise.reject(error);
  }
);

// OTP Operations
export const sendOtp = (mobile: string) => {
  console.log(mobile, 'mobile')
  return api.post(`/otp/send`, null, {
    params: { mobile },
    headers: { 'X-Tenant-Id': 'product-dev' },
    skipAuth: true, // Don't send token for sending OTP
  });
};

export interface VerifyOtpParams {
  mobile: string;
  otp: string;
  skipOtp: boolean;
}

export const verifyOtp = (data: VerifyOtpParams) => {
  console.log(data, 'verify data ---')
  return api.post(`/otp/verify`, data, {
    headers: { 'X-Tenant-Id': 'product-dev' },
    skipAuth: true, // Don't send token for verifying OTP
  });
};

// Document Operations
export const uploadDocument = (formData: FormData) => {
  return api.post(`/document/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocumentDownloadPath = (id: number) => {
  return api.get(`/document/download`, {
    params: {
      ids: [id],
    },
  });
};

export const getProductDocuments = (productId: number) => {
  return api.get(`/product-document/${productId}`, {
    headers: { 'X-Tenant-Id': 'product-dev' }
  });
};

export const createApplication = (payload: any) => {
  return api.post(`/application`, payload);
};

export const createCustomer = (payload: any) => {
  return api.patch(`/customer`, payload);
};

export const getCustomerApplications = (customerId: number) => {
  return api.get(`/application/customer/${customerId}`);
};

export const getApplicationDetails = (applicationId: number) => {
  return api.get(`/application/${applicationId}`);
};

export const getCustomerById = (customerId: number) => {
  return api.get(`/customer/${customerId}`);
};





