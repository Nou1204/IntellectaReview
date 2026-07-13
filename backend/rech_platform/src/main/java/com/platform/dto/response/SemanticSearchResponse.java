package com.platform.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SemanticSearchResponse {
    private String query;
    private List<SearchHit> hits = new ArrayList<>();

    @Data
    public static class SearchHit {
        private Long paperId;
        private String title;
        private String snippet;
        private Double score;
    }
}
