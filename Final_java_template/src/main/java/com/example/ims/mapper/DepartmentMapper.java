package com.example.ims.mapper;

import com.example.ims.dto.DepartmentDto;
import com.example.ims.entity.Department;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    DepartmentDto toDto(Department department);
    Department toEntity(DepartmentDto dto);
}
