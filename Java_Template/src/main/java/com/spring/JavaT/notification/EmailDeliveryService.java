package com.spring.JavaT.notification;

/**
 * Abstraction for outbound email transport (Brevo API, etc.).
 */
public interface EmailDeliveryService {

    /**
     * Sends an email with configurable retries.
     *
     * @return delivery metadata including the provider message id
     * @throws EmailDeliveryException if all attempts fail
     */
    EmailDeliveryResult deliver(EmailRequest request);

    /**
     * Verifies provider connectivity and credentials.
     */
    void validateConnection();
}
