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
  passwordlessOTPTemplate,
  magicLinkTemplate,
  refundRequestedTemplate,
  refundApprovedTemplate,
  refundCompletedTemplate,
  refundRejectedTemplate,
} from "@/lib/email/templates";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    // console.log('[EmailService] Initializing with config:', {
    //   host: APP_CONFIG.EMAIL.HOST,
    //   port: APP_CONFIG.EMAIL.PORT,
    //   secure: APP_CONFIG.EMAIL.SECURE,
    //   user: APP_CONFIG.EMAIL.USER ? '***configured***' : 'NOT SET',
    //   pass: APP_CONFIG.EMAIL.PASS ? '***configured***' : 'NOT SET',
    // });

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
    // Mask sensitive info in logs like 6-8 digit OTP codes
    const safeSubject = subject.replace(/\b\d{6,8}\b/g, '******');
    console.log('[EmailService] Attempting to send email:', { to, subject: safeSubject });
    try {
      const result = await this.transporter.sendMail({
        from: `"${getAppName()}" <${APP_CONFIG.EMAIL.USER}>`,
        to,
        subject,
        html,
      });

      console.log('[EmailService] Email sent successfully:', { to, messageId: result.messageId });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
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
  } async sendWelcomeEmail(email: string, name: string) {
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

  async sendPasswordlessOTP(email: string, otpCode: string) {
    const html = passwordlessOTPTemplate(otpCode, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Your Login Code: ${otpCode}`,
      html,
    });
  }

  async sendMagicLink(email: string, token: string) {
    const loginUrl = `${APP_CONFIG.APP_URL}/auth/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const html = magicLinkTemplate(loginUrl, getAppName() || 'Our App');

    return this.sendEmail({
      to: email,
      subject: `Sign in to ${getAppName() || 'Our App'}`,
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



  async sendRefundRequestedEmail(email: string, amount: string, planName: string, reason: string) {
    const html = refundRequestedTemplate(getAppName() || 'Our App', amount, planName, reason);
    return this.sendEmail({
      to: email,
      subject: `Refund Request Received - ${planName}`,
      html,
    });
  }

  async sendRefundApprovedEmail(email: string, amount: string, planName: string) {
    const html = refundApprovedTemplate(getAppName() || 'Our App', amount, planName);
    return this.sendEmail({
      to: email,
      subject: `Refund Approved - ${planName}`,
      html,
    });
  }

  async sendRefundCompletedEmail(email: string, amount: string, planName: string, refundId: string) {
    const html = refundCompletedTemplate(getAppName() || 'Our App', amount, planName, refundId);
    return this.sendEmail({
      to: email,
      subject: `Refund Processed - ${planName}`,
      html,
    });
  }

  async sendRefundRejectedEmail(email: string, planName: string, reason: string) {
    const html = refundRejectedTemplate(getAppName() || 'Our App', planName, reason);
    return this.sendEmail({
      to: email,
      subject: `Update on your Refund Request - ${planName}`,
      html,
    });
  }
}

const globalForEmail = globalThis as unknown as {
  emailService: EmailService | undefined;
};

export const emailService = globalForEmail.emailService ?? new EmailService();

if (process.env.NODE_ENV !== "production") {
  globalForEmail.emailService = emailService;
}
