package com.restaurant.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    // Username must be between 3 and 50 characters
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    // Email must be provided in a valid email format
    @NotBlank
    @Email
    private String email;

    // Password must be at least 8 characters with at least one letter and one number
    @NotBlank
    @Size(min = 8)
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Password must be at least 8 characters and contain at least one letter and one number."
    )
    private String password;
}