package com.example.ims.dto;

public record AuthResponse(
        String token,
        UserDto user
) {}
