package com.parkease.services;


import com.parkease.beans.ParkingUser;
import com.parkease.beans.User;

import com.parkease.dao.ParkingUserRepo;
import com.parkease.dao.UserRepository;
import com.parkease.dtos.Role;
import com.parkease.security.AuthRequest;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserInfoService implements UserDetailsService {

    @Autowired
    private UserRepository repository;
    
    @Autowired
    private ParkingUserRepo parkingUserRepo;

   
    private PasswordEncoder encoder;
   
    public UserInfoService() {
		super();
		// TODO Auto-generated constructor stub
	}
    @Autowired
	public UserInfoService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @Override
 
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("Loading user: " + email);
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Debug: Print user roles
        System.out.println("User roles: " + user.getRoles());
        
        // Fix: If user has no roles, assign ROLE_USER
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            System.out.println("⚠️ User has no roles, assigning ROLE_USER");
            user.setRoles(Set.of(Role.ROLE_USER));
            repository.save(user); // Save the updated user
        }

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map((Role role) -> new SimpleGrantedAuthority(role.name()))
                .collect(Collectors.toList());
        
        System.out.println("User authorities: " + authorities);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }


    @Transactional
    public boolean addUser(ParkingUser userInfo) {
        // Check if user already exists
        Optional<User> user = repository.findByEmail(userInfo.getEmail());
        if (user.isPresent()) {
            return false;
        }

        // Encode password
        userInfo.setPassword(encoder.encode(userInfo.getPassword()));
        userInfo.setUsername(userInfo.getEmail());
        userInfo.setRoles(Set.of(Role.ROLE_USER));
        userInfo.setVehicleType("sumo");
        // Save the ParkingUser entity
        parkingUserRepo.save(userInfo);

        return true;
    }

	public boolean updatePassword(AuthRequest authRequest) {
		System.out.println("in update");
		Optional<User> userop=repository.findByEmail(authRequest.getEmail());
		
		if(userop.isPresent()) {
			System.out.println("in if");
			User user=userop.get();
			user.setPassword(encoder.encode(authRequest.getPassword()));
			
			repository.save(user);
			return true;
			
		}
		return false;
	}
	public List<User> getAllUsers() {
		// TODO Auto-generated method stub
		return repository.findAll();
	}
	public User updateInfo(User user,String email) {
		System.out.println("in update");
		Optional<User> userop=repository.findByEmail(email);
		User updateduser=null;
		
		if(userop.isPresent()) {
			System.out.println("in if");
			User user1=userop.get();
			user1.setEmail(user.getEmail());
			user1.setContactno(user.getContactno());
			user1.setFullname(user.getFullname());
			
			updateduser= repository.save(user);
			
			
		}
		return updateduser;
	}
	
	public User  saveImage(String email, String filePath) {
		Optional<User> userop=repository.findByEmail(email);
		User updateduser=null;
		
		 if(userop.isPresent()) {
	            System.out.println("User Found");
	            User existingUser = userop.get();

	            // ✅ Only update these fields (Ignore Password)
	           System.out.println(filePath);
	            existingUser.setProfileImage(filePath);
	            System.out.println("filepath"+existingUser.getProfileImage());
	           

	           
	          updateduser=  repository.save(existingUser);

	            // ✅ Return ResponseEntity with 200 OK
	        
	        }
		 return updateduser;

		
	}
}

