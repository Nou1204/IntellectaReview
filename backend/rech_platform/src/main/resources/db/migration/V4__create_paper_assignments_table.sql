CREATE TABLE IF NOT EXISTS paper_assignments (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT uk_paper_assignments_paper_reviewer UNIQUE (paper_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_paper_assignments_paper_id ON paper_assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_reviewer_id ON paper_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_paper_assignments_status ON paper_assignments(status);
