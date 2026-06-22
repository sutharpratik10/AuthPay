import { baseEmailTemplate, primaryButton, securityNote, instructionsList } from './base';

/**
 * Password reset email template
 */
export const passwordResetEmailTemplate = (
  otpCode: string, 
  name: string, 
  resetUrl: string, 
  appName: string
): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Password Reset Request</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, we received a request to reset your password.</p>
    </div>
    
    <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <p style="color: #333333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Your Password Reset Code:</p>
      <div style="font-size: 32px; font-weight: bold; color: #4F46E5; font-family: 'Courier New', monospace; letter-spacing: 8px; margin: 10px 0;">
        ${otpCode}
      </div>
      <p style="color: #666666; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
        <strong>This code expires in 15 minutes</strong>
      </p>
    </div>
    
    ${instructionsList([
      'Go to the password reset page in your browser',
      'Enter the 6-digit code above',
      'Choose your new password',
      'Click "Reset Password" to complete the process'
    ])}

    <div style="text-align: center; margin: 30px 0;">
      ${primaryButton(resetUrl, 'Reset Your Password')}
    </div>
    
    ${securityNote('If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged. For your security, never share this code with anyone.')}
  `;

  return baseEmailTemplate(content, appName);
};
