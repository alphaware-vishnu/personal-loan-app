/**
 * Onboarding state store — persisted
 * Tracks step completion, form data, and resume capability.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/security/secureStorage';
import { OnboardingStepId, getTrackableSteps } from '../constants/onboardingSteps';
import type { EmploymentType } from '../constants/onboardingSteps';
import type { Address } from '../types/customer.type';
import type { PanValidationResult } from '../types/customer.type';

export interface OnboardingFormData {
  // PAN step
  panNumber?: string;
  panValidation?: PanValidationResult;
  applicantName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  isPanVerified?: boolean;

  // Employment step
  employmentType?: EmploymentType;
  companyName?: string;

  // Work address step
  workAddress?: Address;

  // Personal address step
  personalAddress?: Address;
  sameAsWorkAddress?: boolean;

  // Income step
  monthlyIncome?: number;
  annualIncome?: number;
}

interface OnboardingState {
  /** Current step the user is on */
  currentStepId: OnboardingStepId | null;

  /** Set of completed step IDs */
  completedSteps: OnboardingStepId[];

  /** Per-step form data (saved as draft) */
  formData: OnboardingFormData;

  /** Whether the user is resuming a saved session */
  isResuming: boolean;

  /** Last saved timestamp */
  lastSavedAt: string | null;

  /** Has the user completed initial onboarding (pre-auth) */
  hasCompletedIntro: boolean;

  /** Has the user completed profile setup (Step 1) */
  hasCompletedProfile: boolean;

  // ─── Actions ───

  /** Set the current step */
  setCurrentStep: (stepId: OnboardingStepId) => void;

  /** Mark a step as completed */
  completeStep: (stepId: OnboardingStepId) => void;

  /** Uncomplete a step (e.g., user edits data) */
  uncompleteStep: (stepId: OnboardingStepId) => void;

  /** Update form data for a specific field */
  updateFormData: (data: Partial<OnboardingFormData>) => void;

  /** Save timestamp */
  saveProgress: () => void;

  /** Set resume flag */
  setResuming: (value: boolean) => void;

  setIntroCompleted: (value: boolean) => void;
  setProfileCompleted: (value: boolean) => void;
  reset: () => void;
}

const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await getSecureItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await setSecureItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await removeSecureItem(name);
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStepId: null,
      completedSteps: [],
      formData: {},
      isResuming: false,
      lastSavedAt: null,
      hasCompletedIntro: false,
      hasCompletedProfile: false,

      setCurrentStep: (stepId) => set({ currentStepId: stepId }),

      completeStep: (stepId) =>
        set((state) => {
          const completed = state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId];
          return {
            completedSteps: completed,
            lastSavedAt: new Date().toISOString(),
          };
        }),

      uncompleteStep: (stepId) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((id) => id !== stepId),
        })),

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      saveProgress: () => set({ lastSavedAt: new Date().toISOString() }),

      setResuming: (value) => set({ isResuming: value }),

      setIntroCompleted: (value) => set({ hasCompletedIntro: value }),

      setProfileCompleted: (value) => set({ hasCompletedProfile: value }),

      reset: () =>
        set({
          currentStepId: null,
          completedSteps: [],
          formData: {},
          isResuming: false,
          lastSavedAt: null,
          hasCompletedIntro: false,
          hasCompletedProfile: false,
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);