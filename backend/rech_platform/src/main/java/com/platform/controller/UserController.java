package com.platform.controller;

import com.platform.dto.request.UpdateExpertiseRequest;
import com.platform.dto.request.UpdateProfileRequest;
import com.platform.dto.response.UserResponse;
import com.platform.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/me")
	public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {
		return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
	}

	@PutMapping("/me")
	public ResponseEntity<UserResponse> updateMyProfile(
			Authentication authentication,
			@Valid @RequestBody UpdateProfileRequest request
	) {
		return ResponseEntity.ok(userService.updateCurrentUserProfile(authentication.getName(), request));
	}

	@PutMapping("/me/expertise")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<UserResponse> updateMyExpertise(
			Authentication authentication,
			@RequestBody UpdateExpertiseRequest request
	) {
		return ResponseEntity.ok(userService.updateCurrentUserExpertise(authentication.getName(), request));
	}
}
