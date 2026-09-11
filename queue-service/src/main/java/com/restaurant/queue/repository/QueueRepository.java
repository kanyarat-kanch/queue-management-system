package com.restaurant.queue.repository;

import com.restaurant.queue.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QueueRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByStatusOrderByQueueNumber(QueueStatus status);

    Optional<QueueEntry> findByCustomerIdAndStatus(Long customerId, QueueStatus status);

    // Find current queue even if it has been called
    Optional<QueueEntry> findFirstByCustomerIdAndStatusIn(
            Long customerId,
            List<QueueStatus> statuses
    );

    @Query("SELECT COALESCE(MAX(q.queueNumber), 0) + 1 FROM QueueEntry q")
    Integer findNextQueueNumber();

    Optional<QueueEntry> findFirstByStatusOrderByQueueNumberAsc(QueueStatus status);
}