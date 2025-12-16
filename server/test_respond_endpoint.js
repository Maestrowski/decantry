const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

async function testRespond() {
    try {
        // 1. Create tokens
        const senderToken = jwt.sign({ id: 1, username: 'Maestrowski' }, JWT_SECRET, { expiresIn: '1h' });
        const receiverToken = jwt.sign({ id: 2, username: 'MaestroV2' }, JWT_SECRET, { expiresIn: '1h' });

        // 2. Create an invite manually
        const tableRes = await db.query('SELECT id FROM game_tables LIMIT 1');
        const tableId = tableRes.rows[0].id;

        // Clean up previous invites
        await db.query('DELETE FROM table_invites WHERE sender_id = 1 AND receiver_id = 2');
        await db.query('DELETE FROM table_members WHERE table_id = $1 AND account_id = 2', [tableId]);

        const inviteRes = await db.query(
            'INSERT INTO table_invites (table_id, sender_id, receiver_id) VALUES ($1, 1, 2) RETURNING id',
            [tableId]
        );
        const inviteId = inviteRes.rows[0].id;
        console.log('Created Invite ID:', inviteId);

        // 3. Respond to invite
        const response = await fetch('http://localhost:3000/api/user/invites/respond', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${receiverToken}`
            },
            body: JSON.stringify({ inviteId, action: 'accept' })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);

    } catch (err) {
        console.error('Error:', err);
    }
}

testRespond();
