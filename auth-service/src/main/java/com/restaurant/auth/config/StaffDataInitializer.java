package com.restaurant.auth.config;

import com.restaurant.auth.model.Role;
import com.restaurant.auth.model.User;
import com.restaurant.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StaffDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Controls whether the default staff account should be created at startup
    @Value("${staff.seed.enabled:false}")
    private boolean enabled;

    // Staff account details are loaded from application configuration or environment variables
    @Value("${staff.seed.username:}")
    private String username;

    @Value("${staff.seed.email:}")
    private String email;

    @Value("${staff.seed.password:}")
    private String password;

    @Override
    public void run(String... args) {
        // Skip staff account creation when seeding is disabled
        if (!enabled) {
            return;
        }

        // Prevent the application from starting with incomplete staff configuration
        if (username.isBlank() || email.isBlank() || password.isBlank()) {
            throw new IllegalStateException(
                "Staff seed is enabled, but STAFF_SEED_USERNAME, STAFF_SEED_EMAIL, or STAFF_SEED_PASSWORD is missing."
            );
        }

        // Do not create a duplicate staff account if the username already exists
        if (userRepository.existsByUsername(username)) {
            return;
        }

        // Prevent creating a staff account with an email already used by another user
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException(
                "Cannot create staff account: the configured email already exists."
            );
        }

        // Create the staff account with a BCrypt-hashed password
        User staff = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.STAFF)
                .build();

        userRepository.save(staff);
    }
}