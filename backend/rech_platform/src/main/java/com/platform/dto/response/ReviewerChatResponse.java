package com.platform.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ReviewerChatResponse {
    private String answer;
    private List<SemanticSearchResponse.SearchHit> sources = new ArrayList<>();
}