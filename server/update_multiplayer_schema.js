const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer...');

        // Create multiplayer_games table
        await db.query(`
            CREATE TABLE IF NOT EXISTS multiplayer_games (
                id SERIAL PRIMARY KEY,
                table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
                target_country VARCHAR(100) NOT NULL,
                target_facts JSONB NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Multiplayer schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
