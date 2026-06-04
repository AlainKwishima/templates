package com.example.ims.dto;

import java.util.Map;

public record DashboardSummaryDto(
        long totalUsers,
        long totalResources,
        long totalTransactions,
        Map<String, Long> transactionsByStatus
) {}
