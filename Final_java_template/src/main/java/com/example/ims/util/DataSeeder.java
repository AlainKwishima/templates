package com.example.ims.util;

import com.example.ims.entity.Role;
import com.example.ims.entity.User;
import com.example.ims.repository.RoleRepository;
import com.example.ims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedRoles();
        seedAdminUser();
    }

    private void seedRoles() {
        List<String> roleNames = Arrays.asList("ADMIN", "STAFF", "USER");
        for (String roleName : roleNames) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(Role.builder().name(roleName).build());
            }
        }
    }

    private void seedAdminUser() {
        if (!userRepository.existsByEmail("admin@example.com")) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(adminRole)
                    .build();
            userRepository.save(admin);
        }
    }
}
