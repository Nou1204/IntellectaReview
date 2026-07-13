package com.platform.dto.request;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer overallScore;
    private Integer originalityScore;
    private Integer clarityScore;
    private Integer methodologyScore;
    private String comments;
    private String decision;
    private Double plagiarismScore;
    private String aiSummary;
}