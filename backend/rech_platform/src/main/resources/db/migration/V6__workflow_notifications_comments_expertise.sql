CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    checker_id BIGINT NOT NULL REFERENCES users(id),
    assigned_by BIGINT NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_assignments_paper_id ON assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_assignments_checker_id ON assignments(checker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE TABLE IF NOT EXISTS paper_comments (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_comments_paper_id ON paper_comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_comments_user_id ON paper_comments(user_id);

CREATE TABLE IF NOT EXISTS expertise_requests (
    id BIGSERIAL PRIMARY KEY,
    checker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expertise VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expertise_requests_checker_id ON expertise_requests(checker_id);
CREATE INDEX IF NOT EXISTS idx_expertise_requests_status ON expertise_requests(status);
