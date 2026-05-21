/**
 * Secure Storage Utility
 * Wraps expo-secure-store to persist sensitive data like auth tokens.
 */

import * as SecureStore from 'expo-secure-store';

/**
 * Save a value securely under a key.
 */
export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`[SecureStorage] Error setting item for key "${key}":`, error);
    throw new Error('Failed to store data securely.');
  }
};

/**
 * Retrieve a value securely by key.
 */
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[SecureStorage] Error getting item for key "${key}":`, error);
    return null;
  }
};

/**
 * Delete a value securely by key.
 */
export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`[SecureStorage] Error removing item for key "${key}":`, error);
    throw new Error('Failed to delete secure data.');
  }
};
