package com.platform.service;

import com.platform.entity.Paper;
import com.platform.repository.PaperRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaperIndexingService {

    private final PaperRepository paperRepository;
    private final AiService aiService;

    public void indexPaperAsync(Long paperId) {
        paperRepository.findById(paperId).ifPresentOrElse(paper -> {
            if (paper.getStatus() != Paper.Status.SUBMITTED && paper.getStatus() != Paper.Status.ACCEPTED) {
                log.info("Skip indexing for paper {} because status is {}", paperId, paper.getStatus());
                return;
            }

            try {
                aiService.embedPaperAsync(paper);
                log.info("Paper {} queued for embedding", paperId);
            } catch (Exception ex) {
                log.error("Paper indexing failed for paper {}: {}", paperId, ex.getMessage());
            }
        }, () -> log.warn("Cannot index paper {} because it does not exist", paperId));
    }
}
