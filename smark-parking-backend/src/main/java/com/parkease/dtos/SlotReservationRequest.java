package com.parkease.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotReservationRequest {
    private Long slotId;
    private Long parkingSpaceId;
    private Long userId;
    private String userName;
    private int reservationTimeoutMinutes = 5; // Default 5 minutes
}