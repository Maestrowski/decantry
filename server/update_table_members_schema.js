const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating schema for multiplayer table members...');

        // Add is_in_game column to table_members
        await db.query(`
            ALTER TABLE table_members 
            ADD COLUMN IF NOT EXISTS is_in_game BOOLEAN DEFAULT FALSE;
        `);

        console.log('Table members schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
