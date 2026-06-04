package com.example.ims.service;

import com.example.ims.dto.UserDto;
import java.util.List;

public interface UserService {
    UserDto getUserById(Long id);
    List<UserDto> getAllUsers();
    void deleteUser(Long id);
}
