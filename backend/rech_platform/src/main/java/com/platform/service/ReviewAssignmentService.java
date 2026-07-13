package com.platform.service;

import com.platform.dto.request.SubmitReviewRequest;
import com.platform.dto.request.ReviewerChatRequest;
import com.platform.dto.response.AssignmentResponse;
import com.platform.dto.response.PaperReviewAssignmentRowResponse;
import com.platform.dto.response.PaperReviewGroupResponse;
import com.platform.dto.response.PaperReviewerWorkflowResponse;
import com.platform.dto.response.PaperPreviewResponse;
import com.platform.dto.response.PaperResponse;
import com.platform.dto.response.PlagiarismResult;
import com.platform.dto.response.ReviewerChatResponse;
import com.platform.dto.response.ReviewerSuggestionResponse;
import com.platform.dto.response.ReviewResponse;
import com.platform.dto.response.SummaryResponse;
import com.platform.service.AiService;
import com.platform.entity.Paper;
import com.platform.entity.PaperAssignment;
import com.platform.entity.Review;
import com.platform.entity.User;
import com.platform.exception.BadRequestException;
import com.platform.exception.ResourceNotFoundException;
import com.platform.repository.AssignmentRepository;
import com.platform.repository.PaperAssignmentRepository;
import com.platform.repository.PaperRepository;
import com.platform.repository.ReviewRepository;
import com.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.Map.Entry;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewAssignmentService {

    private static final double PLAGIARISM_FLAG_THRESHOLD = 0.4;

    private final RestTemplate restTemplate;
    private final PaperRepository paperRepository;
    private final PaperAssignmentRepository paperAssignmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AiService aiService;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${ai-service.url:http://localhost:11434}")
    private String aiServiceUrl;

    @Transactional(readOnly = true)
    public List<PaperResponse> getAssignedPapers(Long reviewerId) {
        return paperAssignmentRepository.findByReviewerIdOrderByAssignedAtDesc(reviewerId)
                .stream()
                .map(this::toAssignedPaperResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(Long paperId, Long reviewerId) {
        Review review = reviewRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        return ReviewResponse.from(review);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForPaper(Long paperId) {
        return paperAssignmentRepository.findByPaperId(paperId)
                .stream()
                .map(AssignmentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewerSuggestionResponse> suggestReviewers(Long paperId) {
        Paper paper = getPaperOrThrow(paperId);
        if (paper.getStatus() == Paper.Status.DRAFT || paper.getStatus() == Paper.Status.PORTFOLIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paper must be submitted before reviewer suggestion");
        }

        List<User> eligibleReviewers = userRepository.findByRoleAndStatus(User.Role.CHECKER, User.Status.ACTIVE);
        List<Map<String, Object>> rankedCandidates = fetchAiCandidates(paper);
        if (rankedCandidates.isEmpty()) {
            rankedCandidates = buildManualCandidatesList(paper, eligibleReviewers);
        }

        Set<Long> alreadyAssignedReviewerIds = paperAssignmentRepository.findByPaperId(paperId)
                .stream()
                .map(assignment -> assignment.getReviewer().getId())
                .collect(Collectors.toSet());

        Map<Long, User> reviewerById = eligibleReviewers.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        List<ReviewerSuggestionResponse> suggestions = rankedCandidates.stream()
                .map(candidate -> toReviewerSuggestion(candidate, reviewerById.get(toLong(candidate.get("reviewer_id"))), paper))
                .filter(Objects::nonNull)
                .filter(suggestion -> !alreadyAssignedReviewerIds.contains(suggestion.getCheckerId()))
                .limit(10)
                .collect(Collectors.toList());

        if (suggestions.isEmpty() && !rankedCandidates.isEmpty()) {
            rankedCandidates = buildManualCandidatesList(paper, eligibleReviewers);
            suggestions = rankedCandidates.stream()
                    .map(candidate -> toReviewerSuggestion(candidate, reviewerById.get(toLong(candidate.get("reviewer_id"))), paper))
                    .filter(Objects::nonNull)
                    .filter(suggestion -> !alreadyAssignedReviewerIds.contains(suggestion.getCheckerId()))
                    .limit(10)
                    .collect(Collectors.toList());
        }

        return suggestions;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllSubmittedReviews() {
        return reviewRepository.findBySubmittedAtIsNotNullOrderBySubmittedAtDesc()
                .stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getSubmittedReviewsForPaper(Long paperId) {
        return reviewRepository.findByPaperIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(paperId)
                .stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaperReviewGroupResponse> getGroupedPaperReviews() {
        List<PaperReviewAssignmentRowResponse> rows = paperAssignmentRepository.findGroupedReviewRows();
        if (rows.isEmpty()) {
            return List.of();
        }

        return rows.stream()
                .collect(Collectors.groupingBy(PaperReviewAssignmentRowResponse::paperId, Collectors.toList()))
                .entrySet().stream()
                .map(this::toPaperReviewGroupResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaperPreviewResponse getInvitedPaperPreview(Long paperId, Long reviewerId) {
        PaperAssignment assignment = paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer"));

        if (!List.of("PENDING", "IN_REVIEW").contains(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This invitation is no longer available");
        }

        PaperPreviewResponse response = PaperPreviewResponse.from(getPaperOrThrow(paperId));
        response.setAssignmentStatus(assignment.getStatus());
        response.setAssignmentType(assignment.getAssignmentType());
        response.setAssignedAt(assignment.getAssignedAt());
        return response;
    }

    @Transactional
    public AssignmentResponse acceptInvitation(Long paperId, Long reviewerId) {
        PaperAssignment assignment = paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer"));

        if (!List.of("PENDING").contains(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation cannot be accepted in its current state");
        }

        assignment.setStatus("IN_REVIEW");
        PaperAssignment saved = paperAssignmentRepository.save(assignment);
        return AssignmentResponse.from(saved);
    }

    @Transactional
    public AssignmentResponse declineInvitation(Long paperId, Long reviewerId, String reason) {
        PaperAssignment assignment = paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer"));

        if (!List.of("PENDING").contains(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation cannot be declined in its current state");
        }

        assignment.setStatus("DECLINED");
        PaperAssignment saved = paperAssignmentRepository.save(assignment);

        List<User> admins = userRepository.findByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    "Reviewer declined invitation",
                    "Reviewer " + saved.getReviewer().getName() + " declined the invitation for paper '" + safeTitle(saved.getPaper()) + "'.",
                    "ASSIGNMENT_DECLINED",
                    saved.getPaper().getId()
            );
        }

        return AssignmentResponse.from(saved);
    }

    @Transactional
    public AssignmentResponse autoAssignReviewer(Long paperId, Long assignedById) {
        Paper paper = getPaperOrThrow(paperId);
        User assignedBy = getUserOrThrow(assignedById);

        List<Map<String, Object>> rankedCandidates = fetchAiCandidates(paper);
        Set<Long> alreadyAssignedReviewerIds = paperAssignmentRepository.findByPaperId(paperId)
                .stream()
                .map(assignment -> assignment.getReviewer().getId())
                .collect(Collectors.toSet());

        List<User> eligibleReviewers = userRepository.findByRoleAndStatus(User.Role.CHECKER, User.Status.ACTIVE);

        User selectedReviewer = null;
        for (Map<String, Object> candidate : rankedCandidates) {
            Long reviewerId = toLong(candidate.get("reviewer_id"));
            if (reviewerId == null || alreadyAssignedReviewerIds.contains(reviewerId)) {
                continue;
            }

            User candidateUser = eligibleReviewers.stream()
                    .filter(user -> Objects.equals(user.getId(), reviewerId))
                    .findFirst()
                    .orElse(null);

            if (candidateUser != null) {
                selectedReviewer = candidateUser;
                break;
            }
        }

        if (selectedReviewer == null) {
            throw new BadRequestException("No eligible active CHECKER reviewer was found in AI search results");
        }

        PaperAssignment assignment = PaperAssignment.builder()
                .paper(paper)
                .reviewer(selectedReviewer)
                .assignedBy(assignedBy)
                .assignmentType("AUTO")
                .status("PENDING")
                .build();

        PaperAssignment saved = paperAssignmentRepository.save(assignment);
        sendAssignmentInvitation(saved);
        paper.setStatus(Paper.Status.UNDER_REVIEW);
        paperRepository.save(paper);

        return AssignmentResponse.from(saved);
    }

    @Transactional
    public List<AssignmentResponse> autoAssignReviewers(Long paperId, Long assignedById, int desiredCount) {
        desiredCount = 3;

        Paper paper = getPaperOrThrow(paperId);
        User assignedBy = getUserOrThrow(assignedById);

        // Try to get AI-ranked candidates first
        List<Map<String, Object>> rankedCandidates = fetchAiCandidates(paper);
        
        Set<Long> alreadyAssignedReviewerIds = paperAssignmentRepository.findByPaperId(paperId)
                .stream()
                .map(assignment -> assignment.getReviewer().getId())
                .collect(Collectors.toSet());

        List<User> eligibleReviewers = userRepository.findByRoleAndStatus(User.Role.CHECKER, User.Status.ACTIVE);
        
        // FALLBACK: If AI search returns no candidates, use all available reviewers with expertise matching
        if (rankedCandidates.isEmpty() || rankedCandidates.size() == 0) {
            rankedCandidates = buildManualCandidatesList(paper, eligibleReviewers);
        }

        List<AssignmentResponse> created = new ArrayList<>();

        for (Map<String, Object> candidate : rankedCandidates) {
            if (created.size() >= desiredCount) break;
            Long reviewerId = toLong(candidate.get("reviewer_id"));
            if (reviewerId == null || alreadyAssignedReviewerIds.contains(reviewerId)) {
                continue;
            }

            User candidateUser = eligibleReviewers.stream()
                    .filter(user -> Objects.equals(user.getId(), reviewerId))
                    .findFirst()
                    .orElse(null);

            if (candidateUser != null) {
                PaperAssignment assignment = PaperAssignment.builder()
                        .paper(paper)
                        .reviewer(candidateUser)
                        .assignedBy(assignedBy)
                        .assignmentType("AUTO")
                        .status("PENDING")
                        .build();
                PaperAssignment saved = paperAssignmentRepository.save(assignment);
                created.add(AssignmentResponse.from(saved));
                alreadyAssignedReviewerIds.add(candidateUser.getId());
                sendAssignmentInvitation(saved);
            }
        }

        if (!created.isEmpty()) {
            paper.setStatus(Paper.Status.UNDER_REVIEW);
            paperRepository.save(paper);
        }

        return created;
    }

    @Transactional
    public AssignmentResponse manualAssignReviewer(Long paperId, Long reviewerId, Long assignedById) {
        Paper paper = getPaperOrThrow(paperId);
        User reviewer = getEligibleReviewerOrThrow(reviewerId);
        User assignedBy = getUserOrThrow(assignedById);

        if (paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewerId).isPresent()) {
            throw new BadRequestException("This reviewer is already assigned to the paper");
        }

        long currentAssigned = activeAssignmentCount(paperId);
        if (currentAssigned >= 3) {
            throw new BadRequestException("Cannot assign more than 3 reviewers to a paper");
        }

        PaperAssignment assignment = PaperAssignment.builder()
                .paper(paper)
                .reviewer(reviewer)
                .assignedBy(assignedBy)
                .assignmentType("MANUAL")
                .status("PENDING")
                .build();

        PaperAssignment saved = paperAssignmentRepository.save(assignment);
        sendAssignmentInvitation(saved);
        paper.setStatus(Paper.Status.UNDER_REVIEW);
        paperRepository.save(paper);

        return AssignmentResponse.from(saved);
    }

    @Transactional
    public List<AssignmentResponse> bulkAssignReviewers(Long paperId, Long assignedById, List<Long> reviewerIds) {
        Paper paper = getPaperOrThrow(paperId);
        User assignedBy = getUserOrThrow(assignedById);

        if (reviewerIds == null || reviewerIds.isEmpty()) {
            throw new BadRequestException("At least one reviewer must be selected");
        }

        long currentAssigned = activeAssignmentCount(paperId);
        if (currentAssigned + reviewerIds.size() > 3) {
            throw new BadRequestException("Cannot assign more than 3 reviewers total to a paper");
        }

        Set<Long> alreadyAssignedIds = paperAssignmentRepository.findByPaperId(paperId).stream()
                .map(a -> a.getReviewer().getId())
                .collect(Collectors.toSet());

        List<AssignmentResponse> created = new ArrayList<>();

        for (Long reviewerId : reviewerIds) {
            if (alreadyAssignedIds.contains(reviewerId)) {
                continue; // Skip already assigned reviewers
            }

            User reviewer = getEligibleReviewerOrThrow(reviewerId);

            PaperAssignment assignment = PaperAssignment.builder()
                    .paper(paper)
                    .reviewer(reviewer)
                    .assignedBy(assignedBy)
                    .assignmentType("MANUAL")
                    .status("PENDING")
                    .build();

            PaperAssignment saved = paperAssignmentRepository.save(assignment);
            created.add(AssignmentResponse.from(saved));
            sendAssignmentInvitation(saved);
        }

        if (!created.isEmpty()) {
            paper.setStatus(Paper.Status.UNDER_REVIEW);
            paperRepository.save(paper);
        }

        return created;
    }

    private long activeAssignmentCount(Long paperId) {
        return paperAssignmentRepository.findByPaperId(paperId)
                .stream()
                .filter(assignment -> !"DECLINED".equals(assignment.getStatus()))
                .count();
    }

    @Transactional
    public ReviewResponse submitReview(Long paperId, Long reviewerId, SubmitReviewRequest req, MultipartFile reviewFile) {
        validateScore("overallScore", req.getOverallScore());
        validateScore("originalityScore", req.getOriginalityScore());
        validateScore("clarityScore", req.getClarityScore());
        validateScore("methodologyScore", req.getMethodologyScore());

        Paper paper = getPaperOrThrow(paperId);
        PaperAssignment assignment = paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer"));

        if (!"IN_REVIEW".equals(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation must be accepted before submitting a review");
        }

        User reviewer = getUserOrThrow(reviewerId);
        Review review = reviewRepository.findByPaperIdAndReviewerId(paperId, reviewerId)
                .orElseGet(Review::new);

        review.setPaper(paper);
        review.setReviewer(reviewer);
        review.setAssignment(assignment);
        review.setOverallScore(req.getOverallScore());
        review.setOriginalityScore(req.getOriginalityScore());
        review.setClarityScore(req.getClarityScore());
        review.setMethodologyScore(req.getMethodologyScore());
        review.setComments(normalizeNullableText(req.getComments()));
        if (reviewFile != null && !reviewFile.isEmpty()) {
            String reviewFileName = reviewFile.getOriginalFilename() == null ? "review.pdf" : reviewFile.getOriginalFilename();
            String reviewObjectName = "reviews/" + paperId + "/" + reviewerId + "/" + System.currentTimeMillis() + "-" + sanitizeFilename(reviewFileName);
            review.setReviewFileUrl(fileStorageService.store(reviewFile, reviewObjectName));
            review.setReviewFileName(reviewFileName);
            review.setReviewFileSize(reviewFile.getSize());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review PDF file is required");
        }

        String normalizedDecision = normalizeDecision(req.getDecision());
        review.setDecision(normalizedDecision);
        review.setSubmittedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        assignment.setStatus("SUBMITTED");
        paperAssignmentRepository.save(assignment);

        finalizeReviewCycleIfComplete(paper);

        return ReviewResponse.from(saved);
    }

    @Transactional
    public PaperResponse finalizePaperDecision(Long paperId, Long adminId, String decision) {
        Paper paper = getPaperOrThrow(paperId);
        User admin = getUserOrThrow(adminId);
        if (admin.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can issue the final decision");
        }

        Paper.Status finalStatus = normalizeFinalDecision(decision);
        if (paper.getStatus() == Paper.Status.ACCEPTED
                || paper.getStatus() == Paper.Status.REJECTED
                || paper.getStatus() == Paper.Status.REVISION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This paper already has a final decision");
        }

        List<Review> submittedReviews = reviewRepository.findByPaperIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(paperId);
        if (submittedReviews.size() != 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exactly 3 completed reviewer submissions are required before issuing a final decision");
        }

        String finalConsensusEntry = buildFinalConsensusEntry(paper, finalStatus, submittedReviews);
        paper.setStatus(finalStatus);
        paper.setReviewConsensusSummary(finalConsensusEntry);
        paper.setReviewsConsensusSentAt(LocalDateTime.now());
        Paper savedPaper = paperRepository.save(paper);

        String subject = "Final decision: " + safeTitle(savedPaper);
        String body = buildFinalDecisionMessage(savedPaper, finalStatus, submittedReviews);

        if (savedPaper.getSubmittedBy() != null && savedPaper.getSubmittedBy().getEmail() != null && !savedPaper.getSubmittedBy().getEmail().isBlank()) {
            notificationService.createNotification(
                    savedPaper.getSubmittedBy().getId(),
                    "Final decision issued",
                    body,
                    "PAPER_FINAL_DECISION",
                    savedPaper.getId()
            );
            emailService.sendText(savedPaper.getSubmittedBy().getEmail(), subject, body);
        }

        if (savedPaper.getCorrespondingAuthorEmail() != null
                && !savedPaper.getCorrespondingAuthorEmail().isBlank()
                && (savedPaper.getSubmittedBy() == null || !savedPaper.getCorrespondingAuthorEmail().equalsIgnoreCase(savedPaper.getSubmittedBy().getEmail()))) {
            emailService.sendText(savedPaper.getCorrespondingAuthorEmail(), subject, body);
        }

        return PaperResponse.from(savedPaper);
    }

    @Transactional
    public PlagiarismResult computePlagiarismScore(Long paperId) {
        Paper paper = getPaperOrThrow(paperId);
        User reviewer = getCurrentAuthenticatedUser();

        if (paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewer.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("query", buildSimilarityQuery(paper));
        payload.put("topK", 5);

        try {
            Object response = restTemplate.postForObject(aiServiceUrl + "/search", payload, Object.class);
            List<Map<String, Object>> matches = normalizeSearchResult(response);

            if (matches.isEmpty()) {
                PlagiarismResult result = new PlagiarismResult(null, null, 0.0, false);
                saveDraftPlagiarismIfReviewExists(paperId, reviewer.getId(), result.getSimilarityScore());
                return result;
            }

            Map<String, Object> top = matches.stream()
                    .filter(item -> !Objects.equals(toLong(item.get("paperId")), paperId))
                    .findFirst()
                    .orElse(matches.get(0));

            Long similarPaperId = toLong(top.get("paperId"));
            String similarPaperTitle = top.get("title") == null ? null : String.valueOf(top.get("title"));
            Double similarity = toDouble(top.get("similarity"));
            if (similarity == null) {
                similarity = 0.0;
            }
            boolean flagged = similarity > PLAGIARISM_FLAG_THRESHOLD;

            saveDraftPlagiarismIfReviewExists(paperId, reviewer.getId(), similarity);
            return new PlagiarismResult(similarPaperId, similarPaperTitle, similarity, flagged);

        } catch (RestClientException ex) {
            log.warn("Plagiarism service unreachable for paper {}: {}", paperId, ex.getMessage());
            return new PlagiarismResult(null, null, null, false);
        }
    }

    private String buildSimilarityQuery(Paper paper) {
        String title = paper.getTitle() == null ? "" : paper.getTitle();
        String abstrakt = paper.getAbstrakt() == null ? "" : paper.getAbstrakt();
        String keywords = paper.getKeywords() == null ? "" : String.join(" ", paper.getKeywords());
        return (title + ". " + abstrakt + ". " + keywords).trim();
    }

    @Transactional
    public SummaryResponse generateAiSummary(Long paperId) {
        Paper paper = getPaperOrThrow(paperId);
        User reviewer = getCurrentAuthenticatedUser();

        PaperAssignment assignment = paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer"));

        String summary = fetchAiSummary(paper);

        Review review = reviewRepository.findByPaperIdAndReviewerId(paperId, reviewer.getId())
                .orElseGet(Review::new);

        review.setPaper(paper);
        review.setReviewer(reviewer);
        review.setAssignment(assignment);
        review.setAiSummary(summary);

        reviewRepository.save(review);
        return new SummaryResponse(summary);
    }

    @Transactional
    public ReviewerChatResponse chatAboutPaper(Long paperId, Long reviewerId, ReviewerChatRequest request) {
        Paper paper = getPaperOrThrow(paperId);
        User reviewer = getUserOrThrow(reviewerId);

        if (paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, reviewer.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Paper is not assigned to this reviewer");
        }

        String query = request.getQuery() == null ? "" : request.getQuery().trim();
        if (query.isBlank()) {
            throw new BadRequestException("query is required");
        }

        ReviewerChatResponse response = aiService.chatAboutPaper(query, paper, request.getTopK());
        
        // Chat responses should NEVER include sources - answer is based ONLY on current paper
        response.setSources(new ArrayList<>());
        
        if (response.getAnswer() == null) {
            response.setAnswer("");
        }
        return response;
    }

    private void saveDraftPlagiarismIfReviewExists(Long paperId, Long reviewerId, Double score) {
        reviewRepository.findByPaperIdAndReviewerId(paperId, reviewerId).ifPresent(review -> {
            review.setPlagiarismScore(score);
            reviewRepository.save(review);
        });
    }

    private List<Map<String, Object>> normalizeSearchResult(Object response) {
        if (response instanceof List<?> rawList) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> normalized = new HashMap<>();
                    map.forEach((k, v) -> normalized.put(String.valueOf(k), v));
                    result.add(normalized);
                }
            }
            return result;
        }

        if (response instanceof Map<?, ?> map) {
            Object rawResults = map.get("results");
            if (rawResults instanceof List<?> resultsList) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Object item : resultsList) {
                    if (item instanceof Map<?, ?> hit) {
                        Map<String, Object> normalized = new HashMap<>();
                        hit.forEach((k, v) -> normalized.put(String.valueOf(k), v));
                        if (normalized.containsKey("paperId") && !normalized.containsKey("paper_id")) {
                            normalized.put("paper_id", normalized.get("paperId"));
                        }
                        if (normalized.containsKey("similarity") && !normalized.containsKey("similarity_score")) {
                            normalized.put("similarity_score", normalized.get("similarity"));
                        }
                        result.add(normalized);
                    }
                }
                return result;
            }
        }

        return List.of();
    }

    private void validateScore(String fieldName, Integer value) {
        if (value == null || value < 1 || value > 10) {
            throw new BadRequestException(fieldName + " must be between 1 and 10");
        }
    }

    private String normalizeDecision(String decision) {
        if (decision == null || decision.isBlank()) {
            throw new BadRequestException("decision is required (STRONG_ACCEPT, WEAK_ACCEPT, WEAK_REJECT, STRONG_REJECT)");
        }
        String normalized = decision.trim().toUpperCase();
        if (!normalized.equals("STRONG_ACCEPT") && !normalized.equals("WEAK_ACCEPT")
                && !normalized.equals("WEAK_REJECT") && !normalized.equals("STRONG_REJECT")) {
            throw new BadRequestException("Invalid decision. Allowed values: STRONG_ACCEPT, WEAK_ACCEPT, WEAK_REJECT, STRONG_REJECT");
        }
        return normalized;
    }

    private Paper.Status mapDecisionToPaperStatus(String decision) {
        return switch (decision) {
            case "STRONG_ACCEPT", "WEAK_ACCEPT" -> Paper.Status.ACCEPTED;
            case "WEAK_REJECT", "STRONG_REJECT" -> Paper.Status.REJECTED;
            default -> throw new BadRequestException("Invalid decision: " + decision);
        };
    }

    private List<Map<String, Object>> fetchAiCandidates(Paper paper) {
        String query = buildQuery(paper);
        Map<String, Object> payload = new HashMap<>();
        payload.put("query", query);
        payload.put("top_k", 5);

        try {
            Object response = restTemplate.postForObject(aiServiceUrl + "/search", payload, Object.class);
            if (response instanceof List<?> list) {
                List<Map<String, Object>> candidates = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Map<String, Object> normalized = new HashMap<>();
                        map.forEach((key, value) -> normalized.put(String.valueOf(key), value));
                        candidates.add(normalized);
                    }
                }
                return candidates;
            }
            return List.of();
        } catch (RestClientException ex) {
            // Silently return empty on AI service failure - will trigger fallback
            return List.of();
        }
    }

    private List<Map<String, Object>> buildManualCandidatesList(Paper paper, List<User> eligibleReviewers) {
        // Build a list of candidates based on expertise matching with paper keywords
        Set<String> paperKeywords = (paper.getKeywords() == null ? List.<String>of() : paper.getKeywords()).stream()
                .map(k -> k == null ? "" : k.trim().toLowerCase(Locale.ROOT))
                .filter(k -> !k.isBlank())
                .collect(Collectors.toSet());

        List<Map<String, Object>> candidates = new ArrayList<>();

        for (User checker : eligibleReviewers) {
            List<String> expertise = checker.getExpertise() == null ? List.of() : checker.getExpertise();
            List<String> matched = expertise.stream()
                    .map(item -> item == null ? "" : item.trim().toLowerCase(Locale.ROOT))
                    .filter(item -> !item.isBlank() && paperKeywords.contains(item))
                    .distinct()
                    .collect(Collectors.toList());

            long activeAssignments = assignmentRepository.countByCheckerIdAndStatus(checker.getId(), "ACTIVE");
            int matchScore = matched.size();

            Map<String, Object> candidate = new HashMap<>();
            candidate.put("reviewer_id", checker.getId());
            candidate.put("reviewer_name", checker.getName());
            candidate.put("match_score", matchScore);
            candidate.put("active_assignments", activeAssignments);
            candidates.add(candidate);
        }

        // Sort by: match score (descending), then active assignments (ascending), then name (ascending)
        candidates.sort((c1, c2) -> {
            int score1 = (Integer) c1.get("match_score");
            int score2 = (Integer) c2.get("match_score");
            if (score2 != score1) {
                return Integer.compare(score2, score1); // Higher match score first
            }
            long assign1 = (Long) c1.get("active_assignments");
            long assign2 = (Long) c2.get("active_assignments");
            if (assign1 != assign2) {
                return Long.compare(assign1, assign2); // Lower workload first
            }
            String name1 = (String) c1.get("reviewer_name");
            String name2 = (String) c2.get("reviewer_name");
            return name1.compareToIgnoreCase(name2); // Alphabetical order
        });

        return candidates;
    }

    private ReviewerSuggestionResponse toReviewerSuggestion(Map<String, Object> candidate, User reviewer, Paper paper) {
        if (reviewer == null) {
            return null;
        }

        List<String> expertise = reviewer.getExpertise() == null ? List.of() : reviewer.getExpertise();
        List<String> matchedExpertise = findMatchedExpertise(paper, expertise);
        Integer rawMatchScore = toInteger(candidate.get("match_score"));
        int matchScore = rawMatchScore == null ? matchedExpertise.size() : rawMatchScore;
        Long rawActiveAssignments = toLong(candidate.get("active_assignments"));
        long activeAssignments = rawActiveAssignments == null
                ? assignmentRepository.countByCheckerIdAndStatus(reviewer.getId(), "ACTIVE")
                : rawActiveAssignments;

        return ReviewerSuggestionResponse.builder()
                .checkerId(reviewer.getId())
                .checkerName(reviewer.getName())
                .expertise(expertise)
                .matchedExpertise(matchedExpertise)
                .activeAssignments(activeAssignments)
                .matchScore(matchScore)
                .build();
    }

    private List<String> findMatchedExpertise(Paper paper, List<String> expertise) {
        Set<String> paperKeywords = (paper.getKeywords() == null ? List.<String>of() : paper.getKeywords()).stream()
                .map(k -> k == null ? "" : k.trim().toLowerCase(Locale.ROOT))
                .filter(k -> !k.isBlank())
                .collect(Collectors.toSet());

        return expertise.stream()
                .filter(item -> item != null && paperKeywords.contains(item.trim().toLowerCase(Locale.ROOT)))
                .distinct()
                .collect(Collectors.toList());
    }

    private String fetchAiSummary(Paper paper) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("paper_id", paper.getId());
        payload.put("title", paper.getTitle() == null ? "" : paper.getTitle());
        payload.put("abstract", paper.getAbstrakt() == null ? "" : paper.getAbstrakt());
        payload.put("content", "");

        try {
            Object response = restTemplate.postForObject(aiServiceUrl + "/summarize", payload, Object.class);
            if (response instanceof Map<?, ?> map) {
                Object summary = map.get("summary");
                if (summary instanceof String summaryText) {
                    String normalized = summaryText.trim();
                    if (!normalized.isBlank()) {
                        return normalized;
                    }
                }
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI summary service returned an empty summary"
            );
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI summary service is unreachable. Please ensure http://localhost:8000 is running.",
                    ex
            );
        }
    }

    private String buildQuery(Paper paper) {
        String title = paper.getTitle() == null ? "" : paper.getTitle();
        String abstrakt = paper.getAbstrakt() == null ? "" : paper.getAbstrakt();
        return (title + "\n" + abstrakt).trim();
    }

    private void sendAssignmentInvitation(PaperAssignment assignment) {
        Paper paper = assignment.getPaper();
        User reviewer = assignment.getReviewer();
        if (paper == null || reviewer == null) {
            return;
        }

        String link = frontendUrl + "/reviewer/my-reviews";
        String subject = "Review invitation: " + safeTitle(paper);
        String reviewerName = reviewer.getName() == null || reviewer.getName().isBlank() ? "Reviewer" : reviewer.getName();
        String body = "Dear " + reviewerName + ",\n\n"
                + "You are invited as a reviewer for the paper \"" + safeTitle(paper) + "\".\n\n"
                + "Open your reviewer workspace to review the paper metadata, then accept or decline the invitation:\n"
                + link + "\n\n"
                + "If you accept, the paper will move into your active review queue so you can download the PDF and submit your review.\n"
                + "If you decline, the admin will be notified and can assign another reviewer.\n\n"
                + "Please do not reply to this email as it was generated from an email account that is not monitored.\n\n"
                + "Thanks,\nIntellectaReview team";
        emailService.sendText(reviewer.getEmail(), subject, body);
    }

    private void finalizeReviewCycleIfComplete(Paper paper) {
        if (paper == null || paper.getStatus() != Paper.Status.UNDER_REVIEW) {
            return;
        }

        List<PaperAssignment> assignments = paperAssignmentRepository.findByPaperId(paper.getId());
        if (assignments.size() != 3) {
            return;
        }

        List<Review> submittedReviews = reviewRepository.findByPaperIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(paper.getId());
        if (submittedReviews.size() != 3 || submittedReviews.stream().anyMatch(review -> review.getSubmittedAt() == null)) {
            return;
        }

        String consensusEntry = buildPendingConsensusEntry(paper, submittedReviews);
        if (Objects.equals(consensusEntry, paper.getReviewConsensusSummary())) {
            return;
        }

        paper.setReviewConsensusSummary(consensusEntry);
        paperRepository.save(paper);

        String adminMessage = buildDecisionReadyMessage(paper, submittedReviews);

        List<User> admins = userRepository.findByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    "Final decision required",
                    adminMessage,
                    "PAPER_REVIEW_READY_FOR_DECISION",
                    paper.getId()
            );
            if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                emailService.sendText(admin.getEmail(), "Final decision required: " + safeTitle(paper), adminMessage);
            }
        }
    }

    private PaperReviewGroupResponse toPaperReviewGroupResponse(Entry<Long, List<PaperReviewAssignmentRowResponse>> entry) {
        List<PaperReviewAssignmentRowResponse> rows = entry.getValue();
        PaperReviewAssignmentRowResponse firstRow = rows.get(0);
        List<PaperReviewerWorkflowResponse> reviewerAllocations = rows.stream()
                .map(row -> PaperReviewerWorkflowResponse.builder()
                        .assignmentId(row.assignmentId())
                        .reviewerId(row.reviewerId())
                        .reviewerName(row.reviewerName())
                        .reviewerEmail(row.reviewerEmail())
                        .assignmentStatus(row.assignmentStatus())
                        .assignmentType(row.assignmentType())
                        .assignedAt(row.assignedAt())
                        .reviewId(row.reviewId())
                        .decision(row.decision())
                        .comments(row.comments())
                        .overallScore(row.overallScore())
                        .originalityScore(row.originalityScore())
                        .clarityScore(row.clarityScore())
                        .methodologyScore(row.methodologyScore())
                        .submittedAt(row.submittedAt())
                        .reviewFileUrl(row.reviewFileUrl())
                        .reviewFileName(row.reviewFileName())
                        .build())
                .collect(Collectors.toList());
        return PaperReviewGroupResponse.from(firstRow, reviewerAllocations);
    }

    private String safeTitle(Paper paper) {
        return paper.getTitle() == null || paper.getTitle().isBlank() ? paper.getFileName() : paper.getTitle();
    }

    private String buildPendingConsensusEntry(Paper paper, List<Review> submittedReviews) {
        StringBuilder body = new StringBuilder();
        body.append("Review consensus ready for paper '").append(safeTitle(paper)).append("'.\n\n");
        body.append("Reviewer decisions and feedback:\n");
        for (Review review : submittedReviews) {
            body.append("- ")
                    .append(review.getReviewer() == null ? "Reviewer" : review.getReviewer().getName())
                    .append(" [")
                    .append(review.getDecision() == null ? "N/A" : review.getDecision())
                    .append("]");
            if (review.getComments() != null && !review.getComments().isBlank()) {
                body.append(": ").append(review.getComments().trim());
            }
            body.append('\n');
        }
        body.append("\nAwaiting admin final decision.");
        return body.toString();
    }

    private String buildDecisionReadyMessage(Paper paper, List<Review> submittedReviews) {
        return buildPendingConsensusEntry(paper, submittedReviews);
    }

    private String buildFinalConsensusEntry(Paper paper, Paper.Status finalStatus, List<Review> submittedReviews) {
        StringBuilder body = new StringBuilder();
        body.append("Final decision: ").append(finalStatus.name()).append("\n\n");
        body.append("Consolidated reviewer notes:\n");
        for (Review review : submittedReviews) {
            body.append("- ")
                    .append(review.getReviewer() == null ? "Reviewer" : review.getReviewer().getName())
                    .append(" [")
                    .append(review.getDecision() == null ? "N/A" : review.getDecision())
                    .append("]");
            if (review.getComments() != null && !review.getComments().isBlank()) {
                body.append(": ").append(review.getComments().trim());
            }
            body.append('\n');
        }
        return body.toString();
    }

    private String buildFinalDecisionMessage(Paper paper, Paper.Status finalStatus, List<Review> submittedReviews) {
        StringBuilder body = new StringBuilder();
        body.append("The final decision for paper '").append(safeTitle(paper)).append("' is ").append(finalStatus.name()).append(".\n\n");
        body.append("Reviewer notes:\n");
        for (Review review : submittedReviews) {
            body.append("- ")
                    .append(review.getReviewer() == null ? "Reviewer" : review.getReviewer().getName())
                    .append(" [")
                    .append(review.getDecision() == null ? "N/A" : review.getDecision())
                    .append("]");
            if (review.getComments() != null && !review.getComments().isBlank()) {
                body.append(": ").append(review.getComments().trim());
            }
            body.append('\n');
        }
        body.append("\nThe final consensus entry is now available in your platform profile.");
        return body.toString();
    }

    private Paper.Status normalizeFinalDecision(String decision) {
        if (decision == null || decision.isBlank()) {
            throw new BadRequestException("decision is required");
        }

        try {
            Paper.Status status = Paper.Status.valueOf(decision.trim().toUpperCase(Locale.ROOT));
            if (status != Paper.Status.ACCEPTED && status != Paper.Status.REJECTED && status != Paper.Status.REVISION) {
                throw new BadRequestException("Final decision must be ACCEPTED, REJECTED, or REVISION");
            }
            return status;
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Final decision must be ACCEPTED, REJECTED, or REVISION");
        }
    }

    private Paper getPaperOrThrow(Long paperId) {
        return paperRepository.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User getEligibleReviewerOrThrow(Long reviewerId) {
        User reviewer = getUserOrThrow(reviewerId);
        if (reviewer.getRole() != User.Role.CHECKER || reviewer.getStatus() != User.Status.ACTIVE) {
            throw new BadRequestException("Reviewer must be an ACTIVE CHECKER user");
        }
        return reviewer;
    }

    private PaperResponse toAssignedPaperResponse(PaperAssignment assignment) {
        Paper paper = assignment.getPaper();
        PaperResponse response = PaperResponse.from(paper);
        response.setAssignmentStatus(assignment.getStatus());
        response.setAssignmentType(assignment.getAssignmentType());
        response.setAssignedAt(assignment.getAssignedAt());
        return response;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Long.valueOf(stringValue);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Double.valueOf(stringValue);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Integer.valueOf(stringValue);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String sanitizeFilename(String filename) {
        return filename
                .replaceAll("\\\\", "_")
                .replaceAll("/", "_")
                .replaceAll("\\s+", "_");
    }
}
