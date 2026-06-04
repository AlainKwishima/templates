import { BrevoClient } from '@getbrevo/brevo';
import prisma from '../../../config/database';
import { env } from '../../../config/env';
import { UserPublic } from '../../../utils/userMapper';
import {
  passwordResetTemplate,
  renderTemplate,
  transactionCreatedTemplate,
  transactionStatusUpdateTemplate,
  verificationSuccessTemplate,
  welcomeEmailTemplate,
} from '../templates/emailTemplates';

type TransactionInfo = {
  id: string;
  status: string;
  resource: { name: string };
};

class NotificationService {
  private client: BrevoClient | null = null;

  private getClient(): BrevoClient {
    if (!this.client) {
      this.client = new BrevoClient({ apiKey: env.BREVO_API_KEY });
    }
    return this.client;
  }

  private async sendEmail(
    userId: string,
    type: string,
    toEmail: string,
    toName: string,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    let sentAt: Date | null = null;

    try {
      await this.getClient().transactionalEmails.sendTransacEmail({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent: htmlBody,
      });
      sentAt = new Date();
    } catch (error) {
      console.error('[NotificationError]', {
        recipient: toEmail,
        type,
        error,
      });
    }

    await prisma.notification.create({
      data: {
        userId,
        type,
        subject,
        body: htmlBody,
        sentAt,
      },
    });
  }

  async sendWelcomeEmail(user: UserPublic, verificationToken: string): Promise<void> {
    const verificationLink = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const html = renderTemplate(welcomeEmailTemplate, {
      firstName: user.firstName,
      verificationLink,
    });

    await this.sendEmail(
      user.id,
      'WELCOME',
      user.email,
      `${user.firstName} ${user.lastName}`,
      'Welcome — verify your email',
      html,
    );
  }

  async sendVerificationSuccessEmail(user: UserPublic): Promise<void> {
    const html = renderTemplate(verificationSuccessTemplate, {
      firstName: user.firstName,
    });

    await this.sendEmail(
      user.id,
      'EMAIL_VERIFIED',
      user.email,
      `${user.firstName} ${user.lastName}`,
      'Your account has been verified',
      html,
    );
  }

  async sendPasswordResetEmail(user: UserPublic, resetToken: string): Promise<void> {
    const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = renderTemplate(passwordResetTemplate, {
      firstName: user.firstName,
      resetLink,
    });

    await this.sendEmail(
      user.id,
      'PASSWORD_RESET',
      user.email,
      `${user.firstName} ${user.lastName}`,
      'Password reset request',
      html,
    );
  }

  async sendTransactionCreatedEmail(
    user: UserPublic,
    transaction: TransactionInfo,
  ): Promise<void> {
    const html = renderTemplate(transactionCreatedTemplate, {
      firstName: user.firstName,
      transactionId: transaction.id,
      resourceName: transaction.resource.name,
      status: transaction.status,
    });

    await this.sendEmail(
      user.id,
      'TRANSACTION_CREATED',
      user.email,
      `${user.firstName} ${user.lastName}`,
      'New transaction created',
      html,
    );
  }

  async sendTransactionStatusUpdateEmail(
    user: UserPublic,
    transaction: TransactionInfo,
  ): Promise<void> {
    const html = renderTemplate(transactionStatusUpdateTemplate, {
      firstName: user.firstName,
      transactionId: transaction.id,
      resourceName: transaction.resource.name,
      status: transaction.status,
    });

    await this.sendEmail(
      user.id,
      'TRANSACTION_STATUS_UPDATE',
      user.email,
      `${user.firstName} ${user.lastName}`,
      'Transaction status updated',
      html,
    );
  }
}

export const notificationService = new NotificationService();
