package com.platform.dto.response;

import com.platform.entity.Paper;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaperPreviewResponse {
    private Long id;
    private String title;
    private String abstrakt;
    private List<String> authors;
    private List<String> keywords;
    private String correspondingAuthorEmail;
    private String status;
    private String assignmentStatus;
    private String assignmentType;
    private LocalDateTime assignedAt;
    private String submittedByName;
    private LocalDateTime createdAt;

    public static PaperPreviewResponse from(Paper paper) {
        PaperPreviewResponse response = new PaperPreviewResponse();
        response.setId(paper.getId());
        response.setTitle(paper.getTitle());
        response.setAbstrakt(paper.getAbstrakt());
        response.setAuthors(paper.getAuthors());
        response.setKeywords(paper.getKeywords());
        response.setCorrespondingAuthorEmail(paper.getCorrespondingAuthorEmail());
        response.setStatus(paper.getStatus() == null ? null : paper.getStatus().name());
        response.setCreatedAt(paper.getCreatedAt());
        if (paper.getSubmittedBy() != null) {
            response.setSubmittedByName(paper.getSubmittedBy().getName());
        }
        return response;
    }
}