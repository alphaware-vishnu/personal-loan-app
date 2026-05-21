/**
 * Offer state store
 * Tracks eligibility result, available offers, and selected offer.
 */

import { create } from 'zustand';
import type { EligibilityStatus, EligibilityResult, SelectedOffer } from '../types/offer.type';

interface OfferStoreState {
  /** Eligibility check status */
  eligibilityStatus: EligibilityStatus;

  /** Eligibility result from backend */
  eligibilityResult: EligibilityResult | null;

  /** Selected/customized offer */
  selectedOffer: SelectedOffer | null;

  /** User's chosen amount (from slider) */
  selectedAmount: number;

  /** User's chosen tenure (from slider) */
  selectedTenure: number;

  // Actions
  setEligibilityStatus: (status: EligibilityStatus) => void;
  setEligibilityResult: (result: EligibilityResult) => void;
  setSelectedOffer: (offer: SelectedOffer) => void;
  setSelectedAmount: (amount: number) => void;
  setSelectedTenure: (tenure: number) => void;
  reset: () => void;
}

const initialState = {
  eligibilityStatus: 'PENDING' as EligibilityStatus,
  eligibilityResult: null as EligibilityResult | null,
  selectedOffer: null as SelectedOffer | null,
  selectedAmount: 0,
  selectedTenure: 0,
};

export const useOfferStore = create<OfferStoreState>((set) => ({
  ...initialState,

  setEligibilityStatus: (status) => set({ eligibilityStatus: status }),

  setEligibilityResult: (result) => set({
    eligibilityResult: result,
    eligibilityStatus: result.status,
    selectedAmount: result.maxAmount,
    selectedTenure: result.maxTenure,
  }),

  setSelectedOffer: (offer) => set({ selectedOffer: offer }),

  setSelectedAmount: (amount) => set({ selectedAmount: amount }),

  setSelectedTenure: (tenure) => set({ selectedTenure: tenure }),

  reset: () => set(initialState),
}));
