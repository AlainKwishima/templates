package com.example.ims.service;

import com.example.ims.dto.TransactionDto;
import com.example.ims.entity.TransactionStatus;
import java.util.List;

public interface TransactionService {
    TransactionDto createTransaction(TransactionDto request);
    TransactionDto updateTransactionStatus(Long id, TransactionStatus status);
    TransactionDto getTransactionById(Long id);
    List<TransactionDto> getAllTransactions();
    List<TransactionDto> getTransactionsByUser(Long userId);
}
