import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { brevoClient } from "@/shared/email/brevo.client.js";
import type { EmailDeliveryResult, EmailMessage } from "@/shared/email/email.types.js";
import { passwordResetTemplate, verificationTemplate } from "@/shared/email/templates.js";

class EmailService {
  private isEnabled() {
    return env.EMAIL_ENABLED && brevoClient.isConfigured();
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    if (!this.isEnabled()) {
      logger.info(
        { provider: "preview", to: message.to, subject: message.subject, templateType: message.templateType },
        "Email delivery skipped (preview only)",
      );
      return {
        status: "preview",
        provider: "preview",
        to: message.to,
        subject: message.subject,
        templateType: message.templateType,
      };
    }
    return brevoClient.send(message);
  }

  async sendVerificationEmail(to: string, token: string, firstName?: string) {
    const template = verificationTemplate(token, firstName);
    return this.send({ to, ...template, templateType: "verification" });
  }

  async sendPasswordResetEmail(to: string, token: string, firstName?: string) {
    const template = passwordResetTemplate(token, firstName);
    return this.send({ to, ...template, templateType: "password-reset" });
  }
}

export const emailService = new EmailService();
