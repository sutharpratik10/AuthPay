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
          <div style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; font-family: 'Courier New', monospace;">
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
    `;

    return this.sendEmail({
      to: email,
      subject: `Password Change Verification Code: ${otpCode}`,
      html,
    });
  }
}

export const emailService = new EmailService();
