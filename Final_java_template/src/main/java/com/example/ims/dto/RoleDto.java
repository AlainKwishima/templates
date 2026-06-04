package com.example.ims.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleDto(
        Long id,
        @NotBlank(message = "Role name is required")
        String name
) {}
