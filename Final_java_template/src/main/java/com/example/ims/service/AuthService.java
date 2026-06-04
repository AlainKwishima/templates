package com.example.ims.service;

import com.example.ims.dto.AuthRequest;
import com.example.ims.dto.AuthResponse;
import com.example.ims.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(AuthRequest request);
}
