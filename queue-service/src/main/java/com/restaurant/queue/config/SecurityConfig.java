package com.restaurant.queue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Queue service trusts the API Gateway for auth.
 * All requests reaching this service already passed JWT validation at the gateway.
 * The X-User-Id and X-User-Role headers are injected by the gateway.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**").permitAll()   // WebSocket handshake
                .anyRequest().permitAll()                // Gateway already validated JWT
            );
        return http.build();
    }
}
