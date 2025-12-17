const db = require('./server/db');

async function check() {
    try {
        console.log("Connecting...");
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='accounts'");
        const columns = res.rows.map(r => r.column_name);
        console.log("Columns in 'accounts':", columns);

        if (columns.includes('google_id')) {
            console.log("✅ google_id EXISTS locally.");
        } else {
            console.log("❌ google_id is MISSING locally.");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
