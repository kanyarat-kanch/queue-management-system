package com.restaurant.auth.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    // Auto-generated primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Username and email must be unique
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // Stores the BCrypt-hashed password, not the plain-text password
    @Column(nullable = false)
    private String password;

    // Defines the user's access role, such as CUSTOMER or STAFF
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Automatically records when the user account is created
    @CreationTimestamp
    private LocalDateTime createdAt;

    // Automatically updates when the user record is modified
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}