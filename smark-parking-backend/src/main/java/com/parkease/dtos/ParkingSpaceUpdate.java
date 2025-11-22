package com.parkease.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSpaceUpdate {
    private Long parkingSpaceId;
    private int availableSlots;
    private int totalSlots;
    private String action;
    private Long timestamp;
    
    public ParkingSpaceUpdate(Long parkingSpaceId, int availableSlots, int totalSlots, String action) {
        this.parkingSpaceId = parkingSpaceId;
        this.availableSlots = availableSlots;
        this.totalSlots = totalSlots;
        this.action = action;
        this.timestamp = System.currentTimeMillis();
    }
}