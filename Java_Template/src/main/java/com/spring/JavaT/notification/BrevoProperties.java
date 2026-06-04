package com.spring.JavaT.notification;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Brevo (Sendinblue) API configuration ({@code app.brevo.*}).
 *
 * <p>Set {@code BREVO_API_KEY} in the environment — never commit API keys to source control.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.brevo")
public class BrevoProperties {

    /** Brevo REST API base URL (no trailing slash). */
    private String apiUrl = "https://api.brevo.com";

    /**
     * Transactional API key (starts with {@code xkeysib-}).
     * Bind from {@code BREVO_API_KEY}.
     */
    private String apiKey = "";

    /** HTTP connect/read timeout in milliseconds. */
    private int timeoutMs = 15_000;
}
