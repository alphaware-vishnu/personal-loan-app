/**
 * Loan Application API Services
 */

import { api } from '../api/client';

export interface StepStatusPayload {
  rulesEngineCompleted?: boolean;
  bankVerificationCompleted?: boolean;
  loanAgreementCompleted?: boolean;
}

/**
 * Create a new loan application
 */
export const createApplication = (payload: any) => {
  return api.post(`/application`, payload);
};

/**
 * Calculate EMI schedules based on loan parameters
 */
export const calculateEmi = (payload: any) => {
  return api.post(`/application/calculate/emi`, payload);
};

/**
 * Get all applications created by a customer
 */
export const getCustomerApplications = (customerId: number) => {
  return api.get(`/application/customer/${customerId}`);
};

/**
 * Get details of a specific application
 */
export const getApplicationDetails = (applicationId: number) => {
  return api.get(`/application/${applicationId}`);
};

/**
 * Update step status flags for rules engine, bank verification, or agreement
 */
export const updateStepStatus = (applicationId: number, status: StepStatusPayload) => {
  return api.patch(`/application/${applicationId}/step-status`, status);
};

/**
 * Update application info
 */
export const updateApplication = (data: any) => {
  return api.patch('/application', data);
};

/**
 * Generate sanction letter for an application
 * POST /application/{id}/sanction-letter
 */
export const generateSanctionLetter = async (applicationId: number) => {
  const response = await api.post(`/application/${applicationId}/sanction-letter`);
  return response.data;
};

