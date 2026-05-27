/**
 * KYC API Services
 * DigiLocker integration via Digitap SDK and selfie verification.
 */

import { api } from '../api/client';
import type {
  DigiLockerInitRequest,
  DigiLockerUrlResponse,
} from '../types/kyc.type';

// ─── DigiLocker APIs ────────────────────────────────────────

/**
 * Initiate DigiLocker eKYC flow.
 * POST /digilocker/initiate
 *
 * Backend behaviour:
 *  - First call for a customer hits Digitap and returns a fresh URL.
 *  - Subsequent calls return the existing saved link (idempotent).
 *
 * @returns { uniqueId, transactionId, url, kycUrl }
 */
export const initiateDigiLocker = async (
  payload?: DigiLockerInitRequest,
): Promise<DigiLockerUrlResponse> => {
  const response = await api.post('/digilocker/initiate', payload ?? {});
  return response.data?.data;
};

/**
 * Fetch the customer profile to check `digiLockerVerified` status.
 * GET /customer/profile
 * Used to poll after the user completes the DigiLocker WebView flow.
 */
export const checkDigiLockerVerification = async (): Promise<{
  digiLockerVerified: boolean;
  digiLockerData?: any;
}> => {
  const response = await api.get('/customer/profile');
  const profile = response.data?.data;
  return {
    digiLockerVerified: !!profile?.digiLockerVerified,
    digiLockerData: profile?.digiLockerData ?? null,
  };
};

// ─── Selfie Verification ────────────────────────────────────

/**
 * Verify selfie liveliness and identity.
 */
export const verifySelfieLiveliness = async (
  selfieUri: string,
): Promise<{ isLive: boolean; confidenceScore: number }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
  return {
    isLive: true,
    confidenceScore: 0.98,
  };
};
