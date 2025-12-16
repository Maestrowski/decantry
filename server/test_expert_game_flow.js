const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const BASE_URL = 'http://localhost:3000/api';

async function run() {
    try {
        // 1. Create/Get User
        const username = 'testuser_' + Date.now();
        const email = username + '@example.com';
        await db.query('INSERT INTO accounts (username, email, password) VALUES ($1, $2, $3)', [username, email, 'password']);
        const userRes = await db.query('SELECT id FROM accounts WHERE username = $1', [username]);
        const userId = userRes.rows[0].id;
        const token = jwt.sign({ id: userId, username }, JWT_SECRET);

        console.log('User created:', username);

        // 2. Create Table
        let res = await fetch(`${BASE_URL}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: 'Test Table', mode: 'Expert', maxPlayers: 4 })
        });
        let data = await res.json();
        const tableId = data.tableId;
        console.log('Table created:', tableId);

        // 3. Start Game
        await fetch(`${BASE_URL}/lobby/toggle-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tableId })
        });

        res = await fetch(`${BASE_URL}/lobby/start-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tableId })
        });
        data = await res.json();
        const gameId = data.gameId;
        console.log('Game started:', gameId);

        // 4. Get Status
        res = await fetch(`${BASE_URL}/game/multiplayer/status/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log('Initial Status:', data);

        // 5. Submit Answer
        res = await fetch(`${BASE_URL}/game/multiplayer/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                gameId,
                score: 100,
                round: 0,
                answer: 'Poland',
                isCorrect: false
            })
        });
        data = await res.json();
        console.log('Answer submitted:', data);

        // 6. Get Status Again
        res = await fetch(`${BASE_URL}/game/multiplayer/status/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log('Updated Status:', data);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
