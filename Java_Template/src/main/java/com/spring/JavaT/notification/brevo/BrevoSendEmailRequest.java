package com.spring.JavaT.notification.brevo;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Request body for {@code POST /v3/smtp/email}.
 *
 * @see <a href="https://developers.brevo.com/reference/sendtransacemail">Brevo API</a>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BrevoSendEmailRequest(
        Sender sender,
        List<Recipient> to,
        String subject,
        String htmlContent,
        String textContent
) {
    public record Sender(String name, String email) {}

    public record Recipient(String email, String name) {}
}
