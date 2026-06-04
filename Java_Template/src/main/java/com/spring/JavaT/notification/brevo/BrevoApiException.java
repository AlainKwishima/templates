package com.spring.JavaT.notification.brevo;

import lombok.Getter;

/**
 * Brevo API returned a non-success HTTP status.
 */
@Getter
public class BrevoApiException extends RuntimeException {

    private final int statusCode;
    private final String responseBody;

    public BrevoApiException(int statusCode, String responseBody) {
        super("Brevo API error HTTP %d: %s".formatted(statusCode, truncate(responseBody)));
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    private static String truncate(String body) {
        if (body == null || body.isBlank()) {
            return "(no body)";
        }
        return body.length() > 500 ? body.substring(0, 500) + "…" : body;
    }
}
