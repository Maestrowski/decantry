-- Users/Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In a real app, store hashes!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Country Facts
CREATE TABLE IF NOT EXISTS country_facts (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    fact_content TEXT NOT NULL,
    fact_number INTEGER NOT NULL, -- 1 to 10
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    casual_points INTEGER DEFAULT 0,
    expert_points INTEGER DEFAULT 0,
    timed_points INTEGER DEFAULT 0,
    daily_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0
);

-- Game Tables (Multiplayer)
CREATE TABLE IF NOT EXISTS game_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    is_private BOOLEAN DEFAULT FALSE,
    host_id INTEGER REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Members
CREATE TABLE IF NOT EXISTS table_members (
    table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    is_ready BOOLEAN DEFAULT FALSE,
    session_points INTEGER DEFAULT 0,
    PRIMARY KEY (table_id, account_id)
);

-- Game History
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    game_mode VARCHAR(50) NOT NULL,
    fact_number INTEGER,
    guessed_correctly BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
