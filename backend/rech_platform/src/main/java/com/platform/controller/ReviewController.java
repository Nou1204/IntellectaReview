package com.platform.controller;

import com.platform.dto.request.AssignmentRequest;
import com.platform.dto.request.PaperFinalDecisionRequest;
import com.platform.dto.request.ReviewerChatRequest;
import com.platform.dto.request.SubmitReviewRequest;
import com.platform.dto.response.AssignmentResponse;
import com.platform.dto.response.PlagiarismResult;
import com.platform.dto.response.PaperReviewGroupResponse;
import com.platform.dto.response.PaperResponse;
import com.platform.dto.response.PaperPreviewResponse;
import com.platform.dto.response.ReviewerChatResponse;
import com.platform.dto.response.ReviewResponse;
import com.platform.dto.response.SummaryResponse;
import com.platform.dto.response.UserResponse;
import com.platform.service.ReviewAssignmentService;
import com.platform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewAssignmentService reviewAssignmentService;
    private final UserService userService;

    @GetMapping("/reviewer/papers")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<List<PaperResponse>> getAssignedPapers(Authentication authentication) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.getAssignedPapers(currentUser.getId()));
    }

    @GetMapping("/reviewer/papers/{paperId}/preview")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<PaperPreviewResponse> previewInvitation(
            @PathVariable Long paperId,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.getInvitedPaperPreview(paperId, currentUser.getId()));
    }

    @PostMapping("/reviewer/papers/{paperId}/accept")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<AssignmentResponse> acceptInvitation(
            @PathVariable Long paperId,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.acceptInvitation(paperId, currentUser.getId()));
    }

    @PostMapping("/reviewer/papers/{paperId}/decline")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<AssignmentResponse> declineInvitation(
            @PathVariable Long paperId,
            @RequestParam(required = false) String reason,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.declineInvitation(paperId, currentUser.getId(), reason));
    }

    @PostMapping(value = "/reviewer/papers/{paperId}/review", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<ReviewResponse> submitReview(
            @PathVariable Long paperId,
            @RequestParam Integer overallScore,
            @RequestParam Integer originalityScore,
            @RequestParam Integer clarityScore,
            @RequestParam Integer methodologyScore,
            @RequestParam(required = false) String comments,
            @RequestParam String decision,
            @RequestParam("reviewFile") MultipartFile reviewFile,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        SubmitReviewRequest request = new SubmitReviewRequest();
        request.setOverallScore(overallScore);
        request.setOriginalityScore(originalityScore);
        request.setClarityScore(clarityScore);
        request.setMethodologyScore(methodologyScore);
        request.setComments(comments);
        request.setDecision(decision);
        return ResponseEntity.ok(reviewAssignmentService.submitReview(paperId, currentUser.getId(), request, reviewFile));
    }

    @PostMapping("/reviewer/papers/{paperId}/plagiarism")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<PlagiarismResult> computePlagiarism(@PathVariable Long paperId) {
        return ResponseEntity.ok(reviewAssignmentService.computePlagiarismScore(paperId));
    }

    @PostMapping("/reviewer/papers/{paperId}/summary")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<SummaryResponse> generateAiSummary(@PathVariable Long paperId) {
        return ResponseEntity.ok(reviewAssignmentService.generateAiSummary(paperId));
    }

    @PostMapping("/reviewer/papers/{paperId}/chat")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<ReviewerChatResponse> chatAboutPaper(
            @PathVariable Long paperId,
            @RequestBody ReviewerChatRequest request,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.chatAboutPaper(paperId, currentUser.getId(), request));
    }

    @GetMapping("/reviewer/papers/{paperId}/review")
    @PreAuthorize("hasRole('CHECKER')")
    public ResponseEntity<ReviewResponse> getMyReview(
            @PathVariable Long paperId,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.getMyReview(paperId, currentUser.getId()));
    }

    @PostMapping("/admin/papers/{paperId}/assign/auto")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssignmentResponse> autoAssignReviewer(
            @PathVariable Long paperId,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.autoAssignReviewer(paperId, currentUser.getId()));
    }

    @PostMapping("/admin/papers/{paperId}/assign/auto-many")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AssignmentResponse>> autoAssignReviewers(
            @PathVariable Long paperId,
            @RequestParam(defaultValue = "2") int desiredCount,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.autoAssignReviewers(paperId, currentUser.getId(), desiredCount));
    }

    @PostMapping("/admin/papers/{paperId}/assign/manual")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssignmentResponse> manualAssignReviewer(
            @PathVariable Long paperId,
            @RequestBody AssignmentRequest request,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.manualAssignReviewer(paperId, request.getReviewerId(), currentUser.getId()));
    }

    @PostMapping("/admin/papers/{paperId}/assign/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AssignmentResponse>> bulkAssignReviewers(
            @PathVariable Long paperId,
            @RequestBody com.platform.dto.request.BulkAssignmentRequest request,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.bulkAssignReviewers(paperId, currentUser.getId(), request.getReviewerIds()));
    }

    @GetMapping("/admin/papers/{paperId}/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AssignmentResponse>> listAssignmentsForPaper(@PathVariable Long paperId) {
        return ResponseEntity.ok(reviewAssignmentService.getAssignmentsForPaper(paperId));
    }

    @GetMapping("/admin/reviews/submitted")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> listAllSubmittedReviews() {
        return ResponseEntity.ok(reviewAssignmentService.getAllSubmittedReviews());
    }

    @GetMapping("/admin/papers/{paperId}/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReviewResponse>> listPaperReviews(@PathVariable Long paperId) {
        return ResponseEntity.ok(reviewAssignmentService.getSubmittedReviewsForPaper(paperId));
    }

    @GetMapping("/admin/reviews/grouped")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaperReviewGroupResponse>> listGroupedPaperReviews() {
        return ResponseEntity.ok(reviewAssignmentService.getGroupedPaperReviews());
    }

    @PostMapping("/admin/papers/{paperId}/final-decision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaperResponse> finalizePaperDecision(
            @PathVariable Long paperId,
            @RequestBody PaperFinalDecisionRequest request,
            Authentication authentication
    ) {
        UserResponse currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(reviewAssignmentService.finalizePaperDecision(paperId, currentUser.getId(), request.getDecision()));
    }
}
