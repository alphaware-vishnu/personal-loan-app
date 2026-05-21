/**
 * Customer Profile API Services
 */

import { api } from '../api/client';

/**
 * Update/create customer profile details
 */
export const createCustomer = (payload: any) => {
  return api.patch(`/customer`, payload);
};

/**
 * Fetch customer profile details by ID
 */
export const getCustomerById = (customerId: number) => {
  return api.get(`/customer/${customerId}`);
};
