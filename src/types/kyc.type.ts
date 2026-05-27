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

// ─── DigiLocker Types ───────────────────────────────────────

/** Request body for POST /digilocker/initiate */
export interface DigiLockerInitRequest {
  redirectionUrl?: string;
  requiredDocs?: string;
  expiry?: number;
  failOnDocNotFound?: boolean;
  webhookUrl?: string;
}

/** Response from POST /digilocker/initiate → data field */
export interface DigiLockerUrlResponse {
  uniqueId?: string;
  transactionId?: string;
  url?: string;
  kycUrl?: string;
}

/** Address from DigiLocker KYC data */
export interface DigiLockerAddress {
  house?: string;
  street?: string;
  landmark?: string;
  loc?: string;
  po?: string;
  dist?: string;
  subdist?: string;
  vtc?: string;
  pc?: string;
  state?: string;
  country?: string;
}

/** File fetched from DigiLocker */
export interface DigiLockerFile {
  docLink?: string;
  docType?: string;
  docExtension?: string;
}

/** DigiLocker KYC model (from callback data) */
export interface DigiLockerModel {
  status?: string;
  uniqueId?: string;
  maskedAdharNumber?: string;
  name?: string;
  gender?: string;
  dob?: string;
  careOf?: string;
  address?: DigiLockerAddress;
  image?: string;
  digilockerFiles?: DigiLockerFile[];
}

// ─── Legacy Aadhaar Types (kept for reference) ──────────────

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
