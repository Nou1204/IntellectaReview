package com.platform.controller;

import com.platform.dto.request.AssignCheckerRequest;
import com.platform.dto.response.AssignmentHistoryResponse;
import com.platform.dto.response.PaperResponse;
import com.platform.dto.response.ReviewerSuggestionResponse;
import com.platform.dto.response.UserResponse;
import com.platform.service.AdminWorkflowService;
import com.platform.service.PaperService;
import com.platform.service.ReviewAssignmentService;
import com.platform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

	private final UserService userService;
	private final PaperService paperService;
	private final AdminWorkflowService adminWorkflowService;
	private final ReviewAssignmentService reviewAssignmentService;

	// ── User management ──────────────────────────────────────────────────────

	@GetMapping("/users")
	public ResponseEntity<List<UserResponse>> listUsers(
			@RequestParam(required = false) String role,
			@RequestParam(required = false) String status
	) {
		return ResponseEntity.ok(userService.listUsers(role, status));
	}

	@PatchMapping("/users/{userId}/status")
	public ResponseEntity<UserResponse> updateUserStatus(
			@PathVariable Long userId,
			@RequestParam("value") String value
	) {
		return ResponseEntity.ok(userService.updateUserStatus(userId, value));
	}

	@PatchMapping("/users/{userId}/role")
	public ResponseEntity<UserResponse> updateUserRole(
			@PathVariable Long userId,
			@RequestParam("value") String value
	) {
		return ResponseEntity.ok(userService.updateUserRole(userId, value));
	}

	// ── Paper management ──────────────────────────────────────────────────────

	@GetMapping("/papers")
	public ResponseEntity<List<PaperResponse>> listAllPapers(
			@RequestParam(required = false) String status
	) {
		return ResponseEntity.ok(paperService.listAllPapers(status));
	}

	@PatchMapping("/papers/{paperId}/status")
	public ResponseEntity<PaperResponse> updatePaperStatus(
			@PathVariable Long paperId,
			@RequestParam("value") String value
	) {
		return ResponseEntity.ok(paperService.updatePaperStatus(paperId, value));
	}

	@GetMapping("/papers/{paperId}/suggest-reviewers")
	public ResponseEntity<List<ReviewerSuggestionResponse>> suggestReviewers(@PathVariable Long paperId) {
		return ResponseEntity.ok(reviewAssignmentService.suggestReviewers(paperId));
	}

	@PostMapping("/papers/{paperId}/assign")
	public ResponseEntity<AssignmentHistoryResponse> assignChecker(
			@PathVariable Long paperId,
			@RequestBody AssignCheckerRequest request,
			Authentication authentication
	) {
		UserResponse currentUser = userService.getCurrentUser(authentication.getName());
		return ResponseEntity.ok(
				adminWorkflowService.assignChecker(paperId, request.getCheckerId(), currentUser.getId(), request.getNotes())
		);
	}

	@GetMapping("/reviews")
	public ResponseEntity<List<AssignmentHistoryResponse>> assignmentHistory(
			@RequestParam(required = false) String status,
			@RequestParam(required = false) Long checkerId
	) {
		return ResponseEntity.ok(adminWorkflowService.listAssignments(status, checkerId));
	}
}
