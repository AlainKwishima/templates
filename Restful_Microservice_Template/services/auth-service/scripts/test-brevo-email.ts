import { initPassword } from "@restful/shared";
import { env } from "../src/config/env.js";
import { emailService } from "../src/shared/email/email.service.js";
import { brevoClient } from "../src/shared/email/brevo.client.js";

initPassword({
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
});

const recipient = env.BREVO_TEST_RECIPIENT ?? "test-recipient@example.com";

async function main() {
  console.log("Email configuration:");
  console.log("  EMAIL_ENABLED:", env.EMAIL_ENABLED);
  console.log("  BREVO_API_KEY:", env.BREVO_API_KEY ? "(set)" : "(empty)");
  console.log("  BREVO_SENDER_EMAIL:", env.BREVO_SENDER_EMAIL);
  console.log("  Recipient:", recipient);

  const configured = env.EMAIL_ENABLED && brevoClient.isConfigured();
  if (!configured) {
    console.log("\nLive Brevo delivery is OFF — expecting preview-only results.\n");
  }

  const verification = await emailService.sendVerificationEmail(recipient, "test-verification-token", "Test");
  console.log("Verification email:", verification);

  const reset = await emailService.sendPasswordResetEmail(recipient, "test-reset-token", "Test");
  console.log("Password reset email:", reset);

  if (configured && verification.status !== "sent") {
    throw new Error("Expected Brevo to send verification email");
  }

  if (!configured && verification.status !== "preview") {
    throw new Error("Expected preview mode when Brevo is not configured");
  }

  console.log("\nEmail test completed successfully.");
}

main().catch((error) => {
  console.error("\nEmail test failed:", error);
  process.exit(1);
});
