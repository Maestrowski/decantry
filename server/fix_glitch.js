const db = require('./db');

async function fixGlitch() {
    try {
        console.log('Deleting table 4...');
        await db.query('DELETE FROM game_tables WHERE id = 4');
        console.log('Table 4 deleted.');

        // Also ensure no lingering members for this table (CASCADE should handle it, but just in case)
        await db.query('DELETE FROM table_members WHERE table_id = 4');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixGlitch();
