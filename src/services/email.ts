import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html }: EmailOptions) {
    try {
      const result = await this.transporter.sendMail({
        from: `"${process.env.NEXT_PUBLIC_APP_NAME || 'RSVP App'}" <${process.env.EMAIL_USER}>`,
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

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Thank you for signing up! Please verify your email address to get started.</p>
        <a 
          href="${verificationUrl}" 
          style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                 text-decoration: none; border-radius: 4px; margin: 16px 0;"
        >
          Verify Email
        </a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Verify your email address",
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'RSVP App'}!</h2>
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
      subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'RSVP App'}!`,
      html,
    });
  }
}

export const emailService = new EmailService();
