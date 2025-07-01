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
            This is an automated message from ${process.env.NEXT_PUBLIC_APP_NAME || 'RSVP App'}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Your verification code: ${otpCode}`,
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
