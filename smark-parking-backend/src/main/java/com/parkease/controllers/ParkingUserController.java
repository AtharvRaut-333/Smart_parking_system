package com.parkease.controllers;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.parkease.beans.ParkingUser;
import com.parkease.beans.User;
import com.parkease.beans.Vehicle;
import com.parkease.dao.ParkingUserRepo;
import com.parkease.dao.UserRepository;
import com.parkease.dtos.AuthResponse;
import com.parkease.security.AuthRequest;
import com.parkease.security.JwtUtil;
import com.parkease.services.OtpService;
import com.parkease.services.ParkingUserService;
import com.parkease.services.UserInfoService;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

// CORS handled by SecurityConfig
@RestController
@RequestMapping("/parkinguser")
@PreAuthorize("hasRole('USER')")
public class ParkingUserController {

    @Autowired
    private UserInfoService service;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository repository;
    @Autowired
    private ParkingUserRepo parkingUserRepo;
    @Autowired
    private ParkingUserService parkingUserService;
    @Autowired
    private AuthenticationManager authenticationManager;
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    
    @Autowired
    private OtpService otpService;

   
   
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(HttpServletRequest request) throws Throwable {
        System.out.println("in profile");
        try {
            String token = extractTokenFromRequest(request);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token missing");
            }

            String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
            User user = repository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
          
            AuthResponse response = new AuthResponse();
            response.setAccessToken(token);
            response.setFullname(user.getFullname());
            response.setEmail(user.getEmail());
            response.setContactno(user.getContactno());
            response.setProfileImage(user.getProfileImage());
            response.setUserId(user.getUserId());
            System.out.println(response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Token");
        }
    }

    // ✅ Extract JWT from Authorization Header or Cookie
    private String extractTokenFromRequest(HttpServletRequest
    		request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @GetMapping("/test-auth")
    public ResponseEntity<String> testAuth() {
        return ResponseEntity.ok("JWT is working ✅");
    }

 

    

   

  

  


   

    @GetMapping("/getvehiclesInfo/{email}")
    public ResponseEntity<?> getVehicles(@PathVariable String email) {
        // Normalize the email if necessary
        email = email.toLowerCase();

        // Find ParkingUser by email
        Optional<ParkingUser> parkingUserOpt = parkingUserRepo.findByEmail(email);
        
        // If no user is found, return a 404 response
        if (!parkingUserOpt.isPresent()) {
            System.out.println("User not found for email: " + email);
            return ResponseEntity.notFound().build();
        }

        // Get the ParkingUser object
        ParkingUser parkingUser = parkingUserOpt.get();
        System.out.println("Found parking user: " + parkingUser);

        // Get the list of vehicles associated with the user
        List<Vehicle> vehicles = parkingUser.getVehicles();

        // Return the list of vehicles in JSON format
        return ResponseEntity.ok(vehicles);
    }

   
    
    @PatchMapping("/updateinfo/{email}")
    public ResponseEntity<?> updateInfo(@RequestBody User user, @PathVariable String email) {
        System.out.println("In update method");

        Optional<User> userop = repository.findByEmail(email);

        // ✅ Check if user exists
        if(userop.isPresent()) {
            System.out.println("User Found");
            User existingUser = userop.get();

            // ✅ Only update these fields (Ignore Password)
            if(user.getFullname() != null) {
                existingUser.setFullname(user.getFullname());
            }
            if(user.getContactno() != null) {
                existingUser.setContactno(user.getContactno());
            }
            if(user.getEmail() != null) {
                existingUser.setEmail(user.getEmail());
            }

            // ✅ DO NOT UPDATE PASSWORD 🚫
            // existingUser.setPassword(user.getPassword()); ❌

            // ✅ Save user without affecting password
            repository.save(existingUser);

            // ✅ Return ResponseEntity with 200 OK
            return ResponseEntity.ok("User Info Updated Successfully");
        }

        // ❌ Return 404 if user not found
        System.out.println("User Not Found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User Not Found");
    }
  
    
    @PostMapping("/addvehicle/{email}")
    public ResponseEntity<?> addVehicle(@RequestBody Vehicle vehicle,@PathVariable String email){
    	try {
    		List<Vehicle>vehicles=parkingUserService.addNewVehicle(vehicle,email);
    		return new ResponseEntity<>(vehicles,HttpStatus.CREATED);
    	}catch(Exception e) {
    		return new ResponseEntity<>("error addding vehicle",HttpStatus.BAD_REQUEST);
    	}
    }
    
    @PatchMapping("/uploadimage")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        @RequestParam("email") String email) {
        // ✅ Clean file name: Remove spaces & special characters
        String originalName = file.getOriginalFilename()
                                  .replaceAll("[\\s(){}]", "_");  // Replace spaces & special chars

        // ✅ Generate a unique file name
        String fileName = UUID.randomUUID().toString() + "_" + originalName;

        // ✅ Save file in the project directory
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        File dest = new File(uploadDir, fileName);

        try {
            if (!new File(uploadDir).exists()) {
                new File(uploadDir).mkdirs();
            }
            file.transferTo(dest);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error saving file");
        }

        // ✅ Save only the cleaned file name in the database
        User savedUser = service.saveImage(email, fileName);
        return savedUser != null
            ? ResponseEntity.ok("Image updated successfully")
            : ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error updating profile");
    }

    @GetMapping("/uploads/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) throws IOException {
        Path filePath = Paths.get(System.getProperty("user.dir") + "/uploads/").resolve(filename);
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG) // Adjust based on file type
            .body(resource);
    }





}

