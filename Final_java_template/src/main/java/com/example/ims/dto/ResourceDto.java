package com.example.ims.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record ResourceDto(
        Long id,
        @NotBlank(message = "Resource name is required")
        String name,
        @NotBlank(message = "Resource code is required")
        String code,
        String description,
        @NotBlank(message = "Status is required")
        String status,
        @NotNull(message = "Department ID is required")
        Long departmentId,
        String departmentName,
        LocalDateTime createdAt
) {}
