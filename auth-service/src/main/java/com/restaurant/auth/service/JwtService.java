package com.restaurant.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * Handles JWT creation and validation.
 * The secret and expiration are injected from application.yml.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Generate a JWT token for a user.
     * Embeds userId, username and role as claims.
     */
    public String generateToken(Long userId, String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
                .compact();
    }

    /** Extract the username (subject) from a token. */
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    /** Extract the role from a token. */
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    /** Extract the user ID from a token. */
    public Long extractUserId(String token) {
        Object id = getClaims(token).get("userId");
        return id != null ? Long.parseLong(id.toString()) : null;
    }

    /** Validate the token signature and expiration. */
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}