package com.restaurant.queue.service;

import com.restaurant.queue.dto.*;
import com.restaurant.queue.model.*;
import com.restaurant.queue.repository.QueueRepository;
import com.restaurant.queue.websocket.QueueWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueRepository queueRepository;
    private final QueueWebSocketHandler webSocketHandler;

    /** Customer: take a new queue number. One active entry per customer. */
    @Transactional
    public QueueResponse takeQueue(TakeQueueRequest request, Long customerId) {

        queueRepository.findByCustomerIdAndStatus(customerId, QueueStatus.WAITING)
                .ifPresent(e -> {
                    throw new IllegalStateException(
                            "You already have queue #" + e.getQueueNumber()
                    );
                });

        Integer nextNumber = queueRepository.findNextQueueNumber();

        QueueEntry entry = QueueEntry.builder()
                .queueNumber(nextNumber)
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .partySize(request.getPartySize())
                .notes(request.getNotes())
                .status(QueueStatus.WAITING)
                .build();

        QueueEntry saved = queueRepository.save(entry);

        broadcastUpdate();

        return toResponse(saved);
    }

    /** Customer: view my current queue entry. */
    public QueueResponse getMyEntry(Long customerId) {

        return queueRepository.findFirstByCustomerIdAndStatusIn(
                        customerId,
                        List.of(
                                QueueStatus.WAITING,
                                QueueStatus.CALLED
                        )
                )
                .map(this::toResponse)
                .orElseThrow(() ->
                        new IllegalArgumentException("No active queue entry found"));
    }

    /** Customer: cancel my entry. */
    @Transactional
    public void cancelMyEntry(Long customerId) {

        QueueEntry entry = queueRepository.findByCustomerIdAndStatus(
                        customerId,
                        QueueStatus.WAITING
                )
                .orElseThrow(() ->
                        new IllegalArgumentException("No active queue entry to cancel"));

        entry.setStatus(QueueStatus.CANCELLED);

        queueRepository.save(entry);

        broadcastUpdate();
    }

    /** Public / customer: view all WAITING entries. */
    public List<QueueResponse> getWaitingQueue() {

        return queueRepository.findByStatusOrderByQueueNumber(QueueStatus.WAITING)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Staff: call the next waiting customer. */
    @Transactional
    public QueueResponse callNext() {

        QueueEntry entry = queueRepository
                .findFirstByStatusOrderByQueueNumberAsc(QueueStatus.WAITING)
                .orElseThrow(() ->
                        new IllegalStateException("No customers waiting"));

        entry.setStatus(QueueStatus.CALLED);
        entry.setCalledAt(LocalDateTime.now());

        QueueEntry saved = queueRepository.save(entry);

        broadcastUpdate();

        return toResponse(saved);
    }

    /** Staff: update any entry's status by ID. */
    @Transactional
    public QueueResponse updateStatus(Long id, QueueStatus newStatus) {

        QueueEntry entry = queueRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Queue entry not found: " + id));

        entry.setStatus(newStatus);

        if (newStatus == QueueStatus.SEATED) {
            entry.setSeatedAt(LocalDateTime.now());
        }

        QueueEntry saved = queueRepository.save(entry);

        broadcastUpdate();

        return toResponse(saved);
    }

    /** Staff: view ALL entries. */
    public List<QueueResponse> getAllEntries() {

        return queueRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────

    private QueueResponse toResponse(QueueEntry entry) {

        List<QueueEntry> waiting =
                queueRepository.findByStatusOrderByQueueNumber(
                        QueueStatus.WAITING
                );

        int ahead = (int) waiting.stream()
                .filter(e -> e.getQueueNumber() < entry.getQueueNumber())
                .count();

        return QueueResponse.builder()
                .id(entry.getId())
                .queueNumber(entry.getQueueNumber())
                .customerName(entry.getCustomerName())
                .partySize(entry.getPartySize())
                .status(entry.getStatus())
                .notes(entry.getNotes())
                .createdAt(entry.getCreatedAt())
                .waitingAhead(entry.getStatus() == QueueStatus.WAITING ? ahead : 0)
                .build();
    }

    private void broadcastUpdate() {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    webSocketHandler.broadcastQueueUpdate("QUEUE_UPDATED");
                } catch (Exception e) {
                    // ignore
                }
            }
        });
    }
}