package com.spring.JavaT.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Loads HTML templates from {@code classpath:templates/email/} and substitutes
 * {@code {{placeholder}}} values.
 */
@Slf4j
@Component
public class EmailTemplateRenderer {

    private static final String TEMPLATE_DIR = "templates/email/";

    public String render(String templateName, Map<String, String> variables) {
        try {
            ClassPathResource resource = new ClassPathResource(TEMPLATE_DIR + templateName);
            String content = resource.getContentAsString(StandardCharsets.UTF_8);

            for (Map.Entry<String, String> entry : variables.entrySet()) {
                String value = entry.getValue() != null ? entry.getValue() : "";
                content = content.replace("{{" + entry.getKey() + "}}", value);
            }

            return content;

        } catch (IOException e) {
            log.error("Failed to load email template [{}]: {}", templateName, e.getMessage());
            throw new IllegalStateException("Email template not found: " + templateName, e);
        }
    }
}
