package com.example.ims.service.impl;

import com.example.ims.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void sendWelcomeEmail(String toEmail, String firstName) {
        String subject = "Welcome to IMS!";
        String htmlContent = "<h1>Welcome, " + firstName + "!</h1><p>Thank you for joining our Institution Management System.</p>";
        sendEmail(toEmail, firstName, subject, htmlContent);
    }

    @Override
    public void sendTransactionConfirmationEmail(String toEmail, String firstName, String resourceName, String status) {
        String subject = "Transaction Update: " + resourceName;
        String htmlContent = "<h1>Hello, " + firstName + "</h1><p>The status of your transaction for <strong>" + resourceName + "</strong> is now: <strong>" + status + "</strong>.</p>";
        sendEmail(toEmail, firstName, subject, htmlContent);
    }

    private void sendEmail(String toEmail, String toName, String subject, String htmlContent) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, String> sender = new HashMap<>();
            sender.put("name", senderName);
            sender.put("email", senderEmail);
            requestBody.put("sender", sender);

            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            to.put("name", toName);
            requestBody.put("to", List.of(to));

            requestBody.put("subject", subject);
            requestBody.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Log instead of failing if API key is not set
            if ("YOUR_BREVO_API_KEY_HERE".equals(apiKey)) {
                log.info("Mock Email Send to {}: Subject: {}", toEmail, subject);
                return;
            }

            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to: {}", toEmail);
            } else {
                log.error("Failed to send email. Status code: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error occurred while sending email to {}: {}", toEmail, e.getMessage());
        }
    }
}
