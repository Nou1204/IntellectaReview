CREATE TABLE papers (
                        id             BIGSERIAL      PRIMARY KEY,
                        title          VARCHAR(500),
                        abstrakt       TEXT,
                        authors        JSONB          NOT NULL DEFAULT '[]',
                        keywords       JSONB          NOT NULL DEFAULT '[]',
                        file_url       VARCHAR(500)   NOT NULL,
                        file_name      VARCHAR(255)   NOT NULL,
                        file_size      BIGINT,
                        status         VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
                        submitted_by   BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        category       VARCHAR(150),
                        created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
                        updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_papers_submitted_by ON papers(submitted_by);
CREATE INDEX idx_papers_status       ON papers(status);