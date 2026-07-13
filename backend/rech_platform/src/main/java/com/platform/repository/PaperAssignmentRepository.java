package com.platform.repository;

import com.platform.dto.response.PaperReviewAssignmentRowResponse;
import com.platform.entity.PaperAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaperAssignmentRepository extends JpaRepository<PaperAssignment, Long> {

    List<PaperAssignment> findByPaperId(Long paperId);

    List<PaperAssignment> findByReviewerId(Long reviewerId);

    List<PaperAssignment> findByReviewerIdOrderByAssignedAtDesc(Long reviewerId);

    Optional<PaperAssignment> findByPaperIdAndReviewerId(Long paperId, Long reviewerId);

    boolean existsByPaperIdAndReviewerId(Long paperId, Long reviewerId);

    @Query("""
        select new com.platform.dto.response.PaperReviewAssignmentRowResponse(
            p.id,
            p.title,
            p.status,
            submittedBy.id,
            submittedBy.name,
            pa.id,
            pa.status,
            pa.assignmentType,
            pa.assignedAt,
            reviewer.id,
            reviewer.name,
            reviewer.email,
            rv.id,
            rv.decision,
            rv.comments,
            rv.overallScore,
            rv.originalityScore,
            rv.clarityScore,
            rv.methodologyScore,
            rv.submittedAt,
            rv.reviewFileUrl,
            rv.reviewFileName
        )
        from PaperAssignment pa
        join pa.paper p
        join pa.reviewer reviewer
        left join p.submittedBy submittedBy
        left join Review rv on rv.assignment = pa
        order by p.id asc, pa.assignedAt asc
    """)
    List<PaperReviewAssignmentRowResponse> findGroupedReviewRows();
}
