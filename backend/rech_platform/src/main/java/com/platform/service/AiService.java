package com.platform.service;

import com.platform.dto.request.EmbedRequest;
import com.platform.dto.response.SemanticSearchResponse;
import com.platform.dto.response.ReviewerChatResponse;
import com.platform.dto.response.SemanticSearchResponse.SearchHit;
import com.platform.entity.Paper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${ai-service.url:http://localhost:11434}")
    private String aiServiceUrl;

    @Async("paperIndexingExecutor")
    public void embedPaperAsync(Paper paper) {
        if (paper == null || paper.getId() == null) {
            return;
        }

        EmbedRequest payload = EmbedRequest.builder()
                .paperId(paper.getId())
                .title(paper.getTitle() == null || paper.getTitle().isBlank() ? paper.getFileName() : paper.getTitle())
                .abstrakt(paper.getAbstrakt() == null ? "" : paper.getAbstrakt())
                .keywords(paper.getKeywords() == null ? List.of() : paper.getKeywords())
                .build();

        restTemplate.postForEntity(aiServiceUrl + "/embed", payload, Map.class);
        log.info("Embedding request sent for paper {}", paper.getId());
    }

    public List<String> extractKeywords(String text, int topK) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("text", text);
        payload.put("top_k", topK);

        ResponseEntity<List> response = restTemplate.postForEntity(
                aiServiceUrl + "/keywords",
                payload,
                List.class
        );

        List body = response.getBody();
        if (body == null) return List.of();
        try {
            List<String> result = new java.util.ArrayList<>();
            for (Object o : body) {
                if (o == null) continue;
                String s = o.toString();
                if (s == null) continue;
                s = s.trim();
                if (s.isEmpty()) continue;
                result.add(s);
                if (result.size() >= topK) break;
            }
            return result;
        } catch (Exception e) {
            return List.of();
        }
    }

    public SemanticSearchResponse semanticSearch(String query, Integer topK) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("query", query);
        payload.put("topK", topK == null ? 5 : topK);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/search",
                payload,
                Map.class
        );

        SemanticSearchResponse semanticResponse = new SemanticSearchResponse();
        semanticResponse.setQuery(query);

        Map body = response.getBody();
        if (body == null) {
            return semanticResponse;
        }

        Object rawResults = body.get("results");
        if (!(rawResults instanceof List<?> results)) {
            return semanticResponse;
        }

        for (Object item : results) {
            if (!(item instanceof Map<?, ?> hitMap)) {
                continue;
            }

            SemanticSearchResponse.SearchHit hit = new SemanticSearchResponse.SearchHit();
            Object paperId = hitMap.get("paperId");
            if (paperId instanceof Number number) {
                hit.setPaperId(number.longValue());
            }

            Object title = hitMap.get("title");
            if (title instanceof String value) {
                hit.setTitle(value);
            }

            Object snippet = hitMap.get("abstract");
            if (snippet instanceof String value) {
                hit.setSnippet(value);
            }

            Object similarity = hitMap.get("similarity");
            if (similarity instanceof Number number) {
                hit.setScore(number.doubleValue());
            }

            semanticResponse.getHits().add(hit);
        }

        return semanticResponse;
    }

    public ReviewerChatResponse chatAboutPaper(String query, Paper paper, Integer topK) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("query", query);
        payload.put("top_k", topK == null ? 5 : topK);
        if (paper != null) {
            payload.put("paper_id", paper.getId());
            payload.put("title", paper.getTitle() == null ? paper.getFileName() : paper.getTitle());
            payload.put("abstract", paper.getAbstrakt() == null ? "" : paper.getAbstrakt());
            payload.put("keywords", paper.getKeywords() == null ? List.of() : paper.getKeywords());
        }

        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/chat",
                payload,
                Map.class
        );

        ReviewerChatResponse chatResponse = new ReviewerChatResponse();
        Map body = response.getBody();
        if (body == null) {
            return chatResponse;
        }

        Object answer = body.get("answer");
        if (answer instanceof String text) {
            chatResponse.setAnswer(text);
        }

        Object rawSources = body.get("sources");
        if (rawSources instanceof List<?> sources) {
            for (Object item : sources) {
                if (!(item instanceof Map<?, ?> hitMap)) {
                    continue;
                }

                SearchHit hit = new SearchHit();
                Object paperId = hitMap.get("paperId");
                if (paperId instanceof Number number) {
                    hit.setPaperId(number.longValue());
                }
                Object title = hitMap.get("title");
                if (title instanceof String text) {
                    hit.setTitle(text);
                }
                Object snippet = hitMap.get("snippet");
                if (snippet instanceof String text) {
                    hit.setSnippet(text);
                }
                Object score = hitMap.get("score");
                if (score instanceof Number number) {
                    hit.setScore(number.doubleValue());
                }
                chatResponse.getSources().add(hit);
            }
        }

        return chatResponse;
    }
}
