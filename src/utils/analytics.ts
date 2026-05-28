/**
 * Analytics & Event Tracking
 * Abstraction layer — plug in any analytics provider.
 */

import { isFeatureEnabled } from '../config/features';

export type AnalyticsEvent =
  // Screen views
  | 'screen_view'
  // Onboarding funnel
  | 'onboarding_started'
  | 'onboarding_slide_view'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  // Auth
  | 'otp_requested'
  | 'otp_verified'
  | 'otp_resend'
  | 'otp_failed'
  | 'login_success'
  | 'login_failed'
  // Permissions
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'
  // Profile
  | 'pan_submitted'
  | 'pan_verified'
  | 'pan_failed'
  | 'employment_selected'
  | 'address_auto_filled'
  | 'address_submitted'
  | 'profile_completed'
  // Eligibility
  | 'income_submitted'
  | 'eligibility_check_started'
  | 'eligibility_result_received'
  | 'offer_viewed'
  | 'offer_accepted'
  | 'offer_modified'
  // KYC
  | 'kyc_started'
  | 'aadhaar_otp_requested'
  | 'aadhaar_verified'
  | 'selfie_captured'
  | 'selfie_verified'
  | 'kyc_completed'
  | 'kyc_failed'
  // DigiLocker
  | 'digilocker_initiated'
  | 'digilocker_initiate_error'
  | 'digilocker_returned_from_webview'
  | 'digilocker_verified'
  // Documents
  | 'document_upload_started'
  | 'document_upload_completed'
  | 'document_upload_failed'
  | 'document_upload_retried'
  // Bank
  | 'bank_account_submitted'
  | 'bank_account_verified'
  | 'autopay_setup_started'
  | 'autopay_setup_completed'
  // Agreement
  | 'agreement_viewed'
  | 'agreement_downloaded'
  | 'agreement_signed'
  // Sanction Letter
  | 'sanction_letter_viewed'
  | 'sanction_letter_downloaded'
  | 'sanction_letter_accepted'
  // Digio eSign & eStamp
  | 'esign_initiated'
  | 'esign_completed'
  | 'esign_failed'
  | 'digio_gateway_event'
  // Disbursal
  | 'disbursal_initiated'
  | 'disbursal_completed'
  | 'disbursal_failed'
  // Dashboard
  | 'dashboard_viewed'
  | 'loan_details_viewed'
  | 'repayment_initiated'
  // Razorpay Payments
  | 'razorpay_checkout_opened'
  | 'razorpay_payment_success'
  | 'razorpay_payment_failed'
  | 'razorpay_autopay_authorized'
  | 'razorpay_autopay_failed'
  // Errors
  | 'api_error'
  | 'crash';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event.
 * Will no-op if analytics is disabled.
 */
export const trackEvent = (event: AnalyticsEvent, params?: EventParams): void => {
  if (!isFeatureEnabled('enableAnalytics')) return;

  const payload = {
    event,
    timestamp: Date.now(),
    params,
  };

  if (__DEV__) {
    console.log('[Analytics Event]', JSON.stringify(payload, null, 2));
  }
};