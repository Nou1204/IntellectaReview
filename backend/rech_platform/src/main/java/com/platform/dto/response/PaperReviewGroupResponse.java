package com.platform.dto.response;

import com.platform.entity.Paper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperReviewGroupResponse {
    private Long paperId;
    private String paperTitle;
    private Long submittedById;
    private String submittedByName;
    private String paperStatus;
    private String overallReviewProgress;
    private String globalStatus;
    private int submittedReviewsCount;
    private int totalAssignments;
    private List<PaperReviewerWorkflowResponse> reviewerAllocations;

    public static PaperReviewGroupResponse from(PaperReviewAssignmentRowResponse firstRow, List<PaperReviewerWorkflowResponse> reviewerAllocations) {
        long submittedCount = reviewerAllocations.stream()
                .filter(allocation -> "SUBMITTED".equals(allocation.getAssignmentStatus()))
                .count();
        int totalAssignments = reviewerAllocations.size();

        return PaperReviewGroupResponse.builder()
                .paperId(firstRow.paperId())
                .paperTitle(firstRow.paperTitle())
                .submittedById(firstRow.submittedById())
                .submittedByName(firstRow.submittedByName())
                .paperStatus(firstRow.paperStatus() == null ? null : firstRow.paperStatus().name())
                .overallReviewProgress(submittedCount + "/" + totalAssignments + " Reviews Finished")
                .globalStatus(firstRow.paperStatus() == null ? null : firstRow.paperStatus().name())
                .submittedReviewsCount((int) submittedCount)
                .totalAssignments(totalAssignments)
                .reviewerAllocations(reviewerAllocations)
                .build();
    }
}