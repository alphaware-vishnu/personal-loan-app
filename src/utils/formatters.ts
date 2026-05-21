/**
 * Formatting utilities
 * Centralized formatters for currency, dates, phone numbers, etc.
 */

/**
 * Format number as Indian Rupees (₹)
 * @example formatCurrency(150000) → "₹1,50,000"
 */
export const formatCurrency = (amount: number, showDecimals = false): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Format Indian mobile number for display
 * @example formatMobile("9876543210") → "+91 987 654 3210"
 */
export const formatMobile = (mobile: string): string => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const num = cleaned.slice(2);
    return `+91 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return mobile;
};

/**
 * Mask mobile number for privacy
 * @example maskMobile("9876543210") → "987****210"
 */
export const maskMobile = (mobile: string): string => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const num = cleaned.slice(-10);
    return `${num.slice(0, 3)}****${num.slice(7)}`;
  }
  return mobile;
};

/**
 * Format PAN number for display
 * @example formatPan("ABCDE1234F") → "ABCDE****F"
 */
export const maskPan = (pan: string): string => {
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 5)}****${pan.slice(9)}`;
};

/**
 * Format date for display
 * @example formatDate("1995-06-15") → "15 Jun 1995"
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format relative time
 * @example formatRelativeTime(Date.now() - 60000) → "1 minute ago"
 */
export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`;
  if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  if (mins > 0) return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  return 'Just now';
};