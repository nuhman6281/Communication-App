import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter(): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn(
        'SMTP credentials not configured. Email sending will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    this.logger.log(`Email transporter initialized: ${smtpHost}:${smtpPort}`);
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    try {
      const from =
        options.from ||
        this.configService.get<string>('SMTP_FROM', 'noreply@chatapp.com');

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error.message);
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5174',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ChatApp! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up! Please verify your email address to get started.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ChatApp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to ChatApp!

      Hi ${name},

      Thank you for signing up! Please verify your email address by clicking the link below:

      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't create an account, please ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5174',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔐</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ChatApp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request

      Hi ${name},

      We received a request to reset your password. Click the link below to create a new password:

      ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email and your password will remain unchanged.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset your password',
      html,
      text,
    });
  }

  /**
   * Send welcome email (after successful verification)
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5174',
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 15px 0; padding-left: 25px; }
            .feature::before { content: '✓'; color: #667eea; font-weight: bold; margin-left: -25px; margin-right: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ChatApp! 🚀</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Your email has been verified successfully! You're all set to start using ChatApp.</p>
              <h3>What you can do:</h3>
              <div class="feature">Send messages to friends and groups</div>
              <div class="feature">Make video and voice calls</div>
              <div class="feature">Share photos, videos, and files</div>
              <div class="feature">Create and join channels</div>
              <div class="feature">Post stories and status updates</div>
              <div class="feature">Use AI-powered features</div>
              <p style="text-align: center;">
                <a href="${frontendUrl}" class="button">Get Started</a>
              </p>
              <p>Need help? Check out our <a href="${frontendUrl}/help">Help Center</a> or contact support.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ChatApp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to ChatApp!

      Hi ${name},

      Your email has been verified successfully! You're all set to start using ChatApp.

      What you can do:
      - Send messages to friends and groups
      - Make video and voice calls
      - Share photos, videos, and files
      - Create and join channels
      - Post stories and status updates
      - Use AI-powered features

      Get started: ${frontendUrl}

      Need help? Visit ${frontendUrl}/help
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to ChatApp!',
      html,
      text,
    });
  }

  /**
   * Send notification email for new message
   */
  async sendNewMessageNotification(
    email: string,
    userName: string,
    senderName: string,
    messagePreview: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5174',
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .message { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>💬 New Message</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p><strong>${senderName}</strong> sent you a message:</p>
              <div class="message">
                ${messagePreview}
              </div>
              <p style="text-align: center;">
                <a href="${frontendUrl}" class="button">View Message</a>
              </p>
              <p style="font-size: 12px; color: #666;">
                To stop receiving email notifications, update your <a href="${frontendUrl}/settings">notification settings</a>.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ChatApp</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      New Message from ${senderName}

      Hi ${userName},

      ${senderName} sent you a message:

      "${messagePreview}"

      View message: ${frontendUrl}

      To stop receiving email notifications, update your notification settings at ${frontendUrl}/settings
    `;

    return this.sendEmail({
      to: email,
      subject: `New message from ${senderName}`,
      html,
      text,
    });
  }
}
