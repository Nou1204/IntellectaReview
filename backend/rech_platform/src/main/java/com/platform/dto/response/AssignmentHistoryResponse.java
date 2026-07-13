package com.platform.dto.response;

import com.platform.entity.Assignment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentHistoryResponse {

    private Long id;
    private Long paperId;
    private String paperTitle;
    private String researcherName;
    private Long checkerId;
    private String checkerName;
    private Long assignedById;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private String status;
    private String notes;

    public static AssignmentHistoryResponse from(Assignment assignment) {
        AssignmentHistoryResponse response = new AssignmentHistoryResponse();
        response.setId(assignment.getId());
        response.setPaperId(assignment.getPaper().getId());
        response.setPaperTitle(assignment.getPaper().getTitle());
        response.setResearcherName(assignment.getPaper().getSubmittedBy() == null ? null : assignment.getPaper().getSubmittedBy().getName());
        response.setCheckerId(assignment.getChecker().getId());
        response.setCheckerName(assignment.getChecker().getName());
        response.setAssignedById(assignment.getAssignedBy().getId());
        response.setAssignedByName(assignment.getAssignedBy().getName());
        response.setAssignedAt(assignment.getAssignedAt());
        response.setStatus(assignment.getStatus());
        response.setNotes(assignment.getNotes());
        return response;
    }
}
