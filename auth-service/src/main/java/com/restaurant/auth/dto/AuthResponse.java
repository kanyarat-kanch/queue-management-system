package com.restaurant.auth.dto;
import lombok.*;

@Data @Builder
public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String message;
}
