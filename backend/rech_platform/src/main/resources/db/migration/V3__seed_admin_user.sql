-- ============================================================
-- V3__seed_admin_user.sql
-- Creates the default ADMIN account (password: Admin@1234)
-- BCrypt hash of "Admin@1234" with strength 12
-- ============================================================

INSERT INTO users (name, email, password, role, status)
VALUES (
    'Platform Admin',
    'admin@platform.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'ADMIN',
    'ACTIVE'
);
