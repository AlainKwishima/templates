package com.spring.JavaT.notification;

import java.time.Instant;

/**
 * Outcome of a successful email send, including provider tracking id.
 */
public record EmailDeliveryResult(
        String messageId,
        String provider,
        String recipient,
        String subject,
        Instant sentAt
) {}
