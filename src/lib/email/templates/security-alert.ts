import { baseEmailTemplate, primaryButton } from './base';

/**
 * Security alert email template for login events
 */
export const securityAlertTemplate = (
  name: string,
  loginTime: Date,
  location: string,
  ipAddress: string,
  deviceInfo: string,
  appUrl: string,
  appName: string
): string => {
  const formattedTime = loginTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background-color: #4F46E5; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 24px;">🔐</span>
      </div>
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Security Alert: New Login</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, we detected a new login to your account.</p>
    </div>
    
    <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 30px 0;">
      <h3 style="color: #333333; font-size: 18px; margin-bottom: 20px; margin-top: 0;">Login Details</h3>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #333333; font-size: 14px;">Time:</strong>
        <span style="color: #666666; font-size: 14px; margin-left: 8px;">${formattedTime}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #333333; font-size: 14px;">Location:</strong>
        <span style="color: #666666; font-size: 14px; margin-left: 8px;">${location}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #333333; font-size: 14px;">IP Address:</strong>
        <span style="color: #666666; font-size: 14px; margin-left: 8px;">${ipAddress}</span>
      </div>
      
      <div style="margin-bottom: 0;">
        <strong style="color: #333333; font-size: 14px;">Device:</strong>
        <span style="color: #666666; font-size: 14px; margin-left: 8px;">${deviceInfo}</span>
      </div>
    </div>
    
    <div style="margin: 30px 0;">
      <h3 style="color: #333333; font-size: 16px; margin-bottom: 15px;">Was this you?</h3>
      <div style="color: #666666; font-size: 14px; line-height: 1.6;">
        <p style="margin-bottom: 10px;"><strong>✅ If this was you:</strong> No action is needed. You can safely ignore this email.</p>
        <p style="margin-bottom: 0;"><strong>⚠️ If this wasn't you:</strong> Someone else may have access to your account. Please take the following steps immediately:</p>
      </div>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #856404; font-size: 14px; margin-bottom: 10px; margin-top: 0;">Security Recommendations:</h4>
      <ul style="color: #856404; font-size: 13px; line-height: 1.5; margin: 0; padding-left: 20px;">
        <li>Change your password immediately</li>
        <li>Review your account settings and recent activity</li>
        <li>Enable two-factor authentication if not already active</li>
        <li>Log out of all devices and sessions</li>
        <li>Contact our support team if you need assistance</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${primaryButton(`${appUrl}/protected/account`, 'Review Account Settings')}
      <a 
        href="${appUrl}/auth/login" 
        style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; 
               text-decoration: none; border-radius: 6px; font-weight: 500; margin-left: 10px;"
      >
        Secure My Account
      </a>
    </div>
    
    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
      <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.5;">
        <strong>Why am I receiving this?</strong> Security alerts help protect your account by notifying you of login activity. 
        You can manage your notification preferences in your account settings. 
        If you frequently travel or use multiple devices, you may receive these emails more often.
      </p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};
