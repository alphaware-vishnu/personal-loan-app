/**
 * Onboarding step configuration
 * Each step is independently configurable — driven by backend or local config.
 */

export type OnboardingStepId =
  | 'intro'
  | 'permissions'
  | 'auth'
  | 'pan_verification'
  | 'employment'
  | 'work_address'
  | 'personal_address'
  | 'income'
  | 'bank_statement'
  | 'eligibility'
  | 'kyc_aadhaar'
  | 'kyc_selfie'
  | 'bank_account'
  | 'agreement'
  | 'disbursal';

export interface OnboardingStep {
  id: OnboardingStepId;
  /** Display label */
  title: string;
  /** Short description */
  subtitle: string;
  /** Screen key used in navigation */
  screenKey: string;
  /** Is this step mandatory? */
  isRequired: boolean;
  /** Is this step currently enabled? */
  isEnabled: boolean;
  /** Order in the flow (ascending) */
  order: number;
  /** Group this step belongs to */
  group: 'pre_auth' | 'profile' | 'eligibility' | 'kyc' | 'bank_verification' | 'loan_agreement' | 'disbursal';
  /** Icon name (Ionicons) */
  icon: string;
}

/**
 * Default onboarding steps
 * Backend can override this via remote config.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Pre-auth (not tracked in progress)
  { id: 'intro', title: 'Welcome', subtitle: 'Intro experience', screenKey: 'IntroCarousel', isRequired: true, isEnabled: true, order: 0, group: 'pre_auth', icon: 'sparkles-outline' },
  { id: 'permissions', title: 'Permissions', subtitle: 'Allow access', screenKey: 'Permissions', isRequired: false, isEnabled: true, order: 1, group: 'pre_auth', icon: 'shield-checkmark-outline' },
  { id: 'auth', title: 'Login', subtitle: 'Verify mobile', screenKey: 'Auth', isRequired: true, isEnabled: true, order: 2, group: 'pre_auth', icon: 'phone-portrait-outline' },

  // Profile setup (Step 1)
  { id: 'pan_verification', title: 'Verify Identity', subtitle: 'PAN verification', screenKey: 'PanVerification', isRequired: true, isEnabled: true, order: 3, group: 'profile', icon: 'card-outline' },
  { id: 'employment', title: 'Work Details', subtitle: 'Employment type', screenKey: 'EmploymentType', isRequired: true, isEnabled: true, order: 4, group: 'profile', icon: 'briefcase-outline' },
  { id: 'work_address', title: 'Work Address', subtitle: 'Office address', screenKey: 'WorkAddress', isRequired: true, isEnabled: true, order: 5, group: 'profile', icon: 'business-outline' },
  { id: 'personal_address', title: 'Home Address', subtitle: 'Residential address', screenKey: 'PersonalAddress', isRequired: true, isEnabled: true, order: 6, group: 'profile', icon: 'home-outline' },

  // Eligibility (Step 2)
  { id: 'income', title: 'Income Details', subtitle: 'Monthly income', screenKey: 'IncomeInput', isRequired: true, isEnabled: true, order: 7, group: 'eligibility', icon: 'cash-outline' },
  { id: 'bank_statement', title: 'Bank Statement', subtitle: 'Upload statements', screenKey: 'BankStatementUpload', isRequired: false, isEnabled: true, order: 8, group: 'eligibility', icon: 'document-text-outline' },
  { id: 'eligibility', title: 'Eligibility Check', subtitle: 'Loan offer', screenKey: 'OfferScreen', isRequired: true, isEnabled: true, order: 9, group: 'eligibility', icon: 'gift-outline' },

  // KYC (Step 3)
  { id: 'kyc_aadhaar', title: 'Aadhaar eKYC', subtitle: 'Identity check', screenKey: 'AadhaarVerification', isRequired: true, isEnabled: true, order: 10, group: 'kyc', icon: 'id-card-outline' },
  { id: 'kyc_selfie', title: 'Selfie Verification', subtitle: 'Liveliness test', screenKey: 'SelfieVerification', isRequired: true, isEnabled: true, order: 11, group: 'kyc', icon: 'camera-outline' },

  // Finalization (Steps 4-6)
  { id: 'bank_account', title: 'Bank Account', subtitle: 'Disbursal bank', screenKey: 'BankAccount', isRequired: true, isEnabled: true, order: 12, group: 'bank_verification', icon: 'wallet-outline' },
  { id: 'agreement', title: 'Sanction Agreement', subtitle: 'Review & sign', screenKey: 'Agreement', isRequired: true, isEnabled: true, order: 13, group: 'loan_agreement', icon: 'document-attach-outline' },
  { id: 'disbursal', title: 'Disbursal Status', subtitle: 'Payout status', screenKey: 'Disbursal', isRequired: true, isEnabled: true, order: 14, group: 'disbursal', icon: 'checkmark-circle-outline' },
];

export const getTrackableSteps = (): OnboardingStep[] => {
  return ONBOARDING_STEPS.filter((step) => step.group !== 'pre_auth');
};

export type EmploymentType = 'salaried' | 'self_employed' | 'freelancer' | 'business_owner' | 'student_other';

export interface EmploymentTypeOption {
  id: EmploymentType;
  title: string;
  subtitle: string;
  icon: string;
}

export const EMPLOYMENT_TYPES: EmploymentTypeOption[] = [
  { id: 'salaried', title: 'Salaried', subtitle: 'Regular monthly salary credited to bank', icon: 'wallet-outline' },
  { id: 'self_employed', title: 'Self-Employed', subtitle: 'Independent contractor, freelancer, or consultant', icon: 'briefcase-outline' },
  { id: 'freelancer', title: 'Freelancer', subtitle: 'Project-based work or gig economy professional', icon: 'laptop-outline' },
  { id: 'business_owner', title: 'Business Owner', subtitle: 'Owner of a registered business entity', icon: 'business-outline' },
];