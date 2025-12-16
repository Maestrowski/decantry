const db = require('./server/db');

async function run() {
    try {
        console.log("Connecting to database...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS table_invites (
                id SERIAL PRIMARY KEY,
                table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES accounts(id),
                receiver_id INTEGER REFERENCES accounts(id),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Success: table_invites created on the connected database.');
    } catch (e) {
        console.error('❌ Error creating table:', e);
    }
    process.exit(0);
}

run();
