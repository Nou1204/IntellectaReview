package com.platform.dto.response;

import com.platform.entity.PaperAssignment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentResponse {
    private Long id;
    private Long paperId;
    private String paperTitle;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerEmail;
    private LocalDateTime assignedAt;
    private String assignmentType;
    private String status;

    public static AssignmentResponse from(PaperAssignment assignment) {
        AssignmentResponse response = new AssignmentResponse();
        response.setId(assignment.getId());
        if (assignment.getPaper() != null) {
            response.setPaperId(assignment.getPaper().getId());
            response.setPaperTitle(assignment.getPaper().getTitle());
        }
        if (assignment.getReviewer() != null) {
            response.setReviewerId(assignment.getReviewer().getId());
            response.setReviewerName(assignment.getReviewer().getName());
            response.setReviewerEmail(assignment.getReviewer().getEmail());
        }
        response.setAssignedAt(assignment.getAssignedAt());
        response.setAssignmentType(assignment.getAssignmentType());
        response.setStatus(assignment.getStatus());
        return response;
    }
}