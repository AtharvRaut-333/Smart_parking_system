package com.parkease.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;


import com.parkease.beans.ParkingSlot;
import com.parkease.beans.ParkingSpace;
import com.parkease.dao.ParkingSlotRepository;
import com.parkease.dao.ParkingSpaceRepo;
import com.parkease.dtos.SlotReservationRequest;
import com.parkease.dtos.SlotUpdateMessage;
import com.parkease.dtos.ParkingSpaceUpdate;

import java.util.Optional;

@Controller
@CrossOrigin(origins = "*")
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ParkingSlotRepository parkingSlotRepository;
    
    @Autowired
    private ParkingSpaceRepo parkingSpaceRepo;

    @MessageMapping("/slot.reserve")
    @SendTo("/topic/slots")
    public SlotUpdateMessage reserveSlot(@Payload SlotReservationRequest request) {
        System.out.println("=== WebSocket: RESERVE REQUEST RECEIVED ===");
        System.out.println("Slot ID: " + request.getSlotId());
        System.out.println("Parking Space ID: " + request.getParkingSpaceId());
        System.out.println("User ID: " + request.getUserId());
        System.out.println("User Name: " + request.getUserName());
        System.out.println("Request: " + request);
        
        // Check if slot is available
        Optional<ParkingSlot> slotOpt = parkingSlotRepository.findById(request.getSlotId());
        if (slotOpt.isPresent() && slotOpt.get().isAvailable()) {
            SlotUpdateMessage message = new SlotUpdateMessage();
            message.setSlotId(request.getSlotId());
            message.setParkingSpaceId(request.getParkingSpaceId());
            message.setAvailable(false);
            message.setAction("RESERVED");
            message.setUserId(request.getUserId());
            message.setUserName(request.getUserName());
            message.setTimestamp(System.currentTimeMillis());
            
            // Also send to specific parking space topic
            messagingTemplate.convertAndSend(
                "/topic/parking-space/" + request.getParkingSpaceId(), 
                message
            );
            
            System.out.println("=== WebSocket: RESERVE MESSAGE SENT ===");
            System.out.println("Message: " + message);
            System.out.println("Sent to topics: /topic/slots and /topic/parking-space/" + request.getParkingSpaceId());
            
            return message;
        }
        
        // Return slot not available message
        SlotUpdateMessage notAvailableMessage = new SlotUpdateMessage();
        notAvailableMessage.setSlotId(request.getSlotId());
        notAvailableMessage.setParkingSpaceId(request.getParkingSpaceId());
        notAvailableMessage.setAvailable(false);
        notAvailableMessage.setAction("NOT_AVAILABLE");
        notAvailableMessage.setUserId(request.getUserId());
        notAvailableMessage.setUserName(request.getUserName());
        notAvailableMessage.setTimestamp(System.currentTimeMillis());
        return notAvailableMessage;
    }

    @MessageMapping("/slot.release")
    @SendTo("/topic/slots")
    public SlotUpdateMessage releaseSlot(@Payload SlotReservationRequest request) {
        System.out.println("=== WebSocket: RELEASE REQUEST RECEIVED ===");
        System.out.println("Slot ID: " + request.getSlotId());
        System.out.println("Parking Space ID: " + request.getParkingSpaceId());
        System.out.println("User ID: " + request.getUserId());
        System.out.println("User Name: " + request.getUserName());
        
        SlotUpdateMessage message = new SlotUpdateMessage();
        message.setSlotId(request.getSlotId());
        message.setParkingSpaceId(request.getParkingSpaceId());
        message.setAvailable(true);
        message.setAction("RELEASED");
        message.setUserId(request.getUserId());
        message.setUserName(request.getUserName());
        message.setTimestamp(System.currentTimeMillis());
        
        // Also send to specific parking space topic
        messagingTemplate.convertAndSend(
            "/topic/parking-space/" + request.getParkingSpaceId(), 
            message
        );
        
        System.out.println("=== WebSocket: RELEASE MESSAGE SENT ===");
        System.out.println("Message: " + message);
        System.out.println("Sent to topics: /topic/slots and /topic/parking-space/" + request.getParkingSpaceId());
        
        return message;
    }

    @MessageMapping("/parking-space.subscribe")
    public void subscribeToParkingSpace(@Payload Long parkingSpaceId) {
        System.out.println("WebSocket: Client subscribed to parking space " + parkingSpaceId);
        
        // Send current availability status
        try {
            Optional<ParkingSpace> spaceOpt = parkingSpaceRepo.findById(parkingSpaceId);
            if (spaceOpt.isPresent()) {
                ParkingSpace space = spaceOpt.get();
                long availableSlots = space.getParkingSlot().stream()
                    .mapToLong(slot -> slot.isAvailable() ? 1 : 0)
                    .sum();
                
                ParkingSpaceUpdate update = new ParkingSpaceUpdate(
                    parkingSpaceId,
                    (int) availableSlots,
                    space.getTotalSlots(),
                    "INITIAL_STATUS"
                );
                
                messagingTemplate.convertAndSend(
                    "/topic/parking-space/" + parkingSpaceId, 
                    update
                );
            }
        } catch (Exception e) {
            System.err.println("Error sending initial parking space status: " + e.getMessage());
        }
    }
}