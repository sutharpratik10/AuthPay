import { baseEmailTemplate, codeBox, securityNote, instructionsList } from './base';

/**
 * Email verification template
 */
export const verificationEmailTemplate = (otpCode: string, appName: string): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Verify Your Email Address</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Enter the verification code below to complete your registration.</p>
    </div>
    
    ${codeBox(otpCode, 'This code will expire in 15 minutes')}
    
    ${instructionsList([
      'Go to the verification page in your browser',
      'Enter the 6-digit code above',
      'Click "Verify Email" to complete your registration'
    ])}
    
    ${securityNote('For your security, never share this verification code with anyone. If you didn\'t create an account, you can safely ignore this email.')}
  `;

  return baseEmailTemplate(content, appName);
};
