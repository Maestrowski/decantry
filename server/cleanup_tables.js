const db = require('./db');

async function cleanupTables() {
    try {
        console.log('Cleaning up stuck tables...');

        // Delete tables that have no members
        // This query finds tables where there are no corresponding entries in table_members
        const result = await db.query(`
            DELETE FROM game_tables 
            WHERE id NOT IN (SELECT DISTINCT table_id FROM table_members)
        `);

        console.log(`Deleted ${result.rowCount} empty tables.`);

        // Also, if a user is "stuck" thinking they are in a table but the table doesn't exist or they aren't in it,
        // the client-side logic should handle the 404/403 and redirect them.
        // But we can also clear out any orphaned member records if any exist (though foreign keys should handle this).

        process.exit(0);
    } catch (err) {
        console.error('Error cleaning up tables:', err);
        process.exit(1);
    }
}

cleanupTables();
