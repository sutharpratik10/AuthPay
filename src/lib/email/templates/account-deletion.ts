import { baseEmailTemplate } from './base';

/**
 * Account deletion confirmation email template
 */
export const accountDeletionTemplate = (name: string, appName: string): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Account Deleted Successfully</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name}, your account has been permanently deleted.</p>
    </div>
    
    <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; margin: 30px 0;">
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">👋</div>
        <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Goodbye from ${appName}</h2>
        <p style="color: #666666; font-size: 16px; margin: 0; line-height: 1.6;">
          We're sorry to see you go! Your account and all associated data have been permanently removed from our systems.
        </p>
      </div>
    </div>
    
    <div style="margin: 30px 0;">
      <h3 style="color: #333333; font-size: 16px; margin-bottom: 15px;">What happens next:</h3>
      <ul style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li>All your personal data has been securely deleted</li>
        <li>Your login sessions have been terminated</li>
        <li>You will no longer receive emails from us</li>
        <li>This email address can be used to create a new account in the future</li>
      </ul>
    </div>
    
    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
      <p style="color: #666666; font-size: 12px; margin: 0;">
        <strong>Need help?</strong> If you deleted your account by mistake or have any questions, 
        please contact our support team as soon as possible. We may be able to help restore your account 
        within a limited time frame.
      </p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};
