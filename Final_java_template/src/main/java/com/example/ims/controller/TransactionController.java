package com.example.ims.controller;

import com.example.ims.dto.TransactionDto;
import com.example.ims.entity.TransactionStatus;
import com.example.ims.service.TransactionService;
import com.example.ims.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionDto>> createTransaction(@Valid @RequestBody TransactionDto request) {
        return ResponseEntity.ok(ApiResponse.success("Transaction created successfully", transactionService.createTransaction(request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TransactionDto>> updateStatus(
            @PathVariable Long id, 
            @RequestParam TransactionStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Transaction status updated", transactionService.updateTransactionStatus(id, status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> getTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Transaction fetched successfully", transactionService.getTransactionById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionDto>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.success("Transactions fetched successfully", transactionService.getAllTransactions()));
    }
}
