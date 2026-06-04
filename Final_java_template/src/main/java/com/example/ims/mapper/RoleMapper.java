package com.example.ims.mapper;

import com.example.ims.dto.RoleDto;
import com.example.ims.entity.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleDto toDto(Role role);
}
