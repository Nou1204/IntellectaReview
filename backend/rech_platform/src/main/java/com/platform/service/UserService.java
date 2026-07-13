package com.platform.service;

import com.platform.dto.request.UpdateExpertiseRequest;
import com.platform.dto.request.UpdateProfileRequest;
import com.platform.dto.response.UserResponse;
import com.platform.dto.response.UserResponse;
import com.platform.entity.Paper;
import com.platform.entity.Paper;
import com.platform.entity.User;
import com.platform.repository.PaperRepository;
import com.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final PaperRepository paperRepository;
    
	private final NotificationService notificationService;

	@Transactional(readOnly = true)
	public UserResponse getCurrentUser(String email) {
		return UserResponse.from(getUserByEmail(email));
	}

	@Transactional
	public UserResponse updateCurrentUserProfile(String email, UpdateProfileRequest request) {
		User user = getUserByEmail(email);

		if (request.getName() != null && !request.getName().isBlank()) {
			user.setName(request.getName().trim());
		}
		if (request.getBio() != null) {
			user.setBio(normalizeNullableText(request.getBio()));
		}
		if (request.getAffiliation() != null) {
			user.setAffiliation(normalizeNullableText(request.getAffiliation()));
		}

		return UserResponse.from(userRepository.save(user));
	}

	@Transactional
	public UserResponse updateCurrentUserExpertise(String email, UpdateExpertiseRequest request) {
		User user = getUserByEmail(email);
		if (user.getRole() == User.Role.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN expertise is managed separately");
		}

		List<String> cleaned = request.getExpertise() == null
				? List.of()
				: request.getExpertise().stream()
				.map(item -> item == null ? "" : item.trim())
				.filter(item -> !item.isBlank())
				.distinct()
				.collect(Collectors.toList());

		user.setExpertise(new ArrayList<>(cleaned));
		return UserResponse.from(userRepository.save(user));
	}

	@Transactional
	public void refreshExpertise(Long userId) {
		// Manual expertise editing only; do not infer expertise from papers.
		getUserById(userId);
	}

    

	@Transactional(readOnly = true)
	public List<UserResponse> listUsers(String role, String status) {
		User.Role roleFilter = parseRoleNullable(role);
		User.Status statusFilter = parseStatusNullable(status);

		return userRepository.findAll().stream()
				.filter(user -> roleFilter == null || user.getRole() == roleFilter)
				.filter(user -> statusFilter == null || user.getStatus() == statusFilter)
				.sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
				.map(UserResponse::from)
				.collect(Collectors.toList());
	}

	@Transactional
	public UserResponse updateUserStatus(Long userId, String status) {
		User user = getUserById(userId);
		user.setStatus(parseStatus(status));
		return UserResponse.from(userRepository.save(user));
	}

	@Transactional
	public UserResponse updateUserRole(Long userId, String role) {
		User user = getUserById(userId);
		user.setRole(parseRole(role));
		return UserResponse.from(userRepository.save(user));
	}

	private User getUserByEmail(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private User getUserById(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private String normalizeNullableText(String text) {
		String normalized = text.trim();
		return normalized.isEmpty() ? null : normalized;
	}

	private User.Role parseRole(String value) {
		try {
			return User.Role.valueOf(value.trim().toUpperCase(Locale.ROOT));
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid role. Allowed values: RESEARCHER, CHECKER, ADMIN");
		}
	}

	private User.Role parseRoleNullable(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return parseRole(value);
	}

	private User.Status parseStatus(String value) {
		if (value == null || value.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Status is required. Allowed values: PENDING, ACTIVE, SUSPENDED");
		}

		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if ("ACTIVATE".equals(normalized)) {
			normalized = User.Status.ACTIVE.name();
		} else if ("SUSPEND".equals(normalized)) {
			normalized = User.Status.SUSPENDED.name();
		}

		try {
			return User.Status.valueOf(normalized);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid status. Allowed values: PENDING, ACTIVE, SUSPENDED");
		}
	}

	private User.Status parseStatusNullable(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return parseStatus(value);
	}
}
