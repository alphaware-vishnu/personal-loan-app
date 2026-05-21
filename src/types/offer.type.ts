/**
 * Offer & Eligibility type definitions
 */

export type EligibilityStatus = 'PENDING' | 'PROCESSING' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ERROR';

export interface EligibilityResult {
  status: EligibilityStatus;
  maxAmount: number;
  minAmount: number;
  maxTenure: number;
  minTenure: number;
  interestRate: number;
  processingFee?: number;
  creditScore?: number;
  message?: string;
}

export interface Offer {
  id: number;
  schemeMasterId: number;
  name: string;
  loanAmount: number;
  minAmount: number;
  maxAmount: number;
  defaultInterest: number;
  defaultTenure: number;
  minTenure: number;
  maxTenure: number;
  tenureFrequency: 'MONTHLY' | 'WEEKLY';
  processingFee: number;
  productId: number;
  isActive: boolean;
}

export interface SelectedOffer {
  offerId: number;
  amount: number;
  tenure: number;
  interest: number;
  emi: number;
  disbursalAmount: number;
  totalPayable: number;
}
