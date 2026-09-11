package com.restaurant.queue.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final QueueWebSocketHandler queueWebSocketHandler;

    public WebSocketConfig(QueueWebSocketHandler queueWebSocketHandler) {
        this.queueWebSocketHandler = queueWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(queueWebSocketHandler, "/ws/queue")
                .setAllowedOrigins("*");   // restrict in production
    }
}
