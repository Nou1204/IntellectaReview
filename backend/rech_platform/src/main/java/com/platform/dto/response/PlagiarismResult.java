package com.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismResult {
    private Long paperId;
    private String paperTitle;
    private Double similarityScore;
    private boolean flagged;
}
