package com.example.ims.mapper;

import com.example.ims.dto.ResourceDto;
import com.example.ims.entity.Resource;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ResourceMapper {
    
    @Mapping(source = "department.id", target = "departmentId")
    @Mapping(source = "department.name", target = "departmentName")
    ResourceDto toDto(Resource resource);
}
