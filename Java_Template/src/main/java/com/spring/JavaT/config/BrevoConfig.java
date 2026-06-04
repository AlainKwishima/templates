package com.spring.JavaT.config;

import com.spring.JavaT.notification.BrevoProperties;
import com.spring.JavaT.notification.MailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestClient;

/**
 * Brevo transactional email API client configuration.
 */
@Slf4j
@Configuration
@EnableRetry
@EnableConfigurationProperties({BrevoProperties.class, MailProperties.class})
public class BrevoConfig {

    @Bean
    @ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true", matchIfMissing = true)
    public RestClient brevoRestClient(BrevoProperties brevoProperties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(brevoProperties.getTimeoutMs());
        factory.setReadTimeout(brevoProperties.getTimeoutMs());

        RestClient client = RestClient.builder()
                .baseUrl(brevoProperties.getApiUrl())
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("api-key", brevoProperties.getApiKey())
                .build();

        log.info("Brevo RestClient configured — apiUrl={}", brevoProperties.getApiUrl());
        return client;
    }
}
