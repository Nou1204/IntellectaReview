package com.platform.dto.request;

import lombok.Data;

@Data
public class SubmitReviewRequest {
    private Integer overallScore;
    private Integer originalityScore;
    private Integer clarityScore;
    private Integer methodologyScore;
    private String comments;
    private String decision;
}
