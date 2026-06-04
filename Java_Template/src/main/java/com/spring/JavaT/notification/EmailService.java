package com.spring.JavaT.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * High-level email API — verification, password reset, notifications.
 *
 * <p>All outbound mail is sent asynchronously via {@code emailTaskExecutor} and delivered
 * through the Brevo transactional email API ({@link com.spring.JavaT.notification.brevo.BrevoEmailDeliveryService}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final ObjectProvider<EmailDeliveryService> deliveryServiceProvider;
    private final EmailTemplateRenderer templateRenderer;
    private final MailProperties mailProperties;

    @Async("emailTaskExecutor")
    public void sendAsync(EmailRequest request) {
        deliverSafely(request);
    }

    public EmailDeliveryResult sendSync(EmailRequest request) {
        return requireDelivery().deliver(request);
    }

    @Async("emailTaskExecutor")
    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String confirmUrl = buildFrontendUrl("/verify-email?token=" + token);

        String body = templateRenderer.render("verification.html", Map.of(
                "appName", mailProperties.getFromName(),
                "firstName", firstName,
                "confirmUrl", confirmUrl
        ));

        deliverSafely(EmailRequest.builder()
                .to(toEmail)
                .toName(firstName)
                .subject("Verify your " + mailProperties.getFromName() + " account")
                .body(body)
                .html(true)
                .build());
    }

    @Async("emailTaskExecutor")
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
        String resetUrl = buildFrontendUrl("/reset-password?token=" + token);

        String body = templateRenderer.render("password-reset.html", Map.of(
                "appName", mailProperties.getFromName(),
                "firstName", firstName,
                "resetUrl", resetUrl
        ));

        deliverSafely(EmailRequest.builder()
                .to(toEmail)
                .toName(firstName)
                .subject("Reset your " + mailProperties.getFromName() + " password")
                .body(body)
                .html(true)
                .build());
    }

    @Async("emailTaskExecutor")
    public void sendNotification(String toEmail, String toName, String subject, String body, boolean html) {
        deliverSafely(EmailRequest.builder()
                .to(toEmail)
                .toName(toName)
                .subject(subject)
                .body(body)
                .html(html)
                .build());
    }

    public EmailDeliveryResult sendTestEmail(String toEmail) {
        String body = templateRenderer.render("test.html", Map.of(
                "appName", mailProperties.getFromName(),
                "timestamp", Instant.now().toString(),
                "frontendUrl", mailProperties.getFrontendBaseUrl(),
                "apiUrl", mailProperties.getApiBaseUrl()
        ));

        return requireDelivery().deliver(EmailRequest.builder()
                .to(toEmail)
                .subject(mailProperties.getTestSubject())
                .body(body)
                .html(true)
                .build());
    }

    private void deliverSafely(EmailRequest request) {
        if (!mailProperties.isEnabled()) {
            log.warn("Email skipped (app.mail.enabled=false) — to=[{}]", request.getTo());
            return;
        }

        EmailDeliveryService delivery = deliveryServiceProvider.getIfAvailable();
        if (delivery == null) {
            log.error("Email delivery service unavailable — cannot send to [{}]", request.getTo());
            return;
        }

        try {
            EmailDeliveryResult result = delivery.deliver(request);
            log.debug("Email queued via {} — messageId=[{}]", result.provider(), result.messageId());
        } catch (EmailDeliveryException e) {
            log.error("Email delivery failed — to=[{}] subject=[{}]: {}",
                    request.getTo(), request.getSubject(), e.getMessage(), e);
        }
    }

    private EmailDeliveryService requireDelivery() {
        EmailDeliveryService delivery = deliveryServiceProvider.getIfAvailable();
        if (delivery == null) {
            throw new IllegalStateException("Email delivery is not configured (app.mail.enabled=false?)");
        }
        return delivery;
    }

    private String buildFrontendUrl(String pathAndQuery) {
        String base = mailProperties.getFrontendBaseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (!pathAndQuery.startsWith("/")) {
            pathAndQuery = "/" + pathAndQuery;
        }
        return base + pathAndQuery;
    }
}
