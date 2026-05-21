/**
 * Navigation type definitions
 */

/** All screen names used in manual navigation stack */
export type ScreenName =
  // Pre-auth
  | 'splash'
  | 'introCarousel'
  | 'permissions'
  // Auth
  | 'mobileInput'
  | 'otpVerification'
  // Profile (Step 1)
  | 'panVerification'
  | 'employmentType'
  | 'workAddress'
  | 'personalAddress'
  | 'profileCompletion'
  // Eligibility (Step 2)
  | 'incomeInput'
  | 'bankStatementUpload'
  | 'eligibilityProcessing'
  | 'offer'
  // KYC (Step 3)
  | 'panKyc'
  | 'aadhaarVerification'
  | 'selfieVerification'
  | 'verificationProcessing'
  // Finalization (Steps 4-6)
  | 'bankAccount'
  | 'agreement'
  | 'disbursal'
  // Post-onboarding
  | 'dashboard'
  | 'applicationDetails'
  | 'profileSettings'
  | 'help';

/** Navigation action */
export interface NavigationAction {
  push: (screen: ScreenName) => void;
  pop: () => void;
  replace: (screen: ScreenName) => void;
  reset: (screen: ScreenName) => void;
}
