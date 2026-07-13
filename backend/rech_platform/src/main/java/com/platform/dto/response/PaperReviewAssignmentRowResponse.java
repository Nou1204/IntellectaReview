package com.platform.dto.response;

import com.platform.entity.Paper;

import java.time.LocalDateTime;

public record PaperReviewAssignmentRowResponse(
        Long paperId,
        String paperTitle,
        Paper.Status paperStatus,
        Long submittedById,
        String submittedByName,
        Long assignmentId,
        String assignmentStatus,
        String assignmentType,
        LocalDateTime assignedAt,
        Long reviewerId,
        String reviewerName,
        String reviewerEmail,
        Long reviewId,
        String decision,
        String comments,
        Integer overallScore,
        Integer originalityScore,
        Integer clarityScore,
        Integer methodologyScore,
        LocalDateTime submittedAt,
        String reviewFileUrl,
        String reviewFileName
) {}