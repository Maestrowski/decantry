const db = require('./server/db');

async function checkSchema() {
    try {
        console.log("Checking 'game_tables' schema...");
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='game_tables'");
        const columns = res.rows.map(r => r.column_name);
        console.log("Columns:", columns);

        const required = ['mode', 'max_players', 'status', 'host_id'];
        const missing = required.filter(c => !columns.includes(c));

        if (missing.length > 0) {
            console.log("❌ Missing columns:", missing);

            // Auto-fix attempt
            console.log("Attempting to add missing columns...");
            if (missing.includes('mode')) await db.query("ALTER TABLE game_tables ADD COLUMN mode VARCHAR(50) DEFAULT 'Casual'");
            if (missing.includes('max_players')) await db.query("ALTER TABLE game_tables ADD COLUMN max_players INTEGER DEFAULT 4");
            if (missing.includes('status')) await db.query("ALTER TABLE game_tables ADD COLUMN status VARCHAR(20) DEFAULT 'waiting'");

            console.log("✅ Schema updated.");
        } else {
            console.log("✅ Schema is correct.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkSchema();
