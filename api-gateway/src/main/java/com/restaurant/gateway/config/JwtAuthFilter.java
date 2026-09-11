package com.restaurant.gateway.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;

/**
 * JWT Authentication Gateway Filter.
 *
 * Steps:
 *  1. Extract Bearer token from Authorization header.
 *  2. Validate signature and expiry.
 *  3. Forward X-User-Id and X-User-Role headers to downstream services.
 *  4. Reject with 401 if token is missing or invalid.
 */
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String secret;

    public JwtAuthFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

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

                String username = claims.getSubject();
                String role     = claims.get("role", String.class);

                // Forward enriched headers to downstream (downstream trusts these)
                ServerWebExchange mutatedExchange = exchange.mutate()
                        .request(r -> r.headers(headers -> {
                            headers.add("X-User-Id", String.valueOf(getUserIdFromToken(claims)));
                            headers.add("X-User-Role", role);
                            headers.add("X-Username", username);
                        }))
                        .build();

                return chain.filter(mutatedExchange);

            } catch (JwtException e) {
                return unauthorized(exchange);
            }
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    /**
     * The JWT subject is the username. For a real user ID, you'd either:
     * a) Embed the ID as a claim when generating the token (recommended), or
     * b) Call the auth service to look up the user.
     * Here we store the ID in the "sub" field via AuthService.
     */
    private Long getUserIdFromToken(Claims claims) {
        Object id = claims.get("userId");
        return id != null ? Long.parseLong(id.toString()) : 0L;
    }

    public static class Config {}
}
