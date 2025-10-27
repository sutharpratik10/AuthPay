/**
 * Email Templates Index
 * Central export for all email templates
 */

export { verificationEmailTemplate } from './verification';
export { welcomeEmailTemplate } from './welcome';
export { passwordResetEmailTemplate } from './password-reset';
export { passwordChangeOTPTemplate } from './password-change';
export { accountDeletionTemplate } from './account-deletion';
export { twoFactorAuthTemplate } from './two-factor';
export { securityAlertTemplate } from './security-alert';
export { subscriptionPurchaseTemplate } from './subscription';

// Export base components for custom templates
export { 
  baseEmailTemplate, 
  codeBox, 
  securityNote, 
  primaryButton, 
  instructionsList 
} from './base';
