package com.restaurant.queue.controller;

import com.restaurant.queue.dto.QueueResponse;
import com.restaurant.queue.model.QueueStatus;
import com.restaurant.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Staff-only endpoints.
 * The API Gateway checks that X-User-Role == STAFF before routing here.
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final QueueService queueService;

    /** Call the next waiting customer. */
    @PostMapping("/call-next")
    public ResponseEntity<QueueResponse> callNext() {
        return ResponseEntity.ok(queueService.callNext());
    }

    /** Update status of a specific entry (SEATED, CANCELLED, etc). */
    @PutMapping("/status/{id}")
    public ResponseEntity<QueueResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam QueueStatus status) {
        return ResponseEntity.ok(queueService.updateStatus(id, status));
    }

    /** View all queue entries (full view for staff dashboard). */
    @GetMapping("/queue")
    public ResponseEntity<List<QueueResponse>> getAllEntries() {
        return ResponseEntity.ok(queueService.getAllEntries());
    }
}
