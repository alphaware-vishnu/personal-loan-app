/**
 * Local Data Encryption Utility
 * Provides AES-256 encryption/decryption using crypto-js.
 * Automatically generates a device-unique encryption key stored in SecureStore.
 */

import CryptoJS from 'crypto-js';
import { getSecureItem, setSecureItem } from './secureStorage';

const KEY_STORE_NAME = 'app_local_encryption_key';
const FALLBACK_KEY = 'alphaware-secure-fallback-key-3e4cc037';

let cachedKey: string | null = null;

/**
 * Get or generate the local encryption key.
 */
export const getEncryptionKey = async (): Promise<string> => {
  if (cachedKey) return cachedKey;

  try {
    let key = await getSecureItem(KEY_STORE_NAME);
    if (!key) {
      // Generate a random key (32 bytes = 256 bits of entropy)
      const randomWords = CryptoJS.lib.WordArray.random(32);
      key = CryptoJS.enc.Hex.stringify(randomWords);
      await setSecureItem(KEY_STORE_NAME, key);
    }
    cachedKey = key;
    return key;
  } catch (error) {
    console.error('[Encryption] Failed to get or generate encryption key, using fallback:', error);
    return FALLBACK_KEY;
  }
};

/**
 * Encrypt plain text using AES-256.
 */
export const encryptData = async (plainText: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    return CryptoJS.AES.encrypt(plainText, key).toString();
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt cipher text using AES-256.
 */
export const decryptData = async (cipherText: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decrypted string is empty or invalid key used');
    }
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    throw new Error('Decryption failed');
  }
};