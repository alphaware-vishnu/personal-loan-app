/**
 * Eligibility & Loan Offer API Services
 */

import { api } from '../api/client';
import { env } from '../config/env';

export interface EligibilityResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  maxAmount?: number;
  minAmount?: number;
  maxTenureMonths?: number;
  interestRateAnnual?: number;
  reason?: string;
}

/**
 * Trigger backend credit score and eligibility evaluation.
 */
export const checkEligibility = (applicationId: number) => {
  return api.post(`/application/${applicationId}/eligibility`);
};

/**
 * Poll eligibility calculation status until APPROVED, REJECTED, or max attempts reached.
 */
export const pollEligibilityStatus = async (
  applicationId: number,
  onProgress?: (status: string) => void
): Promise<EligibilityResult> => {
  let attempts = 0;
  const maxAttempts = env.eligibilityPollMaxAttempts || 20;
  const intervalMs = env.eligibilityPollIntervalMs || 3000;

  while (attempts < maxAttempts) {
    attempts++;
    if (onProgress) {
      onProgress(`Evaluating application profile (Attempt ${attempts}/${maxAttempts})...`);
    }

    try {
      // Fetch application details to check status
      const response = await api.get(`/application/${applicationId}`);
      const app = response.data;

      // Map backend status to eligibility result
      if (app.status === 'APPROVED' || app.sanctionedAmount > 0) {
        return {
          status: 'APPROVED',
          maxAmount: app.sanctionedAmount || 150000,
          minAmount: 10000,
          maxTenureMonths: app.tenure || 12,
          interestRateAnnual: app.interest || 14.5,
        };
      } else if (app.status === 'REJECTED') {
        return {
          status: 'REJECTED',
          reason: app.rejectionReason || 'Does not meet minimum credit requirements',
        };
      }
    } catch (error) {
      console.warn(`[EligibilityService] Polling error on attempt ${attempts}:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: 'PENDING',
    reason: 'Evaluation is taking longer than expected. We will notify you shortly.',
  };
};