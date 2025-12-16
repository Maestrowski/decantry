const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer timed mode...');

        // Add lives column to multiplayer_results
        await db.query(`
            ALTER TABLE multiplayer_results 
            ADD COLUMN IF NOT EXISTS lives INTEGER DEFAULT 10;
        `);

        console.log('Multiplayer timed schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
