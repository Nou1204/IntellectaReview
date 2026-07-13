package com.platform.dto.request;

import lombok.Data;

@Data
public class ReviewerChatRequest {
    private String query;
    private Integer topK;
}