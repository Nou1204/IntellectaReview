package com.platform.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReviewerSuggestionResponse {

    private Long checkerId;
    private String checkerName;
    private List<String> expertise;
    private List<String> matchedExpertise;
    private long activeAssignments;
    private int matchScore;
}
