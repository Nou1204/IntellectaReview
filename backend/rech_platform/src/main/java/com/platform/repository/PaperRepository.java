package com.platform.repository;

import com.platform.entity.Paper;
import com.platform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperRepository extends JpaRepository<Paper, Long> {

    Page<Paper> findBySubmittedBy(User user, Pageable pageable);

    Page<Paper> findBySubmittedById(Long submittedById, Pageable pageable);

    Page<Paper> findByStatus(Paper.Status status, Pageable pageable);

    Page<Paper> findByStatusNotIn(List<Paper.Status> statuses, Pageable pageable);

    List<Paper> findBySubmittedByIdAndStatusNot(Long submittedById, Paper.Status status);
}