/**
 * KYC state store
 * Tracks PAN, Aadhaar, and selfie verification independently.
 */

import { create } from 'zustand';
import type { KycStatus } from '../types/kyc.type';
import type { PanValidationResult } from '../types/customer.type';

interface KycStoreState {
  // PAN
  panStatus: KycStatus;
  panData: PanValidationResult | null;

  // Aadhaar
  aadhaarStatus: KycStatus;
  aadhaarTransactionId: string | null;

  // Selfie
  selfieStatus: KycStatus;
  selfieUri: string | null;

  // Document upload
  documentStatus: KycStatus;

  // Overall
  overallKycStatus: KycStatus;

  // Actions
  setPanVerified: (data: PanValidationResult) => void;
  setPanStatus: (status: KycStatus) => void;
  setAadhaarStatus: (status: KycStatus, transactionId?: string) => void;
  setSelfieStatus: (status: KycStatus, uri?: string) => void;
  setDocumentStatus: (status: KycStatus) => void;
  computeOverallStatus: () => void;
  reset: () => void;
}

const initialState = {
  panStatus: 'NOT_STARTED' as KycStatus,
  panData: null as PanValidationResult | null,
  aadhaarStatus: 'NOT_STARTED' as KycStatus,
  aadhaarTransactionId: null as string | null,
  selfieStatus: 'NOT_STARTED' as KycStatus,
  selfieUri: null as string | null,
  documentStatus: 'NOT_STARTED' as KycStatus,
  overallKycStatus: 'NOT_STARTED' as KycStatus,
};

export const useKycStore = create<KycStoreState>((set, get) => ({
  ...initialState,

  setPanVerified: (data) => set({
    panStatus: 'VERIFIED',
    panData: data,
  }),

  setPanStatus: (status) => set({ panStatus: status }),

  setAadhaarStatus: (status, transactionId) => set({
    aadhaarStatus: status,
    ...(transactionId ? { aadhaarTransactionId: transactionId } : {}),
  }),

  setSelfieStatus: (status, uri) => set({
    selfieStatus: status,
    ...(uri ? { selfieUri: uri } : {}),
  }),

  setDocumentStatus: (status) => set({ documentStatus: status }),
  computeOverallStatus: () => {
    const { panStatus, aadhaarStatus, selfieStatus, documentStatus } = get();
    const statuses = [panStatus, aadhaarStatus, selfieStatus, documentStatus];

    if (statuses.some((s) => s === 'REJECTED')) {
      set({ overallKycStatus: 'REJECTED' });
    } else if (statuses.every((s) => s === 'VERIFIED')) {
      set({ overallKycStatus: 'VERIFIED' });
    } else if (statuses.some((s) => s === 'IN_PROGRESS' || s === 'PENDING_REVIEW' || s === 'VERIFIED')) {
      set({ overallKycStatus: 'IN_PROGRESS' });
    } else {
      set({ overallKycStatus: 'NOT_STARTED' });
    }
  },

  reset: () => set(initialState),
}));