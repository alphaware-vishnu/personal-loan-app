/**
 * PAN Validation Service
 * Calls PAN validation API and returns name, DOB, gender.
 */

import { api } from '../api/client';
import type { PanValidationResult } from '../types/customer.type';

/**
 * Validate PAN number and get customer details.
 * 
 * @param panNumber - 10-character PAN string (e.g. ABCDE1234F)
 * @returns PAN validation result with name, DOB, gender
 * 
 * NOTE: This uses a mock implementation until the actual PAN API is integrated.
 * Replace the mock logic with your actual backend endpoint.
 */
export const validatePan = async (panNumber: string): Promise<PanValidationResult> => {
  try {
    // TODO: Replace with actual PAN validation API endpoint
    // const response = await api.post('/kyc/pan/validate', { panNumber });
    // return response.data.data;

    // ─── Mock Implementation ───
    // Simulates a PAN validation API call for development
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // Generate mock data based on PAN
    const mockResult: PanValidationResult = {
      isValid: true,
      panNumber: panNumber.toUpperCase(),
      name: generateMockName(panNumber),
      dateOfBirth: '1995-06-15',
      gender: panNumber.charAt(3) === 'P' ? 'MALE' : panNumber.charAt(3) === 'C' ? 'FEMALE' : 'MALE',
      category: 'Individual',
    };

    return mockResult;
  } catch (error: any) {
    console.error('[PAN Service] Validation failed:', error);
    throw new Error(error.response?.data?.message || 'PAN validation failed. Please try again.');
  }
};

/**
 * Calculate age from date of birth string
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Mock helper — generate mock name from PAN number
const generateMockName = (pan: string): string => {
  const code = pan.slice(0, 3).toUpperCase();
  if (code === 'VISH') return 'Vishnu Sharma';
  if (code === 'ALPH') return 'Alpha User';
  return 'Aditya Verma';
};