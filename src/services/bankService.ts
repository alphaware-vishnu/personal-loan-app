/**
 * Bank & Repayment API Services
 */

import { api } from '../api/client';

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
