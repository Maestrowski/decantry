const jwt = require('jsonwebtoken');
const db = require('./server/db');

async function test() {
    try {
        console.log("Creating test user...");
        // 1. Get or Create user
        const res = await db.query("INSERT INTO accounts (username, email, password) VALUES ('test_host', 'test@host.com', 'pass') ON CONFLICT DO NOTHING RETURNING id");
        let userId;
        if (res.rows.length > 0) userId = res.rows[0].id;
        else {
            const r2 = await db.query("SELECT id FROM accounts WHERE username='test_host'");
            userId = r2.rows[0].id;
        }

        // 2. Sign Token
        const token = jwt.sign({ id: userId, username: 'test_host' }, process.env.JWT_SECRET || 'your_jwt_secret_key');
        console.log("Token:", token);

        // 3. Send Request
        console.log("Sending POST /api/lobby/create...");
        const response = await fetch('http://localhost:3000/api/lobby/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Test Table",
                mode: "Casual",
                maxPlayers: 4,
                isPrivate: false
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);

    } catch (e) {
        console.error("Test Failed:", e);
    }
    process.exit(0);
}

test();
