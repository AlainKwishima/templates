import { env } from "@/config/env.js";
import { emailService } from "@/shared/email/email.service.js";
import { logger } from "@/shared/logger/logger.js";

async function main() {
  const recipient = env.BREVO_TEST_RECIPIENT;

  if (!recipient) {
    throw new Error("BREVO_TEST_RECIPIENT is required to run the Brevo email test script");
  }

  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is required to run the Brevo email test script");
  }

  logger.info({ recipient }, "Sending Brevo integration test email");

  const result = await emailService.sendTestEmail(recipient);

  logger.info(
    {
      status: result.status,
      provider: result.provider,
      messageId: result.messageId,
      to: result.to,
      attempts: result.attempts,
    },
    "Brevo integration test completed",
  );

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  logger.error({ err: error }, "Brevo integration test failed");
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
