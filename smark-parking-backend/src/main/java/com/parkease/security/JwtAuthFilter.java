package com.parkease.security;




import jakarta.servlet.FilterChain;


import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


import com.parkease.services.UserInfoService;

import java.io.IOException;



@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserInfoService userDetailsService;

    // Constructor Injection (Best Practice)
    public JwtAuthFilter(JwtUtil jwtUtil, UserInfoService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // CORS is handled by SecurityConfig - no manual headers needed

        System.out.println("🔄 In JWT filter chain...");

        String token = null;

        // ✅ 1. Retrieve token from Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            System.out.println("🔐 Token from header: " + token);
        }

        // ✅ 2. If not in header, try fetching from cookies
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    System.out.println("🍪 Token from cookie: " + token);
                    break;
                }
            }
        }

        // ✅ 3. Proceed only if token is available
        if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token);
                System.out.println("👤 Username from token: " + username);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("✅ Loaded user details for: " + username);

                    // ✅ Validate token
                    if (jwtUtil.validateToken(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println("🔓 Authentication set for user: " + username);
                    } else {
                        System.out.println("❌ Invalid token for user: " + username);
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error in JWT validation: " + e.getMessage());
            }
        } else {
            System.out.println("🚫 No JWT token found in request.");
        }

        // ✅ Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}
