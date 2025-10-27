import nodemailer from "nodemailer";
import { APP_CONFIG, getAppName } from "@/lib/utils/config";
import {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangeOTPTemplate,
  accountDeletionTemplate,
  twoFactorAuthTemplate,
  securityAlertTemplate,
  subscriptionPurchaseTemplate,
} from "@/lib/email/templates";

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
    const html = verificationEmailTemplate(otpCode, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Your verification code: ${otpCode}`,
      html,
    });
  }  async sendWelcomeEmail(email: string, name: string) {
    const loginUrl = `${APP_CONFIG.APP_URL}/auth/login`;
    const html = welcomeEmailTemplate(name, loginUrl, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${getAppName()}!`,
      html,
    });
  }
  async sendPasswordResetEmail(email: string, otpCode: string, name: string) {
    const resetUrl = `${APP_CONFIG.APP_URL}/auth/forgot-password?step=verify&email=${encodeURIComponent(email)}`;
    const html = passwordResetEmailTemplate(otpCode, name, resetUrl, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Password Reset Code: ${otpCode}`,
      html,
    });
  }

  async sendPasswordChangeOTP(email: string, otpCode: string, name: string) {
    const html = passwordChangeOTPTemplate(otpCode, name, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Password Change Verification Code: ${otpCode}`,
      html,
    });
  }

  /**
   * Send account deletion confirmation email
   */
  async sendAccountDeletionEmail(email: string, name: string) {
    const html = accountDeletionTemplate(name, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Account Deleted - ${getAppName()}`,
      html,
    });
  }

  async send2FACode(email: string, otpCode: string, name: string) {
    const html = twoFactorAuthTemplate(otpCode, name, getAppName() || 'Our App');

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
    const html = securityAlertTemplate(
      name,
      loginTime,
      location,
      ipAddress,
      deviceInfo,
      APP_CONFIG.APP_URL || '',
      getAppName() || 'Our App'
    );

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
    const html = subscriptionPurchaseTemplate(name, planName, amount, purchaseDate, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Subscription Purchase Confirmation - ${planName}`,
      html,
    });
  }
}

export const emailService = new EmailService();
