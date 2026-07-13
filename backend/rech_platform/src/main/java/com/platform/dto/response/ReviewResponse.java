package com.platform.dto.response;

import com.platform.entity.Review;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long paperId;
    private String paperTitle;
    private Long reviewerId;
    private String reviewerName;
    private Integer overallScore;
    private Integer originalityScore;
    private Integer clarityScore;
    private Integer methodologyScore;
    private String comments;
    private String reviewFileUrl;
    private String reviewFileName;
    private Long reviewFileSize;
    private String decision;
    private String aiSummary;
    private Double plagiarismScore;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        if (review.getPaper() != null) {
            response.setPaperId(review.getPaper().getId());
            response.setPaperTitle(review.getPaper().getTitle());
        }
        if (review.getReviewer() != null) {
            response.setReviewerId(review.getReviewer().getId());
            response.setReviewerName(review.getReviewer().getName());
        }
        response.setOverallScore(review.getOverallScore());
        response.setOriginalityScore(review.getOriginalityScore());
        response.setClarityScore(review.getClarityScore());
        response.setMethodologyScore(review.getMethodologyScore());
        response.setComments(review.getComments());
        response.setReviewFileUrl(review.getReviewFileUrl());
        response.setReviewFileName(review.getReviewFileName());
        response.setReviewFileSize(review.getReviewFileSize());
        response.setDecision(review.getDecision());
        response.setAiSummary(review.getAiSummary());
        response.setPlagiarismScore(review.getPlagiarismScore());
        response.setSubmittedAt(review.getSubmittedAt());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}
