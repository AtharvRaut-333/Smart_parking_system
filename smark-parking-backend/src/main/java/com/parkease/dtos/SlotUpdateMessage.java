package com.parkease.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotUpdateMessage {
    private Long slotId;
    private Long parkingSpaceId;
    private boolean isAvailable;
    private String action; // "RESERVED", "BOOKED", "RELEASED", "TIMEOUT"
    private Long userId;
    private String userName;
    private Long timestamp;
    
    public SlotUpdateMessage(Long slotId, Long parkingSpaceId, boolean isAvailable, String action) {
        this.slotId = slotId;
        this.parkingSpaceId = parkingSpaceId;
        this.isAvailable = isAvailable;
        this.action = action;
        this.timestamp = System.currentTimeMillis();
    }
}
