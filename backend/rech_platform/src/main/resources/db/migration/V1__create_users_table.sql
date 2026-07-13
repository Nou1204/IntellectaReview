CREATE TABLE users (
                       id            BIGSERIAL        PRIMARY KEY,
                       name          VARCHAR(150)     NOT NULL,
                       email         VARCHAR(255)     NOT NULL UNIQUE,
                       password      VARCHAR(255)     NOT NULL,
                       role          VARCHAR(20)      NOT NULL DEFAULT 'RESEARCHER',
                       status        VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
                       bio           TEXT,
                       affiliation   VARCHAR(255),
                       expertise     JSONB            NOT NULL DEFAULT '[]',
                       avatar_url    VARCHAR(500),
                       created_at    TIMESTAMP        NOT NULL DEFAULT NOW(),
                       updated_at    TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email  ON users(email);
CREATE INDEX        idx_users_role   ON users(role);
CREATE INDEX        idx_users_status ON users(status);