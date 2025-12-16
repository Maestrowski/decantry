const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer results...');

        // Create multiplayer_results table
        await db.query(`
            CREATE TABLE IF NOT EXISTS multiplayer_results (
                id SERIAL PRIMARY KEY,
                game_id INTEGER REFERENCES multiplayer_games(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                score INTEGER DEFAULT 0,
                finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_id, account_id)
            );
        `);

        console.log('Multiplayer results schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
