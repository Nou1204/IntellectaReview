package com.platform.service;

import com.platform.dto.request.UpdateMetadataRequest;
import com.platform.dto.response.ExtractedMetadataResponse;
import com.platform.dto.response.PaperCommentResponse;
import com.platform.dto.response.PaperResponse;
import com.platform.dto.response.ReviewResponse;
import com.platform.entity.Assignment;
import com.platform.entity.Paper;
import com.platform.entity.PaperComment;
import com.platform.entity.Review;
import com.platform.entity.User;
import com.platform.repository.AssignmentRepository;
import com.platform.repository.PaperCommentRepository;
import com.platform.repository.PaperRepository;
import com.platform.repository.PaperAssignmentRepository;
import com.platform.repository.ReviewRepository;
import com.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.platform.exception.ResourceNotFoundException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaperService {

	private final PaperRepository paperRepository;
	private final PaperAssignmentRepository paperAssignmentRepository;
	private final AssignmentRepository assignmentRepository;
	private final PaperCommentRepository paperCommentRepository;
	private final ReviewRepository reviewRepository;
	private final UserRepository userRepository;
	private final FileStorageService fileStorageService;
	private final GrobidService grobidService;
	private final PaperIndexingService paperIndexingService;
	private final NotificationService notificationService;
	private final UserService userService;
	private final ReviewAssignmentService reviewAssignmentService;
	private final AiService aiService;

	@Transactional
	public PaperResponse uploadPaper(
			String email,
			String title,
			String abstrakt,
			String authors,
			String keywords,
			String correspondingAuthorEmail,
			MultipartFile file
	) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF file is required");
		}

		String filename = file.getOriginalFilename() == null ? "paper.pdf" : file.getOriginalFilename();
		String lowercaseName = filename.toLowerCase(Locale.ROOT);
		if (!lowercaseName.endsWith(".pdf")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF files are allowed");
		}

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN cannot upload papers");
		}

		String objectName = "papers/" + user.getId() + "/" + System.currentTimeMillis() + "-" + sanitizeFilename(filename);
		String fileUrl = fileStorageService.store(file, objectName);
		Paper.Status initialStatus = user.getRole() == User.Role.CHECKER ? Paper.Status.PORTFOLIO : Paper.Status.DRAFT;

		Paper paper = Paper.builder()
				.title(normalizeNullableText(title))
				.abstrakt(normalizeNullableText(abstrakt))
				.authors(parseCsvList(authors))
				.keywords(parseCsvList(keywords))
				.correspondingAuthorEmail(resolveCorrespondingAuthorEmail(correspondingAuthorEmail, user))
				.fileUrl(fileUrl)
				.fileName(filename)
				.fileSize(file.getSize())
				.status(initialStatus)
				.submittedBy(user)
				.build();

		Paper saved = paperRepository.save(paper);
		// Do not auto-assign or auto-refresh researcher expertise on upload.
		// Reviewers (CHECKER) upload goes to PORTFOLIO and may refresh expertise separately if desired.
		return PaperResponse.from(saved);
	}

	private void tryAssignReviewersAsync(Long paperId, Long userId) {
		try {
			new Thread(() -> {
				try {
					reviewAssignmentService.autoAssignReviewers(paperId, userId, 2);
				} catch (Exception ex) {
					log.warn("Failed to auto-assign reviewers for paper {}: {}", paperId, ex.getMessage());
				}
			}).start();
		} catch (Exception ex) {
			log.warn("Could not start reviewer assignment thread: {}", ex.getMessage());
		}
	}

	private void tryIndexPaperAsync(Long paperId) {
		try {
			new Thread(() -> {
				try {
					paperIndexingService.indexPaperAsync(paperId);
				} catch (Exception ex) {
					log.warn("Failed to index paper {}: {}", paperId, ex.getMessage());
				}
			}).start();
		} catch (Exception ex) {
			log.warn("Could not start indexing thread: {}", ex.getMessage());
		}
	}

	@Transactional(readOnly = true)
	public List<PaperResponse> listCurrentUserPapers(String email) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		return paperRepository.findBySubmittedBy(
						user,
						PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt"))
				)
				.stream()
				.map(PaperResponse::from)
				.collect(Collectors.toList());
	}

		    @Transactional(readOnly = true)
		    public List<ReviewResponse> listPaperReviews(Long paperId, String email) {
			Paper paper = paperRepository.findById(paperId)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
			User user = getUserByEmail(email);
			assertCanViewPaper(paper, user);

			return reviewRepository.findByPaperIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(paperId)
				.stream()
				.map(ReviewResponse::from)
				.collect(Collectors.toList());
		    }

	@Transactional(readOnly = true)
	public PaperResponse getPaperById(Long id, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);
		assertCanViewPaper(paper, user);
		return PaperResponse.from(paper);
	}

	@Transactional(readOnly = true)
	public List<PaperResponse> listAllPapers(String statusFilter) {
		Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt"));

		if (statusFilter != null && !statusFilter.isBlank()) {
			Paper.Status status;
			try {
				status = Paper.Status.valueOf(statusFilter.toUpperCase(Locale.ROOT));
			} catch (IllegalArgumentException e) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + statusFilter);
			}
			if (status == Paper.Status.DRAFT || status == Paper.Status.PORTFOLIO) {
				return List.of();
			}
			return paperRepository.findByStatus(status, pageable)
					.stream()
					.map(PaperResponse::from)
					.collect(Collectors.toList());
		}

			return paperRepository.findByStatusNotIn(List.of(Paper.Status.DRAFT, Paper.Status.PORTFOLIO), pageable)
				.stream()
				.map(PaperResponse::from)
				.collect(Collectors.toList());
	}

	@Transactional
	public PaperResponse updatePaperStatus(Long paperId, String newStatus) {
		Paper paper = paperRepository.findById(paperId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paper not found"));
		Paper.Status previousStatus = paper.getStatus();

		Paper.Status status;
		try {
			status = Paper.Status.valueOf(newStatus.toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + newStatus);
		}

		if (status == Paper.Status.ACCEPTED || status == Paper.Status.REJECTED || status == Paper.Status.REVISION) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Admin cannot directly accept, reject, or request revision for a paper. Reviewer decisions must drive final paper status."
			);
		}

		paper.setStatus(status);
		Paper savedPaper = paperRepository.save(paper);
		if (status == Paper.Status.ACCEPTED) {
			notificationService.createNotification(
					paper.getSubmittedBy().getId(),
					"Paper accepted",
					"Your paper '" + safeTitle(paper) + "' was accepted.",
					"PAPER_ACCEPTED",
					paper.getId()
			);
		}
		if (status == Paper.Status.REJECTED) {
			notificationService.createNotification(
					paper.getSubmittedBy().getId(),
					"Paper rejected",
					"Your paper '" + safeTitle(paper) + "' was rejected.",
					"PAPER_REJECTED",
					paper.getId()
			);
		}

		if (previousStatus != Paper.Status.ACCEPTED && status == Paper.Status.ACCEPTED) {
			paperIndexingService.indexPaperAsync(savedPaper.getId());
		}

		return PaperResponse.from(savedPaper);
	}

	private List<String> parseCsvList(String raw) {
		if (raw == null || raw.isBlank()) {
			return List.of();
		}
		return List.of(raw.split(","))
				.stream()
				.map(String::trim)
				.filter(value -> !value.isBlank())
				.distinct()
				.collect(Collectors.toList());
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

	private String resolveCorrespondingAuthorEmail(String value, User fallbackUser) {
		String normalized = normalizeNullableText(value);
		if (normalized != null) {
			return normalized;
		}
		return fallbackUser == null ? null : fallbackUser.getEmail();
	}
	@Transactional
	public ExtractedMetadataResponse extractMetadata(Long paperId, String email) {
		Paper paper = paperRepository.findById(paperId)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);
		assertCanModifyPaper(paper, user);

		try (InputStream fileStream = fileStorageService.getFileByPath(paper.getFileUrl())) {
			byte[] fileBytes = fileStream.readAllBytes();

			org.springframework.web.multipart.MultipartFile mockFile =
					new org.springframework.mock.web.MockMultipartFile(
							paper.getFileName(),
							paper.getFileName(),
							"application/pdf",
							fileBytes
					);

			ExtractedMetadataResponse extracted = grobidService.extractMetadata(mockFile);
			if (isEmptyExtraction(extracted)) {
				throw new ResponseStatusException(
						HttpStatus.BAD_GATEWAY,
						"GROBID returned empty metadata. Ensure the PDF contains selectable text and try another document"
				);
			}

			// extract keywords via AI service (top 5-7)
			String combined = (extracted.getTitle() == null ? "" : extracted.getTitle()) + ". "
					+ (extracted.getAbstrakt() == null ? "" : extracted.getAbstrakt());
			if (!combined.trim().isEmpty()) {
				try {
					var kws = aiService.extractKeywords(combined, 6);
					if (kws != null && !kws.isEmpty()) {
						extracted.setKeywords(kws);
					}
				} catch (Exception ex) {
					// Log but don't fail extraction if AI service is unavailable
					log.debug("AI keyword extraction failed for paper {}: {}", paperId, ex.getMessage());
				}
			}

			return extracted;

		} catch (Exception e) {
			if (e instanceof ResponseStatusException rse) {
				throw rse;
			}
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Metadata extraction pipeline failed: " + e.getMessage(),
					e
			);
		}
	}

	@Transactional
	public PaperResponse updateMetadata(Long id, UpdateMetadataRequest request, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);
		assertCanModifyPaper(paper, user);
		if (paper.getStatus() != Paper.Status.DRAFT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Metadata can only be edited while paper is in DRAFT status");
		}

		paper.setTitle(normalizeNullableText(request.getTitle()));
		paper.setAbstrakt(normalizeNullableText(request.getAbstrakt()));
		paper.setAuthors(request.getAuthors() == null ? new ArrayList<>() : new ArrayList<>(request.getAuthors()));
		paper.setKeywords(request.getKeywords() == null ? new ArrayList<>() : new ArrayList<>(request.getKeywords()));
		paper.setCorrespondingAuthorEmail(resolveCorrespondingAuthorEmail(request.getCorrespondingAuthorEmail(), paper.getSubmittedBy()));

		paperRepository.save(paper);
		return PaperResponse.from(paper);
	}

	@Transactional
	public PaperResponse submitPaper(Long id, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);
		assertCanModifyPaper(paper, user);
		if (paper.getStatus() != Paper.Status.DRAFT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DRAFT papers can be submitted");
		}

		paper.setStatus(Paper.Status.SUBMITTED);
		Paper savedPaper = paperRepository.save(paper);

		// On submit, indexing starts immediately. Reviewer assignment is handled by the admin
		// through AI suggestions or manual selection so every assignment is explicit.
		tryIndexPaperAsync(savedPaper.getId());

		return PaperResponse.from(savedPaper);
	}

	@Transactional
	public PaperResponse withdrawPaper(Long id, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);

		boolean isOwnerResearcher = paper.getSubmittedBy() != null
				&& Objects.equals(paper.getSubmittedBy().getId(), user.getId())
				&& user.getRole() == User.Role.RESEARCHER;
		if (!isOwnerResearcher) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning RESEARCHER can withdraw this paper");
		}

		if (paper.getStatus() != Paper.Status.SUBMITTED && paper.getStatus() != Paper.Status.UNDER_REVIEW) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only SUBMITTED or UNDER_REVIEW papers can be withdrawn");
		}

		Paper.Status oldStatus = paper.getStatus();
		paper.setStatus(Paper.Status.DRAFT);
		Paper saved = paperRepository.save(paper);

		if (oldStatus == Paper.Status.UNDER_REVIEW) {
			List<User> admins = userRepository.findByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE);
			for (User admin : admins) {
				notificationService.createNotification(
						admin.getId(),
						"Paper withdrawn",
						"Researcher withdrew paper '" + safeTitle(paper) + "'.",
						"PAPER_WITHDRAWN",
						paper.getId()
				);
			}

			List<Assignment> activeAssignments = assignmentRepository.findByPaperIdAndStatus(paper.getId(), "ACTIVE");
			for (Assignment assignment : activeAssignments) {
				assignment.setStatus("WITHDRAWN");
				assignmentRepository.save(assignment);
				notificationService.createNotification(
					assignment.getChecker().getId(),
					"Paper withdrawn",
					"Paper '" + safeTitle(paper) + "' was withdrawn by the researcher.",
					"PAPER_WITHDRAWN",
					paper.getId()
				);
			}
		}

		return PaperResponse.from(saved);
	}

	@Transactional(readOnly = true)
	public InputStream downloadPaper(Long id, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);
		assertCanViewPaper(paper, user);
		return fileStorageService.getFileByPath(paper.getFileUrl());
	}

	@Transactional
	public void deleteDraft(Long id, String email) {
		Paper paper = paperRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);

		boolean isOwnerResearcher = paper.getSubmittedBy() != null
				&& Objects.equals(paper.getSubmittedBy().getId(), user.getId())
				&& user.getRole() == User.Role.RESEARCHER;
		if (!isOwnerResearcher) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning RESEARCHER can delete this draft");
		}

		if (paper.getStatus() != Paper.Status.DRAFT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DRAFT papers can be deleted");
		}

		// delete stored file if present
		try {
			fileStorageService.delete(paper.getFileUrl());
			reviewRepository.findByPaperId(paper.getId()).forEach(review -> {
				if (review.getReviewFileUrl() != null) {
					fileStorageService.delete(review.getReviewFileUrl());
				}
			});
		} catch (Exception ex) {
			log.debug("Failed to delete stored file for paper {}: {}", id, ex.getMessage());
		}

		paperRepository.delete(paper);
	}

	@Transactional
	public PaperCommentResponse addComment(Long paperId, String email, String content) {
		Paper paper = paperRepository.findById(paperId)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);

		boolean isOwnerResearcher = user.getRole() == User.Role.RESEARCHER
				&& paper.getSubmittedBy() != null
				&& Objects.equals(paper.getSubmittedBy().getId(), user.getId());
		if (!isOwnerResearcher) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning researcher can add comments");
		}

		String normalized = normalizeNullableText(content);
		if (normalized == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required");
		}

		PaperComment comment = PaperComment.builder()
				.paper(paper)
				.user(user)
				.content(normalized)
				.build();

		return PaperCommentResponse.from(paperCommentRepository.save(comment));
	}

	@Transactional(readOnly = true)
	public List<PaperCommentResponse> listComments(Long paperId, String email) {
		Paper paper = paperRepository.findById(paperId)
				.orElseThrow(() -> new ResourceNotFoundException("Paper not found"));
		User user = getUserByEmail(email);

		boolean isOwnerResearcher = user.getRole() == User.Role.RESEARCHER
				&& paper.getSubmittedBy() != null
				&& Objects.equals(paper.getSubmittedBy().getId(), user.getId());
		if (!isOwnerResearcher) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owning researcher can view comments");
		}

		return paperCommentRepository.findByPaperIdOrderByCreatedAtDesc(paperId)
				.stream()
				.map(PaperCommentResponse::from)
				.collect(Collectors.toList());
	}

	private boolean isEmptyExtraction(ExtractedMetadataResponse extracted) {
		if (extracted == null) {
			return true;
		}

		boolean titleEmpty = extracted.getTitle() == null || extracted.getTitle().isBlank();
		boolean abstractEmpty = extracted.getAbstrakt() == null || extracted.getAbstrakt().isBlank();
		boolean authorsEmpty = extracted.getAuthors() == null || extracted.getAuthors().isEmpty();
		boolean keywordsEmpty = extracted.getKeywords() == null || extracted.getKeywords().isEmpty();

		return titleEmpty && abstractEmpty && authorsEmpty && keywordsEmpty;
	}

	private User getUserByEmail(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private void assertCanModifyPaper(Paper paper, User user) {
		boolean isOwner = paper.getSubmittedBy() != null && Objects.equals(paper.getSubmittedBy().getId(), user.getId());
		boolean isAdmin = user.getRole() == User.Role.ADMIN;
		if (!isOwner && !isAdmin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to modify this paper");
		}
	}

	private void assertCanViewPaper(Paper paper, User user) {
		boolean isOwner = paper.getSubmittedBy() != null && Objects.equals(paper.getSubmittedBy().getId(), user.getId());
		if (paper.getStatus() == Paper.Status.DRAFT && !isOwner) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "DRAFT papers are private to the owner");
		}
		boolean isAdmin = user.getRole() == User.Role.ADMIN;
		boolean isAssignedChecker = user.getRole() == User.Role.CHECKER
				&& paperAssignmentRepository.existsByPaperIdAndReviewerId(paper.getId(), user.getId());
		if (!isOwner && !isAdmin && !isAssignedChecker) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to view this paper");
		}
	}

	private String safeTitle(Paper paper) {
		return paper.getTitle() == null || paper.getTitle().isBlank() ? paper.getFileName() : paper.getTitle();
	}
}
