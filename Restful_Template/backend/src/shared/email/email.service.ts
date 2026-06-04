import { env } from "@/config/env.js";
import { brevoClient } from "@/shared/email/brevo.client.js";
import type { EmailDeliveryResult, EmailMessage } from "@/shared/email/email.types.js";
import { passwordResetTemplate, verificationTemplate } from "@/shared/email/templates.js";
import { EmailDeliveryError } from "@/shared/errors/app-error.js";
import { logger } from "@/shared/logger/logger.js";

class EmailService {
  private isEnabled() {
    return env.EMAIL_ENABLED && brevoClient.isConfigured();
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    if (!this.isEnabled()) {
      logger.info(
        {
          provider: "preview",
          to: message.to,
          subject: message.subject,
          templateType: message.templateType,
        },
        "Email delivery skipped (Brevo disabled); preview only",
      );

      return {
        status: "preview",
        provider: "preview",
        to: message.to,
        subject: message.subject,
        templateType: message.templateType,
        attempts: 0,
      };
    }

    let attempts = 0;

    try {
      const response = await brevoClient.sendTransactionalEmail({
        sender: {
          name: env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        ...(message.text ? { textContent: message.text } : {}),
        tags: message.templateType ? [message.templateType, env.APP_NAME] : [env.APP_NAME],
      });

      attempts = response.attempts;

      const result: EmailDeliveryResult = {
        status: "sent",
        provider: "brevo",
        messageId: response.messageId,
        to: message.to,
        subject: message.subject,
        templateType: message.templateType,
        attempts,
      };

      logger.info(
        {
          provider: result.provider,
          messageId: result.messageId,
          to: result.to,
          subject: result.subject,
          templateType: result.templateType,
          attempts: result.attempts,
        },
        "Email queued for delivery via Brevo",
      );

      return result;
    } catch (error) {
      logger.error(
        {
          provider: "brevo",
          to: message.to,
          subject: message.subject,
          templateType: message.templateType,
          attempts,
          err: error,
        },
        "Email delivery failed",
      );

      throw new EmailDeliveryError(
        "Unable to send email at this time. Please try again later.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async sendVerificationEmail(to: string, token: string, name?: string) {
    const template = verificationTemplate(token, name);
    return this.send({ to, ...template, templateType: "verification" });
  }

  async sendPasswordResetEmail(to: string, token: string, name?: string) {
    const template = passwordResetTemplate(token, name);
    return this.send({ to, ...template, templateType: "password_reset" });
  }

  async sendTestEmail(to: string) {
    return this.send({
      to,
      subject: `${env.APP_NAME} — Brevo integration test`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Brevo integration test</h2>
          <p>This message confirms that ${env.APP_NAME} can send email through Brevo.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Brevo integration test for ${env.APP_NAME} at ${new Date().toISOString()}`,
      templateType: "test",
    });
  }
}

export const emailService = new EmailService();
