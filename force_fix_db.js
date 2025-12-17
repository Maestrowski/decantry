const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
console.log("DB Context:", dbUrl ? "Using DATABASE_URL" : "Using Local Credentials");
if (dbUrl) console.log("DB URL Host:", dbUrl.split('@')[1].split(':')[0]);

const pool = new Pool(
    dbUrl
        ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        }
);

async function fix() {
    try {
        console.log("Connecting...");
        const client = await pool.connect();
        console.log("Connected!");

        // 1. List columns
        console.log("Checking columns for 'accounts'...");
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='accounts'");
        const columns = res.rows.map(r => r.column_name);
        console.log("Existing columns:", columns);

        // 2. Add google_id if missing
        if (!columns.includes('google_id')) {
            console.log("⚠️ google_id is MISSING. Adding it now...");
            await client.query("ALTER TABLE accounts ADD COLUMN google_id VARCHAR(255) UNIQUE");
            console.log("✅ ALTER TABLE SUCCESS.");
        } else {
            console.log("ℹ️ google_id ALREADY EXISTS.");
        }

        // 3. Verify
        const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='accounts'");
        console.log("Final columns:", res2.rows.map(r => r.column_name));

        client.release();
    } catch (e) {
        console.error("❌ ERROR:", e);
    }
    await pool.end();
}

fix();
