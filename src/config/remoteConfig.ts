/**
 * Remote configuration service
 * All user-facing text is configurable — ready for i18n & white-label.
 */

export interface RemoteConfig {
  /** App name shown in headers */
  appName: string;
  /** Onboarding step definitions (backend can override order/visibility) */
  onboardingSteps: OnboardingStepConfig[];
  /** Wording overrides */
  copy: Record<string, string>;
}

export interface OnboardingStepConfig {
  id: string;
  title: string;
  subtitle: string;
  isRequired: boolean;
  isEnabled: boolean;
  order: number;
}

// Default remote config (used when backend is unavailable)
let currentConfig: RemoteConfig = {
  appName: 'FinEase',
  onboardingSteps: [
    { id: 'pan_verification', title: 'Verify Identity', subtitle: 'Confirm your PAN details', isRequired: true, isEnabled: true, order: 1 },
    { id: 'employment', title: 'Work Details', subtitle: 'Tell us about your work', isRequired: true, isEnabled: true, order: 2 },
    { id: 'work_address', title: 'Work Address', subtitle: 'Where do you work?', isRequired: true, isEnabled: true, order: 3 },
    { id: 'personal_address', title: 'Home Address', subtitle: 'Where do you live?', isRequired: true, isEnabled: true, order: 4 },
    { id: 'income', title: 'Income Details', subtitle: "Let's check your eligibility", isRequired: true, isEnabled: true, order: 5 },
    { id: 'bank_statement', title: 'Bank Statement', subtitle: 'Upload for verification', isRequired: false, isEnabled: true, order: 6 },
    { id: 'kyc', title: 'KYC Verification', subtitle: 'Quick identity check', isRequired: true, isEnabled: true, order: 7 },
    { id: 'bank_account', title: 'Bank Account', subtitle: 'Setup for disbursal', isRequired: true, isEnabled: true, order: 8 },
    { id: 'agreement', title: 'Agreement', subtitle: 'Review & accept terms', isRequired: true, isEnabled: true, order: 9 },
  ],
  copy: {},
};

export const fetchRemoteConfig = async (): Promise<RemoteConfig> => {
  // In real app, call API: getRemoteConfig()
  // For now return cached config
  return currentConfig;
};

export const getRemoteConfig = (): RemoteConfig => {
  return currentConfig;
};

export const updateRemoteConfig = (config: Partial<RemoteConfig>) => {
  currentConfig = { ...currentConfig, ...config };
};