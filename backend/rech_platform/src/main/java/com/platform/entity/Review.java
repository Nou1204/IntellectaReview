package com.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paper_id", nullable = false)
    private Paper paper;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private PaperAssignment assignment;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "originality_score")
    private Integer originalityScore;

    @Column(name = "clarity_score")
    private Integer clarityScore;

    @Column(name = "methodology_score")
    private Integer methodologyScore;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "review_file_url", length = 500)
    private String reviewFileUrl;

    @Column(name = "review_file_name", length = 255)
    private String reviewFileName;

    @Column(name = "review_file_size")
    private Long reviewFileSize;

    @Column(name = "decision", length = 20)
    private String decision;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "plagiarism_score")
    private Double plagiarismScore;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
