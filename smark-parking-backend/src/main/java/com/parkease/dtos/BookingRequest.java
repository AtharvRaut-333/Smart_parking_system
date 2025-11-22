package com.parkease.dtos;

import lombok.Data;

@Data
public class BookingRequest {
	
	   private Long userId;
	   
	    private Long parkingLotId;
	 private String arrivalTime;
	    private String departureTime;
	    
	    
	    double amount;
	    private String carNumber;
	

}