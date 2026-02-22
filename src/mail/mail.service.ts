import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

export interface SendMailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter<SentMessageInfo>;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const useGmail = this.configService.get<string>('MAIL_USE_GMAIL') === 'true';
      
      if (useGmail) {
        const gmailUser = this.configService.get<string>('MAIL_FROM');
        const gmailPass = this.configService.get<string>('MAIL_PASSKEY');
        
        if (!gmailUser || !gmailPass) {
          throw new Error('Gmail credentials are not properly configured');
        }

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log('Gmail transporter initialized successfully');
      } else {
        const host = this.configService.get<string>('EMAIL_HOST');
        const port = Number(this.configService.get<string>('EMAIL_PORT') ?? 587);
        const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';
        const user = this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('EMAIL_PASS');

        if (!host || !user || !pass) {
          throw new Error('SMTP credentials are not properly configured');
        }

        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log('SMTP transporter initialized successfully');
      }

      // Verify connection configuration
      this.verifyConnection();
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
      throw error;
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Server is ready to take our messages');
    } catch (error) {
      this.logger.error('Error verifying email server connection', error);
      throw new Error('Failed to connect to email server. Please check your email configuration.');
    }
  }

  async sendMail(params: SendMailParams): Promise<boolean> {
    try {
      const { to, subject, html, text } = params;
      const from = this.configService.get<string>('MAIL_FROM');

      if (!this.transporter) {
        this.logger.warn('Attempting to reinitialize transporter...');
        this.initializeTransporter();
      }

      this.logger.log(`Sending email to: ${Array.isArray(to) ? to.join(', ') : to}`);
      this.logger.debug(`Email subject: ${subject}`);
      
      const info = await this.transporter.sendMail({
        from: `"Notevia" <${from}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback to HTML without tags
        html,
      });

      this.logger.log(`Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}, message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email', error);
      
      // Log detailed error information
      if (error.response) {
        this.logger.error(`SMTP Error: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`SMTP Error Code: ${error.responseCode}`);
      }
      
      // Log the error stack for debugging
      if (error instanceof Error) {
        this.logger.error(`Error stack: ${error.stack}`);
      }
      
      // Attempt to reinitialize transporter on certain errors
      if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        this.logger.warn('Authentication error, attempting to reinitialize transporter...');
        this.initializeTransporter();
      }
      
      return false;
    }
  }
}

export default MailService;
