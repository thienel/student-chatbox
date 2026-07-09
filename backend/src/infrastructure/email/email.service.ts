import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('SMTP_USER', '');
    const pass = this.config.get<string>('SMTP_PASS', '');
    const host = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.config.get<number>('SMTP_PORT', 587);

    this.fromEmail = user;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.fromEmail) {
        this.logger.warn('SMTP_USER is not configured. Email will not be sent.');
        return;
      }
      
      await this.transporter.sendMail({
        from: `"EduChat" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      // In production, we might want to throw or handle this specifically.
      // For now, just logging is safer so it doesn't crash the request if SMTP is badly configured.
      throw new Error('Could not send email');
    }
  }

  async sendOtpEmail(to: string, otp: string, type: 'email_verify' | 'password_reset'): Promise<void> {
    const subject = type === 'email_verify' ? 'Verify your EduChat account' : 'Reset your EduChat password';
    const purpose = type === 'email_verify' ? 'verify your email address' : 'reset your password';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #065F46; margin-top: 0;">EduChat</h2>
        <p>Hello,</p>
        <p>Please use the following OTP to ${purpose}. This code is valid for 10 minutes.</p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a; margin: 24px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }
}
