package com.restaurant.queue.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Manages connected WebSocket clients.
 * When the queue changes, broadcastQueueUpdate() sends a message to every client,
 * which triggers the frontend to re-fetch the queue via REST.
 */
@Component
public class QueueWebSocketHandler extends TextWebSocketHandler {

    // Thread-safe set of active sessions
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Clients can send "PING" to keep the connection alive
    }

    /** Push a notification to all connected clients. */
    public void broadcastQueueUpdate(String message) throws Exception {
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                session.sendMessage(textMessage);
            }
        }
    }
}
