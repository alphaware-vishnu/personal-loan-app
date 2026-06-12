/**
 * Bank & Repayment API Services
 */

import { api, lmsApi } from '../api/client';

export interface RepaymentPayload {
  amount: number;
  paymentMode: string;
  remark: string;
  loanAccountId: number;
  emiId: number;
  refNo: string;
  discount: number;
}

/**
 * Fetch a loan account detail by ID
 */
export const getLoanAccountById = (id: number) => {
  return api.get(`/account/${id}`);
};

/**
 * Create a loan repayment entry
 */
export const createRepayment = (data: RepaymentPayload) => {
  return api.post(`/account/repayment`, data);
};

/**
 * Initiate AutoPay for an application.
 * POST /repayment/{applicationId}/autopay/initiate
 */
export const initiateAutopay = async (applicationId: number) => {
  const response = await api.post(`/repayment/${applicationId}/autopay/initiate`);
  return response.data; // ApiResponsePlMandateInitiateResponse
};

/**
 * Fetch repayment due details for an application.
 * GET /repayment/{applicationId}/due
 */
export const getRepaymentDue = async (applicationId: number) => {
  const response = await api.get(`/repayment/${applicationId}/due`);
  return response.data; // ApiResponsePlRepaymentDueResponse
};

/**
 * Initiate manual repayment via Razorpay order creation.
 * POST /repayment/{applicationId}/pay
 */
export const initiateManualPayment = async (applicationId: number, amount: number) => {
  const response = await api.post(`/repayment/${applicationId}/pay`, { amount });
  return response.data; // ApiResponsePlManualPaymentInitiateResponse
};

/**
 * Verify manual repayment signature on the backend.
 * POST /repayment/{applicationId}/pay/verify
 */
export const verifyManualPayment = async (
  applicationId: number,
  data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
) => {
  const response = await api.post(`/repayment/${applicationId}/pay/verify`, data);
  return response.data; // ApiResponseVoid
};

/**
 * Fetch repayment schedule (EMIs) from LMS by loanId
 * GET /loans/{loanId}/schedule -> relative to lmsApi, it's just `${loanId}/schedule`
 */
export const getRepaymentSchedule = async (loanId: number | string) => {
  const response = await lmsApi.get(`${loanId}/schedule`);
  return response.data; // ApiResponseListRepaymentScheduleResponse
};

/**
 * Fetch a loan account detail from LMS API by lmsLoanId
 * GET /loans/{id} -> relative to lmsApi, it's just `${id}`
 */
export const getLmsLoanAccountDetails = async (id: number | string) => {
  const response = await lmsApi.get(`${id}`);
  return response.data; // ApiResponseLoanAccountResponse
};

