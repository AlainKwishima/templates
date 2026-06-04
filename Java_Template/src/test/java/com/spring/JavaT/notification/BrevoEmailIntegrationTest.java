package com.spring.JavaT.notification;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Sends a real email via Brevo when credentials are configured.
 *
 * <pre>
 * BREVO_API_KEY=... BREVO_SENDER_EMAIL=verified@sender.com \
 *   mvn test -Dtest=BrevoEmailIntegrationTest -Dmail.it.recipient=you@example.com
 * </pre>
 */
@SpringBootTest
@TestPropertySource(properties = {
        "app.mail.validate-on-startup=false",
        "app.mail.test-recipient="
})
class BrevoEmailIntegrationTest {

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailDeliveryService deliveryService;

    @Value("${mail.it.recipient:}")
    private String recipient;

    @Value("${app.brevo.api-key:}")
    private String apiKey;

    @Value("${app.mail.from:}")
    private String senderEmail;

    @Test
    void sendsTestEmailViaBrevo() {
        Assumptions.assumeTrue(recipient != null && !recipient.isBlank(),
                "Set -Dmail.it.recipient=email@example.com");
        Assumptions.assumeTrue(apiKey != null && !apiKey.isBlank(), "Set BREVO_API_KEY");
        Assumptions.assumeTrue(senderEmail != null && !senderEmail.isBlank(), "Set BREVO_SENDER_EMAIL");

        deliveryService.validateConnection();
        EmailDeliveryResult result = emailService.sendTestEmail(recipient.trim());
        Assumptions.assumeTrue(result.messageId() != null && !result.messageId().isBlank(),
                "Expected Brevo messageId in response");
    }
}
