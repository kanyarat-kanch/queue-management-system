package com.restaurant.queue.model;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "queue_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QueueEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Integer queueNumber;
    @Column(nullable = false)
    private Long customerId;
    @Column(nullable = false, length = 100)
    private String customerName;
    @Column(nullable = false)
    private Integer partySize;
    private String notes;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private QueueStatus status;
    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime calledAt;
    private LocalDateTime seatedAt;
}
