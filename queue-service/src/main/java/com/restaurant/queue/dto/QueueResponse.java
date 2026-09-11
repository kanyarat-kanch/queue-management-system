package com.restaurant.queue.dto;
import com.restaurant.queue.model.QueueStatus;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder
public class QueueResponse {
    private Long id;
    private Integer queueNumber;
    private String customerName;
    private Integer partySize;
    private QueueStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private Integer waitingAhead;
}
