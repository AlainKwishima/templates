package com.spring.JavaT.notification;

/**
 * Thrown when an email could not be delivered after all retry attempts.
 */
public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
