/**
 * Customer Profile API Services
 */

import { api } from '../api/client';
import type { Address } from '../types/customer.type';

/**
 * Fetch customer profile details by customer ID from /customer/profile
 */
export const getCustomerProfile = async (customerId: number) => {
  const response = await api.get(`/customer/profile`, {
    params: { customerId },
  });
  return response.data; // ApiResponseCustomerProfileResponse
};

/**
 * Create or update customer profile details at /customer/profile
 */
export const updateCustomerProfile = async (payload: any) => {
  const response = await api.post(`/customer/profile`, payload);
  return response.data; // ApiResponseCustomerProfileResponse
};

/**
 * Update/create customer details (Legacy)
 */
export const createCustomer = (payload: any) => {
  return api.patch(`/customer`, payload);
};

/**
 * Fetch customer details by ID (Legacy)
 */
export const getCustomerById = (customerId: number) => {
  return api.get(`/customer/${customerId}`);
};

// ─── Mapper Helpers ───

export const mapApiToLocalAddress = (apiAddr: any): Address => {
  if (!apiAddr) {
    return {
      flatNo: '',
      buildingName: '',
      area: '',
      city: '',
      stateName: '',
      pinCode: '',
      countryName: 'India',
    };
  }
  return {
    flatNo: apiAddr.house || apiAddr.flat || '',
    buildingName: apiAddr.building || '',
    area: apiAddr.area || '',
    city: apiAddr.city || '',
    stateName: apiAddr.state || '',
    pinCode: apiAddr.pincode || apiAddr.postcode || '',
    countryName: apiAddr.country || 'India',
  };
};

export const mapLocalToApiHomeAddress = (localAddr: Address | undefined) => {
  if (!localAddr) return undefined;
  return {
    house: localAddr.flatNo || '',
    building: localAddr.buildingName || '',
    area: localAddr.area || '',
    city: localAddr.city || '',
    state: localAddr.stateName || '',
    pincode: localAddr.pinCode || '',
  };
};

export const mapLocalToApiOfficeAddress = (localAddr: Address | undefined, companyName: string) => {
  if (!localAddr && !companyName) return undefined;
  return {
    officeName: companyName || '',
    building: localAddr?.flatNo || '', // Mapping flatNo to building for office address
    area: localAddr?.area || '',
    city: localAddr?.city || '',
    state: localAddr?.stateName || '',
    pincode: localAddr?.pinCode || '',
  };
};

export const mapApiToLocalEmploymentType = (apiType: string | undefined): any => {
  if (!apiType) return undefined;
  switch (apiType.toUpperCase()) {
    case 'SALARIED':
      return 'salaried';
    case 'SELF_EMPLOYED':
      return 'self_employed';
    case 'BUSINESS_OWNER':
      return 'business_owner';
    default:
      return 'self_employed';
  }
};

export const mapLocalToApiEmploymentType = (localType: string | undefined): string | undefined => {
  if (!localType) return undefined;
  switch (localType) {
    case 'salaried':
      return 'SALARIED';
    case 'self_employed':
    case 'freelancer':
    case 'student_other':
      return 'SELF_EMPLOYED';
    case 'business_owner':
      return 'BUSINESS_OWNER';
    default:
      return 'SELF_EMPLOYED';
  }
};
