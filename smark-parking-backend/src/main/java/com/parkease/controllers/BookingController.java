package com.parkease.controllers;

import java.io.ByteArrayOutputStream;


import java.io.IOException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.Optional;
import org.apache.http.HttpStatus;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.parkease.beans.Booking;
import com.parkease.beans.ParkingSpace;
import com.parkease.beans.Reciept;
import com.parkease.beans.User;
import com.parkease.dao.BookingRepository;
import com.parkease.dao.ParkingSlotRepository;
import com.parkease.dao.ParkingSpaceRepo;
import com.parkease.dao.RecieptRepo;
import com.parkease.dao.UserRepository;
import com.parkease.dtos.BookingRequest;
import com.parkease.dtos.BookingResponse;
import com.parkease.dtos.BookingUpdateRequest;
import com.parkease.dtos.MessageResponse;
import com.parkease.dtos.StatusUpdateRequest;
import com.parkease.services.BookingService;
import java.util.Map;
import java.util.Optional;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.parkease.dtos.SlotUpdateMessage;
import com.parkease.dtos.ParkingSpaceUpdate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import com.parkease.dtos.SlotUpdateMessage;
import com.parkease.dtos.ParkingSpaceUpdate;


@RestController
@RequestMapping("/api/bookings")
@PreAuthorize("hasRole('USER')")
public class BookingController {
	@Autowired
    private BookingService bookingService;
	
	@Autowired
    private BookingRepository bookingRepository;
	
	@Autowired
    private RecieptRepo recieptRepo;
 
 @Autowired
 private ParkingSlotRepository parkingSlotRepository;
 
 @Autowired
 private ParkingSpaceRepo parkingSpaceRepo;
 @Autowired
 private UserRepository userRepository;;;
 
 @Autowired
 private SimpMessagingTemplate messagingTemplate;
 


// Store temporary slot reservations
private final ConcurrentHashMap<Long, SlotReservation> slotReservations = new ConcurrentHashMap<>();
private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

private static class SlotReservation {
    Long userId;
    String userName;
    Long timestamp;
    
    SlotReservation(Long userId, String userName) {
        this.userId = userId;
        this.userName = userName;
        this.timestamp = System.currentTimeMillis();
    }
}
    @PostMapping("/{slotId}")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest bookingReq,@PathVariable Long slotId) {
        
    	System.out.println("lkdl"+bookingReq.getArrivalTime());
    	Booking booking=bookingService.saveBooking(bookingReq,slotId);
    	System.out.println(booking.getId());
    	
    	    notifySlotBooked(slotId, bookingReq.getParkingLotId(), bookingReq.getUserId());

    	
        return ResponseEntity.ok(booking);
    }
   @GetMapping("/generateReciept/{bookingId}")
 public ResponseEntity<?> getReceipt(@PathVariable Long bookingId) {
	   
	   try {
       	
       	System.out.println(bookingId);
       	Booking booking=bookingRepository.findById(bookingId).get();
       	
       	ParkingSpace parkingSpace=parkingSpaceRepo.findById(booking.getParkingLotId()).get();
       	System.out.println(booking.getUserId()+"userid");
       User user=userRepository.findById(booking.getUserId()).get();
       			
           // Example booking details (In real case, fetch from DB)
           String fullName = user.getFullname();
           String email = user.getEmail();
           String parkingSpot = parkingSpace.getLotName();
           long parkingslot = booking.getParkingSlot().getSlotId();
           String parkingAddress = parkingSpace.getAddress();
           ZonedDateTime Arrival = booking.getArrivalTime();
           ZonedDateTime departure = booking.getDepartureTime();
          
           double amountPaid = booking.getAmount();
           
           Reciept reciept=new Reciept(fullName, amountPaid, parkingSpot);
           reciept.setArrivalTime(Arrival);
           reciept.setDepartureTime(departure);
           reciept.setParkingSpotAddress(parkingAddress);
           reciept.setSlotId(parkingslot);
           
           
       
       Reciept saved=recieptRepo.save(reciept);
       return new ResponseEntity(saved,org.springframework.http.HttpStatus.OK);
   }catch(Exception e) {
	   System.out.println(e.getMessage());
	    return new ResponseEntity("err",org.springframework.http.HttpStatus.BAD_REQUEST);
   }
	   
	   
   }
   @PreAuthorize("permitAll()")
   @GetMapping("/{id}/getbookings")
   public ResponseEntity<?> getMethodName(@PathVariable long id) {
	   System.out.println(id);
      List<BookingResponse> bookings= bookingService.getBookings(id);
      return ResponseEntity.ok(bookings);
   }
   
   @GetMapping("/{userId}")
   public ResponseEntity<?> getBookings(@PathVariable Long userId){
	   List<BookingResponse> bookings=bookingService.getUserBookings(userId);
	   return ResponseEntity.ok(bookings);
   }
   
   @PreAuthorize("permitAll()")
   @PutMapping("/{bookingId}/status")
   public ResponseEntity<?> updateBookingStatus(
           @PathVariable Long bookingId,
            @RequestBody StatusUpdateRequest statusUpdateRequest) {
       
       try {
           Booking updatedBooking = bookingService.updateBookingStatus(bookingId, statusUpdateRequest.getStatus());
           return ResponseEntity.ok(updatedBooking);
       } catch (Exception e) {
           return ResponseEntity
                   .badRequest()
                   .body(new MessageResponse("Error updating booking status: " + e.getMessage()));
       }
   }
   @PutMapping("/update-time/{bookingId}")
   public ResponseEntity<Booking> updateBookingTimes(
           @PathVariable Long bookingId,
           @RequestBody BookingUpdateRequest request) {

       Booking updatedBooking = bookingService.updateBookingTimes(bookingId, request);
       return ResponseEntity.ok(updatedBooking);
   }

   
//   // Get a specific booking by ID
//   @GetMapping("/booking/{bookingId}")
//   public ResponseEntity<Booking> getBookingById(@PathVariable Long bookingId) {
//       try {
//           Booking booking = bookingService.getBookingById(bookingId);
//           return ResponseEntity.ok(booking);
//       } catch (RuntimeException e) {
//           return ResponseEntity.notFound().build();
//       }
//   }

    // Real-time slot booking methods
    
    @PostMapping("/reserve/{slotId}")
    public ResponseEntity<?> reserveSlot(@PathVariable Long slotId, @RequestBody Map<String, Object> request) {
        Long parkingSpaceId = Long.valueOf(request.get("parkingSpaceId").toString());
        Long userId = Long.valueOf(request.get("userId").toString());
        String userName = request.get("userName").toString();
        
        // Check if slot is available
        Optional<com.parkease.beans.ParkingSlot> slotOpt = parkingSlotRepository.findById(slotId);
        if (slotOpt.isEmpty() || !slotOpt.get().isAvailable()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Slot not available"));
        }
        
        // Check if already reserved
        if (slotReservations.containsKey(slotId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Slot already reserved"));
        }
        
        // Reserve the slot temporarily
        slotReservations.put(slotId, new SlotReservation(userId, userName));
        
        // Schedule timeout to release reservation
        scheduler.schedule(() -> {
            if (slotReservations.containsKey(slotId)) {
                slotReservations.remove(slotId);
                notifySlotReleased(slotId, parkingSpaceId, "TIMEOUT");
            }
        }, 5, TimeUnit.MINUTES);
        
        // Notify all clients about reservation
        notifySlotReserved(slotId, parkingSpaceId, userId, userName);
        
        return ResponseEntity.ok(new MessageResponse("Slot reserved successfully"));
    }
    
    @PostMapping("/release/{slotId}")
    public ResponseEntity<?> releaseSlot(@PathVariable Long slotId, @RequestBody Map<String, Object> request) {
        Long parkingSpaceId = Long.valueOf(request.get("parkingSpaceId").toString());
        
        if (slotReservations.containsKey(slotId)) {
            slotReservations.remove(slotId);
            notifySlotReleased(slotId, parkingSpaceId, "RELEASED");
            return ResponseEntity.ok(new MessageResponse("Slot released successfully"));
        }
        
        return ResponseEntity.badRequest().body(new MessageResponse("Slot not reserved"));
    }
    
    private void notifySlotReserved(Long slotId, Long parkingSpaceId, Long userId, String userName) {
        SlotUpdateMessage message = new SlotUpdateMessage(slotId, parkingSpaceId, false, "RESERVED");
        message.setUserId(userId);
        message.setUserName(userName);
        
        messagingTemplate.convertAndSend("/topic/parking-space/" + parkingSpaceId, message);
        messagingTemplate.convertAndSend("/topic/slots", message);
    }
    
    private void notifySlotBooked(Long slotId, Long parkingSpaceId, Long userId) {
        // Remove from reservations if it was reserved
        slotReservations.remove(slotId);
        
        SlotUpdateMessage message = new SlotUpdateMessage(slotId, parkingSpaceId, false, "BOOKED");
        message.setUserId(userId);
        
        messagingTemplate.convertAndSend("/topic/parking-space/" + parkingSpaceId, message);
        messagingTemplate.convertAndSend("/topic/slots", message);
        
        // Update parking space availability count
        updateParkingSpaceAvailability(parkingSpaceId);
    }
    
    private void notifySlotReleased(Long slotId, Long parkingSpaceId, String action) {
        SlotUpdateMessage message = new SlotUpdateMessage(slotId, parkingSpaceId, true, action);
        
        messagingTemplate.convertAndSend("/topic/parking-space/" + parkingSpaceId, message);
        messagingTemplate.convertAndSend("/topic/slots", message);
        
        // Update parking space availability count
        updateParkingSpaceAvailability(parkingSpaceId);
    }
    
    private void updateParkingSpaceAvailability(Long parkingSpaceId) {
        try {
            com.parkease.beans.ParkingSpace parkingSpace = parkingSpaceRepo.findById(parkingSpaceId).orElse(null);
            if (parkingSpace != null) {
                long availableSlots = parkingSpace.getParkingSlot().stream()
                    .mapToLong(slot -> slot.isAvailable() ? 1 : 0)
                    .sum();
                
                ParkingSpaceUpdate update = new ParkingSpaceUpdate(
                    parkingSpaceId, 
                    (int) availableSlots, 
                    parkingSpace.getTotalSlots(), 
                    "AVAILABILITY_UPDATE"
                );
                
                messagingTemplate.convertAndSend("/topic/parking-spaces", update);
            }
        } catch (Exception e) {
            System.err.println("Error updating parking space availability: " + e.getMessage());
        }
    }
    
    @PostConstruct
    public void init() {
        System.out.println("Real-time booking controller initialized");
    }
    
    @PreDestroy
    public void cleanup() {
        scheduler.shutdown();
    }
    
}
