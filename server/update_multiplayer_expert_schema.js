const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer expert mode...');

        // Add columns to multiplayer_games
        await db.query(`
            ALTER TABLE multiplayer_games 
            ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'Casual',
            ADD COLUMN IF NOT EXISTS rounds JSONB,
            ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS round_start_time TIMESTAMP,
            ALTER COLUMN target_country DROP NOT NULL,
            ALTER COLUMN target_facts DROP NOT NULL;
        `);

        // Create multiplayer_round_answers table
        await db.query(`
            CREATE TABLE IF NOT EXISTS multiplayer_round_answers (
                id SERIAL PRIMARY KEY,
                game_id INTEGER REFERENCES multiplayer_games(id) ON DELETE CASCADE,
                round_number INTEGER NOT NULL,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                answer VARCHAR(255),
                is_correct BOOLEAN DEFAULT FALSE,
                points INTEGER DEFAULT 0,
                answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_id, round_number, account_id)
            );
        `);

        console.log('Multiplayer expert schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
