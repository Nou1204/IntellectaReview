CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id BIGINT REFERENCES paper_assignments(id) ON DELETE SET NULL,
    overall_score INTEGER,
    originality_score INTEGER,
    clarity_score INTEGER,
    methodology_score INTEGER,
    comments TEXT,
    decision VARCHAR(20),
    ai_summary TEXT,
    plagiarism_score DOUBLE PRECISION,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_paper_id ON reviews(paper_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submitted_at ON reviews(submitted_at);
