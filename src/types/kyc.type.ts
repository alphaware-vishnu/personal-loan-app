/**
 * KYC type definitions
 */

export type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface KycState {
  panVerification: VerificationState;
  aadhaarVerification: VerificationState;
  selfieVerification: VerificationState;
  documentVerification: VerificationState;
  overallStatus: KycStatus;
}

export interface VerificationState {
  status: KycStatus;
  data?: Record<string, any>;
  error?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

/** Aadhaar OTP flow */
export interface AadhaarOtpRequest {
  aadhaarNumber: string;
}

export interface AadhaarOtpResponse {
  transactionId: string;
  message: string;
}

export interface AadhaarVerifyRequest {
  transactionId: string;
  otp: string;
}

export interface AadhaarVerifyResponse {
  isVerified: boolean;
  name: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  photo?: string; // Base64
}

/** Selfie verification */
export interface SelfieVerificationRequest {
  selfieImage: string; // Base64
  documentImage?: string; // For face matching
}

export interface SelfieVerificationResponse {
  isMatch: boolean;
  confidenceScore: number;
  isLive: boolean;
}
