/**
 * Document API Services
 */

import { api, userManagementApi } from '../api/client';

/**
 * Upload a document (identity proof, bank statement, etc.)
 */
export const uploadDocument = (formData: FormData) => {
  return api.post(`/document/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Upload a document to UMS (User Management System)
 */
export const uploadDocumentToUms = (formData: FormData) => {
  return userManagementApi.post(`/document/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Get the download URL for a document by its ID
 */
export const getDocumentDownloadPath = (id: number) => {
  return api.get(`/document/download`, {
    params: {
      ids: [id],
    },
  });
};

/**
 * Fetch required/uploaded documents for a specific product ID
 */
export const getProductDocuments = (productId: number) => {
  return api.get(`/product-document/${productId}`);
};

/**
 * Get the download details for a document from UMS by its ID
 */
export const getDocumentDownloadFromUms = (id: number) => {
  return userManagementApi.get(`/document/download`, {
    params: {
      ids: [id],
    },
  });
};

