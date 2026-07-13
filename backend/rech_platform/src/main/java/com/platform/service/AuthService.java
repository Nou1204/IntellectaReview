package com.platform.service;

import com.platform.dto.request.ForgotPasswordRequest;
import com.platform.dto.request.LoginRequest;
import com.platform.dto.request.RegisterRequest;
import com.platform.dto.request.ResetPasswordRequest;
import com.platform.dto.response.AuthResponse;
import com.platform.dto.response.UserResponse;
import com.platform.entity.PasswordResetToken;
import com.platform.entity.User;
import com.platform.repository.PasswordResetTokenRepository;
import com.platform.repository.UserRepository;
import com.platform.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Default to RESEARCHER if no role specified
        String requestedRole = request.getRole() == null
            ? User.Role.RESEARCHER.name()
            : request.getRole().trim().toUpperCase();
        
        try {
            user.setRole(User.Role.valueOf(requestedRole));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid role. Allowed roles: RESEARCHER, REVIEWER" // Fixed from CHECKER to REVIEWER
            );
        }

        user.setStatus(User.Status.PENDING);
        user.setExpertise(java.util.List.of());

        userRepository.save(user);
        return UserResponse.from(user);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (DisabledException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account pending approval");
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserResponse.from(user));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
            
            passwordResetTokenRepository.save(resetToken);

            String link = frontendUrl + "/auth/reset-password?token=" + token;
            
            // Sending email safely inside transactional boundary
            emailService.sendText(
                user.getEmail(),
                "Reset your password",
                "Use this link to reset your password: " + link + "\n\nThis link expires in 15 minutes."
            );
        });
        // Note: We deliberately don't throw an exception if user isn't found 
        // to block email enumeration security vulnerability vectors.
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Fetch Token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset token"));

        // 2. Validate Expiry / Usage Status
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is expired or already used");
        }

        // 3. Update User Password inside an active persistence context
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. Mark token as consumed
        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
    }
}