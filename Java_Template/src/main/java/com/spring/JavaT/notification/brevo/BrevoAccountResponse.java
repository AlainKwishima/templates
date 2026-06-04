package com.spring.JavaT.notification.brevo;

/**
 * Subset of {@code GET /v3/account} used for startup validation.
 */
public record BrevoAccountResponse(
        String email,
        String companyName,
        String planType
) {}
