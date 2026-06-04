package com.example.ims.dto;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String roleName,
        LocalDateTime createdAt
) {}
