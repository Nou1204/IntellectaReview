package com.platform.repository;

import com.platform.entity.PaperComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperCommentRepository extends JpaRepository<PaperComment, Long> {

    List<PaperComment> findByPaperIdOrderByCreatedAtDesc(Long paperId);
}
