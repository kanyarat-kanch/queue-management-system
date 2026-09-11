package com.restaurant.queue.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class TakeQueueRequest {
    @NotBlank private String customerName;
    @Min(1) @Max(20) private Integer partySize = 1;
    private String notes;
}
