import { env } from "@/config/env.js";
import { EmailDeliveryError } from "@restful/shared";
import type { EmailDeliveryResult, EmailMessage } from "@/shared/email/email.types.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BrevoClient {
  isConfigured() {
    return Boolean(env.BREVO_API_KEY?.trim());
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= env.EMAIL_RETRY_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.sendOnce(message);
      } catch (error) {
        lastError = error;
        if (attempt >= env.EMAIL_RETRY_MAX_ATTEMPTS) {
          break;
        }
        await sleep(env.EMAIL_RETRY_BASE_DELAY_MS * attempt);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new EmailDeliveryError("Brevo API request failed after retries", { lastError });
  }

  private async sendOnce(message: EmailMessage): Promise<EmailDeliveryResult> {
    const response = await fetch(`${env.BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => undefined);
      throw new EmailDeliveryError("Brevo API request failed", { status: response.status, details });
    }

    const payload = (await response.json().catch(() => ({}))) as { messageId?: string };
    return {
      status: "sent",
      provider: "brevo",
      to: message.to,
      subject: message.subject,
      templateType: message.templateType,
      messageId: payload.messageId,
    };
  }
}

export const brevoClient = new BrevoClient();
