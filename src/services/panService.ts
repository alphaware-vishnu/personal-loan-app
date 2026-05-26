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
    const response = await api.post(`/customer/pan-validation`, null, {
      params: { pan: panNumber },
    });

    const responseData = response.data?.data;
    const dataNode = responseData?.data;

    if (!responseData || !dataNode) {
      throw new Error(response.data?.message || 'PAN validation failed.');
    }

    const isPanValid = dataNode.status?.toUpperCase() === 'VALID' || dataNode.status?.toUpperCase() === 'ACTIVE';

    return {
      isValid: isPanValid,
      panNumber: dataNode.pan || panNumber.toUpperCase(),
      name: dataNode.name || '',
      dateOfBirth: '1995-06-15', // Default since DOB is not returned by this API
      gender: panNumber.charAt(3) === 'P' ? 'MALE' : panNumber.charAt(3) === 'C' ? 'FEMALE' : 'MALE', // Default gender derived from PAN
      category: 'Individual',
    };
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