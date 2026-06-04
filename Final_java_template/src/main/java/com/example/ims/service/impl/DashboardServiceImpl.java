package com.example.ims.service.impl;

import com.example.ims.dto.DashboardSummaryDto;
import com.example.ims.entity.TransactionStatus;
import com.example.ims.repository.ResourceRepository;
import com.example.ims.repository.TransactionRepository;
import com.example.ims.repository.UserRepository;
import com.example.ims.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public DashboardSummaryDto getSummary() {
        long totalUsers = userRepository.count();
        long totalResources = resourceRepository.count();
        long totalTransactions = transactionRepository.count();

        Map<String, Long> statusCounts = new HashMap<>();
        for (TransactionStatus status : TransactionStatus.values()) {
            statusCounts.put(status.name(), (long) transactionRepository.findByStatus(status).size());
        }

        return new DashboardSummaryDto(totalUsers, totalResources, totalTransactions, statusCounts);
    }
}
