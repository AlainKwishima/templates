package com.spring.JavaT.notification;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application-level email settings ({@code app.mail.*}).
 *
 * <p>Transport is handled by Brevo ({@code app.brevo.*}). This class holds sender identity,
 * URL bases for links, retry policy, and test hooks.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    /**
     * Master switch — when {@code false}, outbound email is skipped (useful in local/CI).
     */
    private boolean enabled = true;

    /**
     * Verified sender email in your Brevo account ({@code BREVO_SENDER_EMAIL}).
     */
    private String from;

    /** Display name shown alongside the From address. */
    private String fromName = "JavaT";

    /**
     * Backend API base URL (no trailing slash).
     */
    private String apiBaseUrl = "http://localhost:8080";

    /**
     * SPA base URL (no trailing slash). Used for user-facing links in emails.
     */
    private String frontendBaseUrl = "http://localhost:5173";

    /** Validate Brevo API connectivity on application startup. */
    private boolean validateOnStartup = true;

    /**
     * When {@code true}, validation or test-email failures abort application startup.
     */
    private boolean failFastOnStartupError = true;

    /** Maximum send attempts (including the first try). */
    private int retryMaxAttempts = 3;

    /** Delay in milliseconds between retry attempts. */
    private long retryDelayMs = 2_000;

    /**
     * When set, sends one test email on startup (smoke testing).
     * Set via {@code MAIL_TEST_RECIPIENT}.
     */
    private String testRecipient;

    /** Subject line for the startup test email. */
    private String testSubject = "JavaT — Brevo delivery test";

    public String resolveFromAddress() {
        if (from == null || from.isBlank()) {
            throw new IllegalStateException(
                    "app.mail.from (BREVO_SENDER_EMAIL) must be set to a verified Brevo sender address");
        }
        return from.trim();
    }
}
