package com.example.ims.mapper;

import com.example.ims.dto.TransactionDto;
import com.example.ims.entity.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.firstName", target = "userName")
    @Mapping(source = "resource.id", target = "resourceId")
    @Mapping(source = "resource.name", target = "resourceName")
    TransactionDto toDto(Transaction transaction);
}
