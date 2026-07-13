package com.platform.dto.response;

import com.platform.entity.Paper;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaperResponse {
	private Long id;
	private String title;
	private String abstrakt;
	private List<String> authors;
	private List<String> keywords;
	private String fileUrl;
	private String fileName;
	private Long fileSize;
	private String status;
	private String assignmentStatus;
	private String assignmentType;
	private LocalDateTime assignedAt;
	private Long submittedById;
	private String submittedByName;
	private String correspondingAuthorEmail;
	private String reviewConsensusSummary;
	private LocalDateTime createdAt;

	public static PaperResponse from(Paper paper) {
		PaperResponse response = new PaperResponse();
		response.setId(paper.getId());
		response.setTitle(paper.getTitle());
		response.setAbstrakt(paper.getAbstrakt());
		response.setAuthors(paper.getAuthors());
		response.setKeywords(paper.getKeywords());
		response.setFileUrl(paper.getFileUrl());
		response.setFileName(paper.getFileName());
		response.setFileSize(paper.getFileSize());
		response.setStatus(paper.getStatus().name());
		response.setCorrespondingAuthorEmail(paper.getCorrespondingAuthorEmail());
		response.setReviewConsensusSummary(paper.getReviewConsensusSummary());
		response.setCreatedAt(paper.getCreatedAt());

		if (paper.getSubmittedBy() != null) {
			response.setSubmittedById(paper.getSubmittedBy().getId());
			response.setSubmittedByName(paper.getSubmittedBy().getName());
		}
		return response;
	}
}
