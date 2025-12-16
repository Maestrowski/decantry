const db = require('./server/db');

async function checkSchema() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'multiplayer_results';
        `);
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
