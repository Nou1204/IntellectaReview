package com.platform.dto.request;

import lombok.Data;

@Data
public class SemanticSearchRequest {
    private String query;
    private Integer topK = 5;
}
