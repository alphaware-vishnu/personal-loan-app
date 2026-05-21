/**
 * Customer type definitions
 */

import { EmploymentType } from '../constants/onboardingSteps';

export interface Customer {
  id: number;
  applicantName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  panNumber?: string;
  aadhaarNumber?: string;
  employmentType?: EmploymentType;
  monthlyIncome?: number;
  companyName?: string;
  leadSource?: string;
  leadStatus?: string;
  applicationSource?: string;
  clientType?: string;
  isVoterIdActive?: boolean;
  voterId?: string; // Backend field name for PAN

  // Addresses
  workAddress?: Address;
  personalAddress?: Address;
  address?: Address; // Legacy single address field

  // Bank details
  customerBanks?: CustomerBank[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  flatNo?: string;
  buildingName?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city: string;
  stateName: string;
  pinCode: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

export interface CustomerBank {
  id?: number;
  accountHolderName: string;
  accountNo: string;
  bank: string;
  branch: string;
  ifsc: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isDefault: boolean;
  isVerified?: boolean;
  city?: string;
}

/** PAN validation response from API */
export interface PanValidationResult {
  isValid: boolean;
  name: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  panNumber: string;
  category?: string; // Individual, Company, etc.
}

/** Employment details */
export interface EmploymentDetails {
  type: EmploymentType;
  companyName?: string;
  designation?: string;
  workingSince?: string;
  monthlyIncome?: number;
  annualIncome?: number;
}
