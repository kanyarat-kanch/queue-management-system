package com.restaurant.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_ROLE_HEADER = "X-User-Role";
    private static final String USERNAME_HEADER = "X-Username";

    @Value("${jwt.secret}")
    private String secret;

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest()
                    .getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorized(exchange);
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                Long userId = getUserIdFromToken(claims);
                String username = claims.getSubject();
                String role = claims.get("role", String.class);

                if (userId == null || username == null || role == null) {
                    return unauthorized(exchange);
                }

                ServerWebExchange authenticatedExchange = exchange.mutate()
                        .request(request -> request.headers(headers -> {
                            // Remove every identity header supplied by the client.
                            headers.remove(USER_ID_HEADER);
                            headers.remove(USER_ROLE_HEADER);
                            headers.remove(USERNAME_HEADER);

                            // Set exactly one trusted value from the verified JWT.
                            headers.set(USER_ID_HEADER, userId.toString());
                            headers.set(USER_ROLE_HEADER, role);
                            headers.set(USERNAME_HEADER, username);
                        }))
                        .build();

                return chain.filter(authenticatedExchange);

            } catch (JwtException | IllegalArgumentException exception) {
                return unauthorized(exchange);
            }
        };
    }

    private Long getUserIdFromToken(Claims claims) {
        Object userId = claims.get("userId");

        if (userId == null) {
            return null;
        }

        try {
            return Long.parseLong(userId.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
    }
}