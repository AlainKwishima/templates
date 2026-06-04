package com.example.ims.dto;

import com.example.ims.entity.TransactionStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        @NotNull(message = "User ID is required")
        Long userId,
        String userName,
        @NotNull(message = "Resource ID is required")
        Long resourceId,
        String resourceName,
        LocalDateTime transactionDate,
        LocalDateTime returnDate,
        TransactionStatus status,
        LocalDateTime createdAt
) {}
