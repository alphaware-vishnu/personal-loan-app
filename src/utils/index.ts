/**
 * Formats labels for display, specifically mapping Voter ID references to PAN Card
 * while maintaining the underlying data structure names.
 */
export const formatLabel = (label: string): string => {
  if (!label) return label;
  
  // Handle Voter-ID Front/Back cases
  if (label.toLowerCase() === 'voter-id front') return 'PAN Card Front';
  if (label.toLowerCase() === 'voter-id back') return 'PAN Card Back';
  
  // Generic replacements
  return label
    .replace(/voter-id/gi, 'PAN Card')
    .replace(/voter id/gi, 'PAN Card')
    .replace(/voter/gi, 'PAN Card');
};
/**
 * Sanitizes name input by removing numbers and special characters.
 * Allows only alphabets and spaces.
 */
export const cleanNameInput = (text: string): string => {
  return text.replace(/[^a-zA-Z\s]/g, "");
};

// Export security utilities
export * from './security/secureStorage';
export * from './security/encryption';
export * from './security/deviceInfo';
export * from './security/sessionManager';

