package com.restaurant.queue.controller;

import com.restaurant.queue.dto.*;
import com.restaurant.queue.service.QueueService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer-facing endpoints.
 * The API Gateway forwards X-User-Id and X-User-Role headers after JWT validation.
 */
@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    /** Take a new queue number. */
    @PostMapping("/take")
    public ResponseEntity<QueueResponse> takeQueue(
            @Valid @RequestBody TakeQueueRequest request,
            HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        return ResponseEntity.ok(queueService.takeQueue(request, customerId));
    }

    /** View all WAITING entries (public queue board). */
    @GetMapping("/status")
    public ResponseEntity<List<QueueResponse>> getQueueStatus() {
        return ResponseEntity.ok(queueService.getWaitingQueue());
    }

    /** View my current entry. */
    @GetMapping("/my")
    public ResponseEntity<QueueResponse> getMyEntry(HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        return ResponseEntity.ok(queueService.getMyEntry(customerId));
    }

    /** Cancel my entry. */
    @DeleteMapping("/my")
    public ResponseEntity<Void> cancelMyEntry(HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        queueService.cancelMyEntry(customerId);
        return ResponseEntity.noContent().build();
    }

    // X-User-Id header is injected by the API Gateway
    private Long extractUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) throw new IllegalStateException("Missing X-User-Id header");
        return Long.parseLong(userId);
    }
}
