package com.platform.dto.response;

import com.platform.entity.PaperComment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaperCommentResponse {

    private Long id;
    private Long paperId;
    private Long userId;
    private String userName;
    private String content;
    private LocalDateTime createdAt;

    public static PaperCommentResponse from(PaperComment comment) {
        PaperCommentResponse response = new PaperCommentResponse();
        response.setId(comment.getId());
        response.setPaperId(comment.getPaper().getId());
        response.setUserId(comment.getUser().getId());
        response.setUserName(comment.getUser().getName());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }
}
