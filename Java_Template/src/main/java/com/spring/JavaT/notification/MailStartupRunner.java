package com.spring.JavaT.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Validates Brevo on startup and optionally sends a one-shot test email.
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true", matchIfMissing = true)
public class MailStartupRunner implements ApplicationRunner {

    private final EmailDeliveryService deliveryService;
    private final EmailService emailService;
    private final MailProperties mailProperties;

    @Override
    public void run(ApplicationArguments args) {
        if (mailProperties.isValidateOnStartup()) {
            try {
                deliveryService.validateConnection();
            } catch (EmailDeliveryException e) {
                log.error("Brevo startup validation failed: {}", e.getMessage());
                if (mailProperties.isFailFastOnStartupError()) {
                    throw e;
                }
            }
        }

        String testRecipient = mailProperties.getTestRecipient();
        if (StringUtils.hasText(testRecipient)) {
            try {
                log.info("Sending Brevo test email to [{}]", testRecipient.trim());
                EmailDeliveryResult result = emailService.sendTestEmail(testRecipient.trim());
                log.info(
                        "Brevo test email delivered — recipient=[{}] messageId=[{}] provider=[{}]",
                        testRecipient.trim(),
                        result.messageId(),
                        result.provider()
                );
            } catch (Exception e) {
                log.error("Brevo test email failed for [{}]: {}", testRecipient, e.getMessage());
                if (mailProperties.isFailFastOnStartupError()) {
                    throw e;
                }
            }
        }
    }
}
