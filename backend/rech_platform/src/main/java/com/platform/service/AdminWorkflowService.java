package com.platform.service;

import com.platform.dto.response.AssignmentHistoryResponse;
import com.platform.dto.response.ReviewerSuggestionResponse;
import com.platform.entity.Assignment;
import com.platform.entity.Paper;
import com.platform.entity.PaperAssignment;
import com.platform.entity.User;
import com.platform.exception.ResourceNotFoundException;
import com.platform.repository.AssignmentRepository;
import com.platform.repository.PaperAssignmentRepository;
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
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminWorkflowService {

    private final PaperRepository paperRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final PaperAssignmentRepository paperAssignmentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ReviewerSuggestionResponse> suggestReviewers(Long paperId) {
        Paper paper = getPaperOrThrow(paperId);
        if (paper.getStatus() == Paper.Status.DRAFT || paper.getStatus() == Paper.Status.PORTFOLIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paper must be submitted before reviewer suggestion");
        }

        Set<String> paperKeywords = (paper.getKeywords() == null ? List.<String>of() : paper.getKeywords()).stream()
                .map(k -> k == null ? "" : k.trim().toLowerCase(Locale.ROOT))
                .filter(k -> !k.isBlank())
                .collect(Collectors.toSet());

        List<User> activeCheckers = userRepository.findByRoleAndStatus(User.Role.CHECKER, User.Status.ACTIVE);

        return activeCheckers.stream()
                .map(checker -> {
                    List<String> expertise = checker.getExpertise() == null ? List.of() : checker.getExpertise();
                    List<String> matched = expertise.stream()
                            .map(item -> item == null ? "" : item.trim().toLowerCase(Locale.ROOT))
                            .filter(item -> !item.isBlank() && paperKeywords.contains(item))
                            .distinct()
                            .collect(Collectors.toList());

                    long load = assignmentRepository.countByCheckerIdAndStatus(checker.getId(), "ACTIVE");
                    return ReviewerSuggestionResponse.builder()
                            .checkerId(checker.getId())
                            .checkerName(checker.getName())
                            .expertise(expertise)
                            .matchedExpertise(matched)
                            .activeAssignments(load)
                            .matchScore(matched.size())
                            .build();
                })
                .sorted(Comparator
                        .comparingInt(ReviewerSuggestionResponse::getMatchScore).reversed()
                        .thenComparingLong(ReviewerSuggestionResponse::getActiveAssignments)
                        .thenComparing(ReviewerSuggestionResponse::getCheckerName, String.CASE_INSENSITIVE_ORDER)
                )
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentHistoryResponse assignChecker(Long paperId, Long checkerId, Long assignedById, String notes) {
        Paper paper = getPaperOrThrow(paperId);
        User checker = getUserOrThrow(checkerId);
        User assignedBy = getUserOrThrow(assignedById);

        if (checker.getRole() != User.Role.CHECKER || checker.getStatus() != User.Status.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkerId must reference an ACTIVE CHECKER");
        }
        if (assignedBy.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can assign reviewers");
        }

        Assignment assignment = Assignment.builder()
                .paper(paper)
                .checker(checker)
                .assignedBy(assignedBy)
                .status("ACTIVE")
                .notes(normalizeNullableText(notes))
                .build();

        Assignment saved = assignmentRepository.save(assignment);

        if (paperAssignmentRepository.findByPaperIdAndReviewerId(paperId, checkerId).isEmpty()) {
            PaperAssignment paperAssignment = PaperAssignment.builder()
                    .paper(paper)
                    .reviewer(checker)
                    .assignedBy(assignedBy)
                    .assignmentType("MANUAL")
                    .status("PENDING")
                    .build();
            paperAssignmentRepository.save(paperAssignment);
        }

        paper.setStatus(Paper.Status.UNDER_REVIEW);
        paperRepository.save(paper);

        notificationService.createNotification(
                checker.getId(),
                "Paper assigned",
                "You were assigned paper '" + safeTitle(paper) + "' for review.",
                "PAPER_ASSIGNED",
                saved.getId()
        );

        if (paper.getSubmittedBy() != null) {
            notificationService.createNotification(
                    paper.getSubmittedBy().getId(),
                    "Paper assigned for review",
                    "Your paper '" + safeTitle(paper) + "' has been assigned to a checker.",
                    "PAPER_ASSIGNED",
                    saved.getId()
            );
        }

        return AssignmentHistoryResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<AssignmentHistoryResponse> listAssignments(
            String status,
            Long checkerId
    ) {
        List<Assignment> all = assignmentRepository.findAllByOrderByAssignedAtDesc();

        return all.stream()
                .filter(item -> status == null || status.isBlank() || item.getStatus().equalsIgnoreCase(status))
                .filter(item -> checkerId == null || Objects.equals(item.getChecker().getId(), checkerId))
                .map(AssignmentHistoryResponse::from)
                .collect(Collectors.toList());
    }

    private Paper getPaperOrThrow(Long paperId) {
        return paperRepository.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String safeTitle(Paper paper) {
        return paper.getTitle() == null || paper.getTitle().isBlank() ? paper.getFileName() : paper.getTitle();
    }
}
