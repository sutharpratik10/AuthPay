// Subscription Expiration Date Calculation Utility

/**
 * Calculate subscription expiration date based on billing cycle
 * @param startDate - The subscription start date
 * @param billingCycle - The billing cycle (monthly, yearly, etc.)
 * @returns The calculated expiration date
 */
export function calculateSubscriptionExpiryDate(startDate: Date, billingCycle: string): Date {
  const expiryDate = new Date(startDate);
  
  switch (billingCycle.toLowerCase()) {
    case 'monthly':
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case 'yearly':
    case 'annual':
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
    case 'weekly':
      expiryDate.setDate(expiryDate.getDate() + 7);
      break;
    case 'quarterly':
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;
    case 'lifetime':
      // Set to a far future date for lifetime subscriptions
      return new Date('2099-12-31');
    default:
      // Default to monthly if billing cycle is unknown
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
  }
  
  return expiryDate;
}

/**
 * Check if a subscription is expired
 * @param expiryDate - The subscription expiry date
 * @returns True if subscription is expired
 */
export function isSubscriptionExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false; // No expiry date means no expiration
  return new Date() > expiryDate;
}

/**
 * Get days remaining until subscription expires
 * @param expiryDate - The subscription expiry date
 * @returns Number of days remaining (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: Date | null): number {
  if (!expiryDate) return Infinity; // No expiry date
  
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format expiry status for display
 * @param expiryDate - The subscription expiry date
 * @returns Formatted status string
 */
export function getExpiryStatus(expiryDate: Date | null): {
  status: 'active' | 'expiring' | 'expired' | 'lifetime';
  message: string;
  daysRemaining: number;
} {
  if (!expiryDate) {
    return {
      status: 'lifetime',
      message: 'No expiration',
      daysRemaining: Infinity
    };
  }
  
  const daysRemaining = getDaysUntilExpiry(expiryDate);
  
  if (daysRemaining < 0) {
    return {
      status: 'expired',
      message: `Expired ${Math.abs(daysRemaining)} days ago`,
      daysRemaining
    };
  } else if (daysRemaining <= 7) {
    return {
      status: 'expiring',
      message: `Expires in ${daysRemaining} days`,
      daysRemaining
    };
  } else {
    return {
      status: 'active',
      message: `${daysRemaining} days remaining`,
      daysRemaining
    };
  }
}
