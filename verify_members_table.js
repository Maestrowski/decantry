const db = require('./server/db');

async function checkTableMembers() {
    try {
        console.log("Checking 'table_members' existence...");
        const res = await db.query("SELECT * FROM information_schema.tables WHERE table_name='table_members'");
        if (res.rows.length === 0) {
            console.log("❌ table_members is MISSING.");
            console.log("Creating it...");
            await db.query(`
                CREATE TABLE IF NOT EXISTS table_members (
                    id SERIAL PRIMARY KEY,
                    table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
                    account_id INTEGER REFERENCES accounts(id),
                    is_ready BOOLEAN DEFAULT FALSE,
                    session_points INTEGER DEFAULT 0,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("✅ Created table_members.");
        } else {
            console.log("✅ table_members exists.");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkTableMembers();
