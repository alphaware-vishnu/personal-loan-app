/**
 * Authentication & OTP API Services
 */

import { api } from '../api/client';

export interface VerifyOtpParams {
  mobile: string;
  otp: string;
  skipOtp: boolean;
}

/**
 * Send OTP to the specified mobile number
 */
export const sendOtp = (mobile: string) => {
  return api.post(`/otp/send`, null, {
    params: { mobile },
    skipAuth: true,
  });
};

/**
 * Verify the OTP entered by the user
 */
export const verifyOtp = (data: VerifyOtpParams) => {
  return api.post(`/otp/verify`, data, {
    skipAuth: true,
  });
};
