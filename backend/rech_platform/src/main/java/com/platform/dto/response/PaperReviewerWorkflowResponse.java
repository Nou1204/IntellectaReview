package com.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperReviewerWorkflowResponse {
    private Long assignmentId;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerEmail;
    private String assignmentStatus;
    private String assignmentType;
    private LocalDateTime assignedAt;
    private Long reviewId;
    private String decision;
    private String comments;
    private Integer overallScore;
    private Integer originalityScore;
    private Integer clarityScore;
    private Integer methodologyScore;
    private LocalDateTime submittedAt;
    private String reviewFileUrl;
    private String reviewFileName;
}