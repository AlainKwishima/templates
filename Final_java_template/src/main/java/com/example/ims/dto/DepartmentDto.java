package com.example.ims.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record DepartmentDto(
        Long id,
        @NotBlank(message = "Department name is required")
        String name,
        String description,
        LocalDateTime createdAt
) {}
