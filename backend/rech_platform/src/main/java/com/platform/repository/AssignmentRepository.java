package com.platform.repository;

import com.platform.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByPaperIdOrderByAssignedAtDesc(Long paperId);

    List<Assignment> findByCheckerIdOrderByAssignedAtDesc(Long checkerId);

    long countByCheckerIdAndStatus(Long checkerId, String status);

    List<Assignment> findByPaperIdAndStatus(Long paperId, String status);

    List<Assignment> findByStatusOrderByAssignedAtDesc(String status);

    List<Assignment> findAllByOrderByAssignedAtDesc();
}
