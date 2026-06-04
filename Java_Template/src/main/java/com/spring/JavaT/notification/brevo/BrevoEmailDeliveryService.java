package com.spring.JavaT.notification.brevo;

import com.spring.JavaT.notification.BrevoProperties;
import com.spring.JavaT.notification.EmailDeliveryException;
import com.spring.JavaT.notification.EmailDeliveryResult;
import com.spring.JavaT.notification.EmailDeliveryService;
import com.spring.JavaT.notification.EmailRequest;
import com.spring.JavaT.notification.MailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

/**
 * Sends transactional email via the Brevo REST API ({@code POST /v3/smtp/email}).
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true", matchIfMissing = true)
public class BrevoEmailDeliveryService implements EmailDeliveryService {

    private static final String PROVIDER = "brevo";

    private final RestClient brevoClient;
    private final BrevoProperties brevoProperties;
    private final MailProperties mailProperties;

    public BrevoEmailDeliveryService(
            RestClient brevoRestClient,
            BrevoProperties brevoProperties,
            MailProperties mailProperties) {
        this.brevoClient = brevoRestClient;
        this.brevoProperties = brevoProperties;
        this.mailProperties = mailProperties;
    }

    @Override
    public EmailDeliveryResult deliver(EmailRequest request) {
        if (!mailProperties.isEnabled()) {
            log.warn("Email delivery skipped (app.mail.enabled=false) — to=[{}]", request.getTo());
            return new EmailDeliveryResult(null, PROVIDER, request.getTo(), request.getSubject(), Instant.now());
        }

        ensureApiKeyConfigured();

        int maxAttempts = Math.max(1, mailProperties.getRetryMaxAttempts());
        long delayMs = Math.max(0, mailProperties.getRetryDelayMs());

        Exception lastFailure = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                EmailDeliveryResult result = sendOnce(request);
                log.info(
                        "Brevo email delivered — messageId=[{}] to=[{}] subject=[{}] attempt={}/{}",
                        result.messageId(),
                        request.getTo(),
                        request.getSubject(),
                        attempt,
                        maxAttempts
                );
                return result;
            } catch (Exception e) {
                lastFailure = e;
                log.warn(
                        "Brevo send failed — to=[{}] attempt={}/{} error={}",
                        request.getTo(),
                        attempt,
                        maxAttempts,
                        e.getMessage()
                );

                if (attempt < maxAttempts && delayMs > 0 && isRetryable(e)) {
                    sleep(delayMs * attempt);
                } else if (!isRetryable(e)) {
                    break;
                }
            }
        }

        throw new EmailDeliveryException(
                "Failed to deliver email to [%s] via Brevo after %d attempt(s)".formatted(
                        request.getTo(), maxAttempts),
                lastFailure
        );
    }

    @Override
    public void validateConnection() {
        if (!mailProperties.isEnabled()) {
            log.info("Brevo validation skipped — mail is disabled");
            return;
        }

        ensureApiKeyConfigured();

        try {
            BrevoAccountResponse account = brevoClient.get()
                    .uri("/v3/account")
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new BrevoApiException(res.getStatusCode().value(), readBody(res));
                    })
                    .body(BrevoAccountResponse.class);

            log.info(
                    "Brevo API connection validated — accountEmail={}, plan={}",
                    account != null ? account.email() : "unknown",
                    account != null ? account.planType() : "unknown"
            );
        } catch (BrevoApiException e) {
            throw new EmailDeliveryException(formatBrevoError("Brevo API validation failed", e), e);
        }
    }

    private EmailDeliveryResult sendOnce(EmailRequest request) {
        String fromEmail = mailProperties.resolveFromAddress();

        BrevoSendEmailRequest payload = new BrevoSendEmailRequest(
                new BrevoSendEmailRequest.Sender(mailProperties.getFromName(), fromEmail),
                List.of(new BrevoSendEmailRequest.Recipient(
                        request.getTo(),
                        request.getToName() != null && !request.getToName().isBlank()
                                ? request.getToName()
                                : null
                )),
                request.getSubject(),
                request.isHtml() ? request.getBody() : null,
                request.isHtml() ? null : request.getBody()
        );

        BrevoSendEmailResponse response = brevoClient.post()
                .uri("/v3/smtp/email")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new BrevoApiException(res.getStatusCode().value(), readBody(res));
                })
                .body(BrevoSendEmailResponse.class);

        String messageId = response != null ? response.messageId() : null;

        return new EmailDeliveryResult(
                messageId,
                PROVIDER,
                request.getTo(),
                request.getSubject(),
                Instant.now()
        );
    }

    private void ensureApiKeyConfigured() {
        if (brevoProperties.getApiKey() == null || brevoProperties.getApiKey().isBlank()) {
            throw new EmailDeliveryException(
                    "Brevo API key is not configured. Set the BREVO_API_KEY environment variable.",
                    null
            );
        }
    }

    private boolean isRetryable(Exception e) {
        if (e instanceof BrevoApiException brevo) {
            int code = brevo.getStatusCode();
            return code == 429 || code >= 500;
        }
        return true;
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new EmailDeliveryException("Email send interrupted", ie);
        }
    }

    private static String readBody(org.springframework.http.client.ClientHttpResponse response) {
        try {
            return new String(response.getBody().readAllBytes());
        } catch (Exception e) {
            return "(unable to read body)";
        }
    }

    private static String formatBrevoError(String prefix, BrevoApiException e) {
        String body = e.getResponseBody();
        if (body != null && body.contains("unrecognised IP")) {
            return prefix + ": Brevo rejected the request because this server's IP is not on your "
                    + "authorised IP list. Open https://app.brevo.com/security/authorised_ips and add "
                    + "your deployment IP, or disable IP restriction for development.";
        }
        return prefix + ": " + e.getMessage();
    }
}
