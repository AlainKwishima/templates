import { env } from "@/config/env.js";
import { logger } from "@/shared/logger/logger.js";
import type {
  BrevoErrorResponse,
  BrevoSendEmailPayload,
  BrevoSendEmailResponse,
} from "@/shared/email/email.types.js";

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number) {
  const baseDelay = env.EMAIL_RETRY_BASE_DELAY_MS;
  const jitter = Math.floor(Math.random() * 100);
  return baseDelay * 2 ** (attempt - 1) + jitter;
}

function parseBrevoError(body: string): BrevoErrorResponse {
  try {
    return JSON.parse(body) as BrevoErrorResponse;
  } catch {
    return { message: body };
  }
}

export class BrevoClient {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = env.BREVO_API_URL.replace(/\/$/, "");
  }

  isConfigured() {
    return Boolean(env.BREVO_API_KEY);
  }

  async sendTransactionalEmail(payload: BrevoSendEmailPayload): Promise<BrevoSendEmailResponse> {
    if (!env.BREVO_API_KEY) {
      throw new Error("Brevo API key is not configured");
    }

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= env.EMAIL_RETRY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(`${this.apiUrl}/smtp/email`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": env.BREVO_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        const responseBody = await response.text();

        if (response.ok) {
          const parsed = JSON.parse(responseBody) as { messageId: string };
          logger.info(
            {
              provider: "brevo",
              messageId: parsed.messageId,
              attempt,
              to: payload.to.map((recipient) => recipient.email),
              subject: payload.subject,
            },
            "Brevo email accepted for delivery",
          );
          return {
            messageId: parsed.messageId,
            attempts: attempt,
          };
        }

        const brevoError = parseBrevoError(responseBody);
        const error = new Error(
          brevoError.message ?? `Brevo API request failed with status ${response.status}`,
        );

        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === env.EMAIL_RETRY_MAX_ATTEMPTS) {
          logger.error(
            {
              provider: "brevo",
              status: response.status,
              code: brevoError.code,
              attempt,
              to: payload.to.map((recipient) => recipient.email),
              subject: payload.subject,
            },
            "Brevo email delivery failed",
          );
          throw error;
        }

        lastError = error;
        const delayMs = getRetryDelayMs(attempt);
        logger.warn(
          {
            provider: "brevo",
            status: response.status,
            attempt,
            nextRetryInMs: delayMs,
            subject: payload.subject,
          },
          "Retrying Brevo email delivery",
        );
        await sleep(delayMs);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Brevo API request failed")) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error("Unknown Brevo client error");

        if (attempt === env.EMAIL_RETRY_MAX_ATTEMPTS) {
          logger.error(
            {
              provider: "brevo",
              attempt,
              err: lastError,
              subject: payload.subject,
            },
            "Brevo email delivery failed after retries",
          );
          throw lastError;
        }

        const delayMs = getRetryDelayMs(attempt);
        logger.warn(
          {
            provider: "brevo",
            attempt,
            nextRetryInMs: delayMs,
            err: lastError,
            subject: payload.subject,
          },
          "Retrying Brevo email delivery after network error",
        );
        await sleep(delayMs);
      }
    }

    throw lastError ?? new Error("Brevo email delivery failed");
  }
}

export const brevoClient = new BrevoClient();
