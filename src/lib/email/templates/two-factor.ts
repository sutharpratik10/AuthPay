import { baseEmailTemplate, securityNote, instructionsList } from './base';

/**
 * Two-factor authentication code email template
 */
export const twoFactorAuthTemplate = (otpCode: string, name: string, appName: string): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Two-Factor Authentication</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, someone is trying to sign in to your account.</p>
    </div>
    
    <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <p style="color: #333333; font-size: 16px; margin-bottom: 15px; font-weight: 600;">Your 2FA Verification Code:</p>
      <div style="font-size: 32px; font-weight: bold; color: #4F46E5; font-family: 'Courier New', monospace; letter-spacing: 8px; margin: 10px 0;">
        ${otpCode}
      </div>
      <p style="color: #666666; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
        <strong>This code expires in 10 minutes</strong>
      </p>
    </div>
    
    ${instructionsList([
      'Return to the login page where you were prompted for 2FA',
      'Enter the 6-digit code above',
      'Click "Verify & Continue" to complete your login'
    ])}
    
    ${securityNote('If you didn\'t try to sign in, please contact support immediately and consider changing your password. For your security, never share this code with anyone.')}
  `;

  return baseEmailTemplate(content, appName);
};
