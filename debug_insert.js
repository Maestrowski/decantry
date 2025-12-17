const db = require('./server/db');

async function debug() {
    try {
        console.log("Creating/Finding test user...");
        const res = await db.query("INSERT INTO accounts (username, email, password) VALUES ('debug_host', 'debug@host.com', 'pass') ON CONFLICT DO NOTHING RETURNING id");
        let hostId;
        if (res.rows.length > 0) hostId = res.rows[0].id;
        else {
            const r2 = await db.query("SELECT id FROM accounts WHERE username='debug_host'");
            hostId = r2.rows[0].id;
        }
        console.log("Host ID:", hostId);

        console.log("1. DELETE table_members...");
        await db.query('DELETE FROM table_members WHERE account_id = $1', [hostId]);

        console.log("2. DELETE empty game_tables...");
        await db.query('DELETE FROM game_tables WHERE id NOT IN (SELECT table_id FROM table_members)');

        console.log("3. INSERT game_tables...");
        const tableResult = await db.query(
            'INSERT INTO game_tables (name, password, is_private, host_id, mode, max_players, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            ['Debug Table', null, false, hostId, 'Casual', 4, 'waiting']
        );
        const tableId = tableResult.rows[0].id;
        console.log("Table Created, ID:", tableId);

        console.log("4. INSERT table_members...");
        await db.query(
            'INSERT INTO table_members (table_id, account_id, is_ready, session_points) VALUES ($1, $2, $3, $4)',
            [tableId, hostId, false, 0]
        );
        console.log("✅ Success! No errors found in SQL.");

    } catch (err) {
        console.error("❌ SQL ERROR:", err);
    }
    process.exit(0);
}

debug();
