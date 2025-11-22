package com.parkease.security;



import java.io.IOException;


import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.web.cors.CorsConfigurationSource;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.web.filter.CorsFilter;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.authentication.ProviderManager;

import com.parkease.beans.ParkingUser;
import com.parkease.beans.User;
import com.parkease.dao.ParkingUserRepo;
import com.parkease.dao.UserRepository;
import com.parkease.dtos.AuthResponse;
import com.parkease.dtos.Role;
import com.parkease.services.RefreshTokenService;
import com.parkease.services.UserInfoService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter authFilter;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private RefreshTokenService refreshTokenService;
    
    @Autowired
    private Environment environment;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    private final UserInfoService userInfoService;
    @Autowired
    private final UserRepository userRepository;
    
    @Autowired
    private final ParkingUserRepo parkingUserRepo;
  

  
    public SecurityConfig(UserInfoService userInfoService,ParkingUserRepo parkingUserRepo, UserRepository userRepository,JwtUtil jwtUtil) {
        this.userInfoService = userInfoService;
        this.userRepository=userRepository;
        this.parkingUserRepo=parkingUserRepo;
    
        this.jwtUtil = jwtUtil;
    }
    @Bean
    public UserDetailsService userDetailsService() {
        return new UserInfoService(); // Ensure UserInfoService implements UserDetailsService
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // ✅ Disable CSRF for development
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ✅ Apply global CORS
            .authorizeHttpRequests(auth -> auth
.requestMatchers("/user/login","/user/refresh","/user/success","/parkingspaces/getAllParkingSpaces","/parkingspaces/**","/parkingowner","parkingowner/{id}/upload-image","/api/payment/getPayments","/api/bookings/download/pdf","/admin/**","/admin/getParkingUsers", "/uploads/**", "/user/register","/user/send","/user/changepassword","/user/verify", "/auth/google/callback", "/ws/**", "/app/**", "/topic/**").permitAll()
       
                .requestMatchers("/auth/user/**").hasAuthority("ROLE_USER")
                .requestMatchers("/api/bookings/**").hasAuthority("ROLE_USER")
                .requestMatchers("/api/payment/**").hasAuthority("ROLE_USER")
                .requestMatchers("/user/profile").hasAuthority("ROLE_USER")
                .requestMatchers("/user/getvehiclesInfo/**").hasAuthority("ROLE_USER")
                .requestMatchers("/user/addvehicle/**").hasAuthority("ROLE_USER")
                .requestMatchers("/user/updateinfo/**").hasAuthority("ROLE_USER")
                .requestMatchers("/user/uploadimage").hasAuthority("ROLE_USER")
//                .requestMatchers("/admin/**").hasAuthority("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler())
                
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Debug: Print active profiles
        String[] activeProfiles = environment.getActiveProfiles();
        System.out.println("Active profiles: " + java.util.Arrays.toString(activeProfiles));
        System.out.println("Is local profile: " + isLocalProfile());
        
        // Only allow local development URLs
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000", // Docker frontend
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ));
        
        // Allow Headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow Methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"));
        
        // Allow Credentials (VERY IMPORTANT)
        configuration.setAllowCredentials(true);

        // Apply CORS Config
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    private boolean isLocalProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        return activeProfiles.length == 0 || 
               java.util.Arrays.asList(activeProfiles).contains("local") ||
               java.util.Arrays.asList(activeProfiles).contains("dev");
    }

    @Bean
    public AuthenticationSuccessHandler oAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            OAuth2User user = (OAuth2User) authentication.getPrincipal();
            String email = user.getAttribute("email");
            String name = user.getAttribute("name");
            String profileImage=user.getAttribute("picture");
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user1;

            if (existingUser.isPresent()) {
                System.out.println("User is present");
                user1 = existingUser.get();
            } else {
                // Generate a secure random password
                String randomPassword = generatePassword(8);
                String encodedPassword = passwordEncoder.encode(randomPassword);

              ParkingUser  parkingUser = new ParkingUser();
              parkingUser.setUsername(email);
              parkingUser.setEmail(email);
              parkingUser.setFullname(name);
              parkingUser.setPassword(encodedPassword);
              parkingUser.setRoles(Set.of(Role.ROLE_USER));
         
              parkingUser.setVehicleType("Four Wheeler");

                parkingUserRepo.save(parkingUser);
                System.out.println("Generated password for " + email + ": " + randomPassword);
            }

            UserDetails userDetails = userInfoService.loadUserByUsername(email);
            String jwtToken = jwtUtil.generateAccessToken(userDetails);
            String refreshToken = refreshTokenService.createRefreshToken(userDetails.getUsername()).getToken();

            System.out.println("Generated Token: " + jwtToken);

            // Environment-specific cookie settings
            boolean isProduction = !isLocalProfile();
            
            ResponseCookie accessCookie = ResponseCookie.from("token", jwtToken)
                    .httpOnly(true)
                    .secure(isProduction) // Only secure in production (HTTPS)
                    .path("/")
                    .maxAge(Duration.ofMinutes(15))
                    .sameSite(isProduction ? "None" : "Lax") // None for production, Lax for local
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(isProduction) // Only secure in production
                    .path("/")
                    .maxAge(Duration.ofDays(1))
                    .sameSite(isProduction ? "None" : "Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            // Environment-specific redirect URL
            String redirectUrl = isLocalProfile() ? 
                "http://localhost:5173/dashboard" : 
                "https://smart-car-parking-1.onrender.com/dashboard";
            
            response.sendRedirect(redirectUrl);

        };
    }

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!";

    public static String generatePassword(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < length; i++) {
            int index = random.nextInt(CHARACTERS.length());
            password.append(CHARACTERS.charAt(index));
        }

        return password.toString();
    }
   
    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
    
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userInfoService);
        provider.setPasswordEncoder(passwordEncoder);  // ✅ Corrected reference
        return new ProviderManager(provider);
    }



}
