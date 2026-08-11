USE project1;

ALTER TABLE users
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER password_hash;

CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('signup_verification', 'password_reset', 'password_reset_token') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otps_email_purpose ON otps(email, purpose);