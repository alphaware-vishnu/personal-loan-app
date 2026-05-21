/**
 * KYC API Services
 * Stubs for future SDK or partner eKYC integrations.
 */

export interface AadhaarOtpResponse {
  referenceId: string;
  message: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface AadhaarVerifyResponse {
  isValid: boolean;
  name: string;
  gender: string;
  dob: string;
  address: string;
}

/**
 * Initiate Aadhaar OTP verification.
 */
export const initiateAadhaarOtp = async (aadhaarNumber: string): Promise<AadhaarOtpResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
  
  return {
    referenceId: 'ref-' + Math.random().toString(36).substring(2, 9),
    message: 'OTP sent to mobile linked with Aadhaar',
    status: 'SUCCESS',
  };
};

/**
 * Verify Aadhaar OTP code.
 */
export const verifyAadhaarOtp = async (referenceId: string, otp: string): Promise<AadhaarVerifyResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

  return {
    isValid: true,
    name: 'Amit Kumar',
    gender: 'MALE',
    dob: '1990-08-22',
    address: '123, Park Street, Flat 4B, Kolkata, West Bengal - 700016',
  };
};

/**
 * Verify selfie liveliness and identity.
 */
export const verifySelfieLiveliness = async (selfieUri: string): Promise<{ isLive: boolean; confidenceScore: number }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
  return {
    isLive: true,
    confidenceScore: 0.98,
  };
};

