package com.platform.controller;

import com.platform.dto.request.SemanticSearchRequest;
import com.platform.dto.response.SemanticSearchResponse;
import com.platform.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final AiService aiService;

    @PostMapping("/semantic")
    @PreAuthorize("hasAnyRole('RESEARCHER','CHECKER','ADMIN')")
    public ResponseEntity<SemanticSearchResponse> semanticSearch(@RequestBody SemanticSearchRequest request) {
        String query = request.getQuery() == null ? "" : request.getQuery().trim();
        Integer topK = request.getTopK();
        return ResponseEntity.ok(aiService.semanticSearch(query, topK));
    }
}
