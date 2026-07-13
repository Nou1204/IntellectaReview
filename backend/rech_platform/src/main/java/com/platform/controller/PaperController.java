package com.platform.controller;

import com.platform.dto.request.CreateCommentRequest;
import com.platform.dto.response.ExtractedMetadataResponse;
import com.platform.dto.response.PaperCommentResponse;
import com.platform.dto.response.PaperResponse;
import com.platform.dto.response.ReviewResponse;
import com.platform.service.PaperService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.platform.dto.request.UpdateMetadataRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api/papers")
@RequiredArgsConstructor
public class PaperController {

	private final PaperService paperService;

	@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('RESEARCHER')")
	public ResponseEntity<PaperResponse> uploadPaper(
			Authentication authentication,
			@RequestParam(required = false) String title,
			@RequestParam(name = "abstrakt", required = false) String abstrakt,
			@RequestParam(required = false) String authors,
			@RequestParam(required = false) String keywords,
			@RequestParam(required = false) String correspondingAuthorEmail,
			@RequestParam("file") MultipartFile file
	) {
		return ResponseEntity.ok(paperService.uploadPaper(
				authentication.getName(),
				title,
				abstrakt,
				authors,
				keywords,
				correspondingAuthorEmail,
				file
		));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('RESEARCHER')")
	public ResponseEntity<Void> deleteDraft(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails) {
		paperService.deleteDraft(id, userDetails.getUsername());
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/me")
	public ResponseEntity<List<PaperResponse>> listMyPapers(Authentication authentication) {
		return ResponseEntity.ok(paperService.listCurrentUserPapers(authentication.getName()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<PaperResponse> getPaperById(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(paperService.getPaperById(id, userDetails.getUsername()));
	}

	@PostMapping("/{id}/extract")
	public ResponseEntity<ExtractedMetadataResponse> extractMetadata(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(paperService.extractMetadata(id, userDetails.getUsername()));
	}

	@PutMapping("/{id}/metadata")
	public ResponseEntity<PaperResponse> updateMetadata(
			@PathVariable Long id,
			@RequestBody UpdateMetadataRequest request,
			@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(paperService.updateMetadata(id, request, userDetails.getUsername()));
	}

	@PutMapping("/{id}/submit")
	public ResponseEntity<PaperResponse> submitPaper(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(paperService.submitPaper(id, userDetails.getUsername()));
	}

	@PutMapping("/{id}/withdraw")
	@PreAuthorize("hasRole('RESEARCHER')")
	public ResponseEntity<PaperResponse> withdrawPaper(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(paperService.withdrawPaper(id, userDetails.getUsername()));
	}

	@PostMapping("/{id}/comments")
	@PreAuthorize("hasRole('RESEARCHER')")
	public ResponseEntity<PaperCommentResponse> addComment(
			@PathVariable Long id,
			@Valid @RequestBody CreateCommentRequest request,
			@AuthenticationPrincipal UserDetails userDetails
	) {
		return ResponseEntity.ok(paperService.addComment(id, userDetails.getUsername(), request.getContent()));
	}

	@GetMapping("/{id}/comments")
	@PreAuthorize("hasRole('RESEARCHER')")
	public ResponseEntity<List<PaperCommentResponse>> listComments(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails
	) {
		return ResponseEntity.ok(paperService.listComments(id, userDetails.getUsername()));
	}

	@GetMapping("/{id}/reviews")
	public ResponseEntity<List<ReviewResponse>> listReviews(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails
	) {
		return ResponseEntity.ok(paperService.listPaperReviews(id, userDetails.getUsername()));
	}

	@GetMapping("/{id}/download")
	public ResponseEntity<InputStreamResource> downloadPaper(
			@PathVariable Long id,
			@AuthenticationPrincipal UserDetails userDetails
	) {
		PaperResponse paper = paperService.getPaperById(id, userDetails.getUsername());
		InputStream stream = paperService.downloadPaper(id, userDetails.getUsername());
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + paper.getFileName() + "\"")
				.body(new InputStreamResource(stream));
	}
}
