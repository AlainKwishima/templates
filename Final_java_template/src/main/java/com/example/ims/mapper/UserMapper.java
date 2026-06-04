package com.example.ims.mapper;

import com.example.ims.dto.UserDto;
import com.example.ims.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "role.name", target = "roleName")
    UserDto toDto(User user);
}
