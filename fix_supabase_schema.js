const db = require('./server/db');

async function run() {
    try {
        console.log("Connecting to Supabase database...");

        // 1. Fix missing google_id column
        console.log("Checking for google_id column...");
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='google_id') THEN
                    ALTER TABLE accounts ADD COLUMN google_id VARCHAR(255) UNIQUE;
                    RAISE NOTICE 'Added google_id column';
                ELSE
                    RAISE NOTICE 'google_id column already exists';
                END IF;
            END
            $$;
        `);
        console.log("✅ google_id check/creation complete.");

        // 2. Fix missing table_invites table
        console.log("Checking for table_invites table...");
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
        console.log("✅ table_invites check/creation complete.");

    } catch (e) {
        console.error("❌ Error updating database:", e);
    } finally {
        // We don't want to hang the process
        if (db.end) await db.end();
        process.exit(0);
    }
}

run();
