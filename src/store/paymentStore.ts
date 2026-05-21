/**
 * Payment Store — Zustand
 * Tracks payment state, AutoPay mandate status, and payment history.
 */

import { create } from 'zustand';

export type AutoPayStatus = 'none' | 'pending' | 'authorized' | 'failed';

export interface PaymentAttempt {
  id: string;
  type: 'one_time' | 'autopay';
  amount: number;
  status: 'success' | 'failed' | 'pending';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  errorMessage?: string;
  timestamp: number;
}

interface PaymentStoreState {
  /** Latest Razorpay payment ID */
  lastPaymentId: string | null;

  /** Current AutoPay mandate status */
  autoPayStatus: AutoPayStatus;

  /** Active Razorpay subscription ID for AutoPay */
  autoPaySubscriptionId: string | null;

  /** Recent payment attempts (max 20) */
  paymentHistory: PaymentAttempt[];

  /** Whether a payment is currently being processed */
  isProcessing: boolean;

  // Actions
  setProcessing: (processing: boolean) => void;
  recordPaymentSuccess: (attempt: Omit<PaymentAttempt, 'status' | 'timestamp'>) => void;
  recordPaymentFailure: (attempt: Omit<PaymentAttempt, 'status' | 'timestamp'> & { errorMessage: string }) => void;
  setAutoPayStatus: (status: AutoPayStatus, subscriptionId?: string) => void;
  clearPaymentHistory: () => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentStoreState>((set) => ({
  lastPaymentId: null,
  autoPayStatus: 'none',
  autoPaySubscriptionId: null,
  paymentHistory: [],
  isProcessing: false,

  setProcessing: (processing) => set({ isProcessing: processing }),

  recordPaymentSuccess: (attempt) =>
    set((state) => {
      const entry: PaymentAttempt = {
        ...attempt,
        status: 'success',
        timestamp: Date.now(),
      };
      return {
        lastPaymentId: attempt.razorpayPaymentId || null,
        isProcessing: false,
        paymentHistory: [entry, ...state.paymentHistory].slice(0, 20),
      };
    }),

  recordPaymentFailure: (attempt) =>
    set((state) => {
      const entry: PaymentAttempt = {
        ...attempt,
        status: 'failed',
        timestamp: Date.now(),
      };
      return {
        isProcessing: false,
        paymentHistory: [entry, ...state.paymentHistory].slice(0, 20),
      };
    }),

  setAutoPayStatus: (status, subscriptionId) =>
    set({
      autoPayStatus: status,
      autoPaySubscriptionId: subscriptionId || null,
    }),

  clearPaymentHistory: () => set({ paymentHistory: [] }),

  reset: () =>
    set({
      lastPaymentId: null,
      autoPayStatus: 'none',
      autoPaySubscriptionId: null,
      paymentHistory: [],
      isProcessing: false,
    }),
}));
