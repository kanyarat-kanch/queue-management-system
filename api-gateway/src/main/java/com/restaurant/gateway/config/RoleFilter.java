package com.restaurant.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Role-based access filter.
 * Checks X-User-Role header (set by JwtAuthFilter) against requiredRole.
 */
@Component
public class RoleFilter extends AbstractGatewayFilterFactory<RoleFilter.Config> {

    public RoleFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String role = exchange.getRequest().getHeaders().getFirst("X-User-Role");
            if (role == null || !role.equalsIgnoreCase(config.getRequiredRole())) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }

    @Override
    public List<String> shortcutFieldOrder() {
        return List.of("requiredRole");
    }

    public static class Config {
        private String requiredRole;
        public String getRequiredRole() { return requiredRole; }
        public void setRequiredRole(String r) { this.requiredRole = r; }
    }
}
