-- Init script for PostgreSQL DB
-- This runs on first startup if mounted to /docker-entrypoint-initdb.d

-- Create database if not exists (optional, since docker-compose sets it)
-- CREATE DATABASE IF NOT EXISTS pivotal_db;

-- Example: Create a table for PivyChat
CREATE TABLE IF NOT EXISTS pivychat_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes or other setup here