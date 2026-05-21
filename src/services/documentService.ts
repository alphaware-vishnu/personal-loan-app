/**
 * Document API Services
 */

import { api } from '../api/client';

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
