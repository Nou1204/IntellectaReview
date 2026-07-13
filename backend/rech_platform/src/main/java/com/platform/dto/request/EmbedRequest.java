package com.platform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmbedRequest {
    private Long paperId;
    private String title;
    private String abstrakt;

    @Builder.Default
    private List<String> keywords = new ArrayList<>();
}
