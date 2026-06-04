package com.example.ims.service.impl;

import com.example.ims.dto.AuthRequest;
import com.example.ims.dto.AuthResponse;
import com.example.ims.dto.RegisterRequest;
import com.example.ims.entity.Role;
import com.example.ims.entity.User;
import com.example.ims.exception.AppValidationException;
import com.example.ims.exception.ResourceNotFoundException;
import com.example.ims.mapper.UserMapper;
import com.example.ims.repository.RoleRepository;
import com.example.ims.repository.UserRepository;
import com.example.ims.security.JwtService;
import com.example.ims.service.AuthService;
import com.example.ims.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppValidationException("Email already exists");
        }

        String roleName = request.roleName() != null ? request.roleName().toUpperCase() : "USER";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(role)
                .build();

        userRepository.save(user);
        String jwtToken = jwtService.generateToken(user);
        
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
        
        return new AuthResponse(jwtToken, userMapper.toDto(user));
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken, userMapper.toDto(user));
    }
}
