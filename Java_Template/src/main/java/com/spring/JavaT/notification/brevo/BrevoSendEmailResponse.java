package com.spring.JavaT.notification.brevo;

/**
 * Response body for {@code POST /v3/smtp/email} (201 Created).
 */
public record BrevoSendEmailResponse(String messageId) {}
