package com.example.ims.service.impl;

import com.example.ims.dto.TransactionDto;
import com.example.ims.entity.Resource;
import com.example.ims.entity.Transaction;
import com.example.ims.entity.TransactionStatus;
import com.example.ims.entity.User;
import com.example.ims.exception.ResourceNotFoundException;
import com.example.ims.mapper.TransactionMapper;
import com.example.ims.repository.ResourceRepository;
import com.example.ims.repository.TransactionRepository;
import com.example.ims.repository.UserRepository;
import com.example.ims.service.EmailService;
import com.example.ims.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final TransactionMapper transactionMapper;
    private final EmailService emailService;

    @Override
    public TransactionDto createTransaction(TransactionDto request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        Transaction transaction = Transaction.builder()
                .user(user)
                .resource(resource)
                .transactionDate(LocalDateTime.now())
                .status(TransactionStatus.PENDING)
                .build();

        return transactionMapper.toDto(transactionRepository.save(transaction));
    }

    @Override
    public TransactionDto updateTransactionStatus(Long id, TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        
        transaction.setStatus(status);
        if (status == TransactionStatus.COMPLETED || status == TransactionStatus.CANCELLED) {
            transaction.setReturnDate(LocalDateTime.now());
        }

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        emailService.sendTransactionConfirmationEmail(
                savedTransaction.getUser().getEmail(),
                savedTransaction.getUser().getFirstName(),
                savedTransaction.getResource().getName(),
                status.name()
        );

        return transactionMapper.toDto(savedTransaction);
    }

    @Override
    public TransactionDto getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .map(transactionMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    @Override
    public List<TransactionDto> getAllTransactions() {
        return transactionRepository.findAll().stream()
                .map(transactionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionDto> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId).stream()
                .map(transactionMapper::toDto)
                .collect(Collectors.toList());
    }
}
