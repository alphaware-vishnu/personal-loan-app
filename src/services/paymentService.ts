/**
 * Payment Service — Razorpay SDK Wrapper
 * Centralizes all payment-related operations with graceful fallback.
 */

import { Platform, Linking } from 'react-native';
import { env } from '../config/env';
import { isFeatureEnabled } from '../config/features';
import { api } from '../api/client';
import { trackEvent } from '../utils/analytics';

// ─── Types ───────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpaySubscriptionResponse {
  subscriptionId: string;
  planId: string;
  status: string;
}

export interface PaymentSuccessData {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  subscriptionId?: string;
  error?: string;
}

export interface OneTimePaymentOptions {
  emiId: number;
  loanAccountId: number;
  amount: number;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  description?: string;
}

export interface AutoPayMandateOptions {
  loanAccountId: number;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  totalCount?: number;
}

// ─── Backend API Calls ───────────────────────────────────────

/**
 * Create a Razorpay order on the backend for one-time EMI payment.
 */
export const createRazorpayOrder = async (
  emiId: number,
  amount: number,
  loanAccountId: number,
): Promise<RazorpayOrderResponse> => {
  try {
    const response = await api.post('/razorpay/order', {
      emiId,
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      loanAccountId,
    });
    return response.data.data;
  } catch (error) {
    // Mock response for development when backend isn't ready
    if (__DEV__) {
      console.log('[PaymentService] Mock order created for dev');
      return {
        orderId: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
      };
    }
    throw error;
  }
};

/**
 * Create a Razorpay subscription for recurring UPI AutoPay mandate.
 */
export const createAutoPaySubscription = async (
  options: AutoPayMandateOptions,
): Promise<RazorpaySubscriptionResponse> => {
  try {
    const response = await api.post('/razorpay/subscription', {
      loanAccountId: options.loanAccountId,
      amount: Math.round(options.amount * 100),
      frequency: options.frequency,
      totalCount: options.totalCount || 12,
    });
    return response.data.data;
  } catch (error) {
    // Mock response for development
    if (__DEV__) {
      console.log('[PaymentService] Mock subscription created for dev');
      return {
        subscriptionId: `sub_mock_${Date.now()}`,
        planId: `plan_mock_${Date.now()}`,
        status: 'created',
      };
    }
    throw error;
  }
};

/**
 * Verify Razorpay payment signature on the backend for security.
 */
export const verifyRazorpayPayment = async (
  data: PaymentSuccessData,
): Promise<boolean> => {
  try {
    const response = await api.post('/razorpay/verify', data);
    return response.data.data?.verified === true;
  } catch (error) {
    if (__DEV__) {
      console.log('[PaymentService] Mock verification passed for dev');
      return true;
    }
    throw error;
  }
};

// ─── Razorpay Checkout ───────────────────────────────────────

/**
 * Open Razorpay checkout for a one-time EMI payment.
 * Falls back to UPI intent-based flow when Razorpay is disabled.
 */
export const openOneTimePayment = async (
  options: OneTimePaymentOptions,
): Promise<PaymentResult> => {
  if (!isFeatureEnabled('enableRazorpay')) {
    return openUpiIntentFallback(options.amount);
  }

  try {
    trackEvent('razorpay_checkout_opened', { type: 'one_time', amount: options.amount });

    // Step 1: Create order on backend
    const order = await createRazorpayOrder(
      options.emiId,
      options.amount,
      options.loanAccountId,
    );

    // Step 2: Open Razorpay checkout
    const RazorpayCheckout = require('react-native-razorpay').default;

    const checkoutOptions = {
      key: env.razorpayKeyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'AlphaWare Finance',
      description: options.description || 'EMI Payment',
      prefill: {
        name: options.customerName,
        contact: options.customerMobile,
        email: options.customerEmail || '',
      },
      theme: {
        color: '#1E40AF',
      },
      retry: {
        enabled: true,
        max_count: 2,
      },
    };

    const data: PaymentSuccessData = await RazorpayCheckout.open(checkoutOptions);

    // Step 3: Verify payment
    const isVerified = await verifyRazorpayPayment(data);

    if (isVerified) {
      trackEvent('razorpay_payment_success', {
        paymentId: data.razorpay_payment_id,
        amount: options.amount,
      });
      return {
        success: true,
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
      };
    } else {
      trackEvent('razorpay_payment_failed', { reason: 'verification_failed' });
      return { success: false, error: 'Payment verification failed' };
    }
  } catch (error: any) {
    const errorMessage = error?.description || error?.message || 'Payment failed';
    trackEvent('razorpay_payment_failed', { reason: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Open Razorpay checkout for UPI AutoPay mandate authorization.
 * Falls back to a "not available" result when Razorpay is disabled.
 */
export const openAutoPayMandate = async (
  options: AutoPayMandateOptions,
): Promise<PaymentResult> => {
  if (!isFeatureEnabled('enableRazorpay')) {
    return {
      success: false,
      error: 'Razorpay is not enabled. Please enable the Razorpay feature flag and use a Dev Client build.',
    };
  }

  try {
    trackEvent('razorpay_checkout_opened', { type: 'autopay', amount: options.amount });

    // Step 1: Create subscription on backend
    const subscription = await createAutoPaySubscription(options);

    // Step 2: Open Razorpay checkout with subscription_id
    const RazorpayCheckout = require('react-native-razorpay').default;

    const checkoutOptions = {
      key: env.razorpayKeyId,
      subscription_id: subscription.subscriptionId,
      name: 'AlphaWare Finance',
      description: `EMI AutoPay - ₹${options.amount}/month`,
      prefill: {
        name: options.customerName,
        contact: options.customerMobile,
        email: options.customerEmail || '',
      },
      theme: {
        color: '#1E40AF',
      },
    };

    const data: PaymentSuccessData = await RazorpayCheckout.open(checkoutOptions);

    trackEvent('razorpay_autopay_authorized', {
      subscriptionId: subscription.subscriptionId,
    });

    return {
      success: true,
      paymentId: data.razorpay_payment_id,
      subscriptionId: subscription.subscriptionId,
    };
  } catch (error: any) {
    const errorMessage = error?.description || error?.message || 'Mandate authorization failed';
    trackEvent('razorpay_autopay_failed', { reason: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// ─── Legacy UPI Intent Fallback ──────────────────────────────

/**
 * Fallback UPI payment via deep-link intent (no SDK required).
 * Used when Razorpay feature flag is disabled.
 */
const openUpiIntentFallback = async (amount: number): Promise<PaymentResult> => {
  const vpa = 'alphaware@axisbank';
  const name = 'Alphaware LMS';
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;

  try {
    const canOpen = await Linking.canOpenURL(upiUrl);
    if (canOpen) {
      await Linking.openURL(upiUrl);
      // UPI intent doesn't return a result, so we can't confirm payment
      return {
        success: false,
        error: 'UPI intent launched. Payment status cannot be confirmed automatically. Please verify manually.',
      };
    } else {
      return { success: false, error: 'No UPI app found on this device.' };
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to launch UPI app.' };
  }
};
