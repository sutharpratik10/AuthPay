import { baseEmailTemplate, primaryButton } from './base';

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (name: string, loginUrl: string, appName: string): string => {
  const content = `
    <h2>Welcome to ${appName}!</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Your email has been verified successfully. You can now start using all the features of our application.</p>
    <div style="margin: 16px 0;">
      ${primaryButton(loginUrl, 'Sign In')}
    </div>
    <p>Thank you for joining us!</p>
  `;

  return baseEmailTemplate(content, appName);
};
