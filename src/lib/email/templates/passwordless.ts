import { baseEmailTemplate, codeBox, primaryButton, securityNote } from './base';

export const passwordlessOTPTemplate = (otpCode: string, appName: string) => {
  const content = `
    <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Sign in to ${appName}</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0; text-align: center;">
      Use the verification code below to securely log into your account.
    </p>
    
    ${codeBox(otpCode, 'This code will expire in 15 minutes.')}
    
    ${securityNote('If you did not request this login code, you can safely ignore this email.')}
  `;

  return baseEmailTemplate(content, appName);
};

export const magicLinkTemplate = (url: string, appName: string) => {
  const content = `
    <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Sign in to ${appName}</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0; text-align: center;">
      Click the button below to securely log into your account. No password required.
    </p>
    
    ${primaryButton(url, 'Sign In Now')}
    
    <p style="color: #4b5563; font-size: 14px; line-height: 20px; margin: 24px 0 0 0; text-align: center;">
      This link will expire in 15 minutes and can only be used once.
    </p>
    
    <p style="color: #6b7280; font-size: 13px; line-height: 18px; margin: 16px 0 0 0; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${url}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${url}</a>
    </p>
    
    ${securityNote('If you did not request to sign in, you can safely ignore this email.')}
  `;

  return baseEmailTemplate(content, appName);
};
