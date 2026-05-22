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
  return api.post(`/otp/send`, { mobile }, {
    skipAuth: true,
  });
};

/**
 * Verify the OTP entered by the user
 */
export const verifyOtp = (data: VerifyOtpParams) => {
  const { mobile, otp } = data;
  return api.post(`/otp/verify`, { mobile, otp }, {
    skipAuth: true,
  });
};
