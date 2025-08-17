import nodemailer from "nodemailer";
import { APP_CONFIG, getAppName } from "@/lib/config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: APP_CONFIG.EMAIL.HOST,
      port: APP_CONFIG.EMAIL.PORT,
      secure: APP_CONFIG.EMAIL.SECURE,
      auth: {
        user: APP_CONFIG.EMAIL.USER,
        pass: APP_CONFIG.EMAIL.PASS,
      },
    });
  }
  async sendEmail({ to, subject, html }: EmailOptions) {
    try {
      const result = await this.transporter.sendMail({
        from: `"${getAppName()}" <${APP_CONFIG.EMAIL.USER}>`,
        to,
        subject,
        html,
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }
  async sendVerificationEmail(email: string, otpCode: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Verify Your Email Address</h1>
          <p style="color: #666666; font-size: 16px; margin: 0;">Enter the verification code below to complete your registration.</p>
        </div>
        
        <div style="background-color: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: #333333; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
          <div style="font-size: 32px; font-weight: bold, color: #4F46E5; letter-spacing: 4px; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
          <p style="color: #666666; font-size: 12px; margin-top: 10px;">This code will expire in 15 minutes</p>
        </div>
        
        <div style="margin: 30px 0;">
          <p style="color: #333333; font-size: 14px; margin-bottom: 10px;"><strong>Instructions:</strong></p>
          <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Go to the verification page in your browser</li>
            <li>Enter the 6-digit code above</li>
            <li>Click "Verify Email" to complete your registration</li>
          </ol>
        </div>
          <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666666; font-size: 12px; margin: 0;">
            <strong>Security Note:</strong> For your security, never share this verification code with anyone. 
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Your verification code: ${otpCode}`,
      html,
    });
  }  async sendWelcomeEmail(email: string, name: string) {
    const loginUrl = `${APP_CONFIG.APP_URL}/auth/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${getAppName()}!</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your email has been verified successfully. You can now start using all the features of our application.</p>
        <a 
          href="${loginUrl}" 
          style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                 text-decoration: none; border-radius: 4px; margin: 16px 0;"
        >
          Sign In
        </a>
        <p>Thank you for joining us!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${getAppName()}!`,
      html,
    });
  }
  async sendPasswordResetEmail(email: string, otpCode: string, name: string) {
    const resetUrl = `${APP_CONFIG.APP_URL}/auth/forgot-password?step=verify&email=${encodeURIComponent(email)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
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
        
        <div style="margin: 30px 0;">
          <p style="color: #333333; font-size: 14px; margin-bottom: 10px;"><strong>Instructions:</strong></p>
          <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Go to the password reset page in your browser</li>
            <li>Enter the 6-digit code above</li>
            <li>Choose your new password</li>
            <li>Click "Reset Password" to complete the process</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${resetUrl}" 
            style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                   text-decoration: none; border-radius: 6px; font-weight: 500;"
          >
            Reset Your Password
          </a>
        </div>
        
        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666666; font-size: 12px; margin: 0;">
            <strong>Security Note:</strong> If you didn't request a password reset, you can safely ignore this email. 
            Your password will remain unchanged. For your security, never share this code with anyone.
          </p>
        </div>
          <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;    return this.sendEmail({
      to: email,
      subject: `Password Reset Code: ${otpCode}`,
      html,
    });
  }

  async sendPasswordChangeOTP(email: string, otpCode: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Password Change Verification</h1>
          <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, we received a request to change your password.</p>
        </div>
        
        <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: #333333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Your Password Change Verification Code:</p>
          <div style="font-size: 32px; font-weight: bold; color: #4F46E5; font-family: 'Courier New', monospace; letter-spacing: 8px; margin: 10px 0;">
            ${otpCode}
          </div>
          <p style="color: #666666; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
            <strong>This code expires in 10 minutes</strong>
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <p style="color: #333333; font-size: 14px; margin-bottom: 10px;"><strong>Instructions:</strong></p>
          <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Return to your account settings page</li>
            <li>Enter the 6-digit code above</li>
            <li>Click "Verify & Change Password" to complete the process</li>
          </ol>
        </div>
        
        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666666; font-size: 12px; margin: 0;">
            <strong>Security Note:</strong> If you didn't request a password change, please contact support immediately. 
            For your security, never share this code with anyone.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;    return this.sendEmail({
      to: email,
      subject: `Password Change Verification Code: ${otpCode}`,
      html,
    });
  }

  /**
   * Send account deletion confirmation email
   */
  async sendAccountDeletionEmail(email: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Account Deleted Successfully</h1>
          <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name}, your account has been permanently deleted.</p>
        </div>
        
        <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; margin: 30px 0;">
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">👋</div>
            <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Goodbye from ${getAppName()}</h2>
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
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Account Deleted - ${getAppName()}`,
      html,
    });
  }

  async send2FACode(email: string, otpCode: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
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
        
        <div style="margin: 30px 0;">
          <p style="color: #333333; font-size: 14px; margin-bottom: 10px;"><strong>Instructions:</strong></p>
          <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Return to the login page where you were prompted for 2FA</li>
            <li>Enter the 6-digit code above</li>
            <li>Click "Verify & Continue" to complete your login</li>
          </ol>
        </div>
        
        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666666; font-size: 12px; margin: 0;">
            <strong>Security Note:</strong> If you didn't try to sign in, please contact support immediately and consider changing your password. 
            For your security, never share this code with anyone.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Two-Factor Authentication Code: ${otpCode}`,
      html,
    });
  }

  /**
   * Send security alert email for login events
   */
  async sendSecurityAlertEmail(
    email: string, 
    name: string, 
    loginTime: Date, 
    location: string, 
    ipAddress: string,
    deviceInfo: string
  ) {
    const formattedTime = loginTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
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
          <a 
            href="${APP_CONFIG.APP_URL}/protected/account" 
            style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                   text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;"
          >
            Review Account Settings
          </a>
          <a 
            href="${APP_CONFIG.APP_URL}/auth/login" 
            style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; 
                   text-decoration: none; border-radius: 6px; font-weight: 500;"
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
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated security message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Security Alert: New login to your ${getAppName()} account`,
      html,
    });
  }

  /**
   * Send email Subscription Purchase
   */
  async sendSubscriptionPurchaseEmail(email: string, name: string, planName: string, amount: number, purchaseDate: Date) {
    const formattedDate = purchaseDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Subscription Purchase Confirmation</h1>
          <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, thank you for your subscription purchase!</p>
        </div>
        
        <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Your Subscription Details</h2>
          <p style="color: #666666; font-size: 16px; margin-bottom: 5px;"><strong>Plan:</strong> ${planName}</p>
          <p style="color: #666666; font-size: 16px; margin-bottom: 5px;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p style="color: #666666; font-size: 16px;"><strong>Purchase Date:</strong> ${formattedDate}</p>
        </div>
        
        <div style="margin-top: 30px;">
          <h3 style="color: #333333; font-size: 16px; margin-bottom: 15px;">What happens next?</h3>
          <ul style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Your subscription is now active and you can start enjoying all the benefits of your plan</li>
            <li>You will receive a confirmation receipt shortly</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.5;">
            <strong>Why am I receiving this?</strong> This email confirms your subscription purchase. If you did not make this purchase, please contact our support team.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            This is an automated message from ${getAppName()}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Subscription Purchase Confirmation - ${planName}`,
      html,
    });
  }
}

export const emailService = new EmailService();
