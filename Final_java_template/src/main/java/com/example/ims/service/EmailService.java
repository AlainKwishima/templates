package com.example.ims.service;

public interface EmailService {
    void sendWelcomeEmail(String toEmail, String firstName);
    void sendTransactionConfirmationEmail(String toEmail, String firstName, String resourceName, String status);
}
