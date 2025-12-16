const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer expert mode (participants)...');

        // Add total_players to multiplayer_games
        await db.query(`
            ALTER TABLE multiplayer_games 
            ADD COLUMN IF NOT EXISTS total_players INTEGER;
        `);

        console.log('Multiplayer expert schema updated with total_players.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
