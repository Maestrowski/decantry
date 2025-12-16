const db = require('./db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

async function testInvite() {
    try {
        // Mock data - replace with actual IDs if known, or fetch them
        // We need a valid user token and a valid table

        // 1. Get a user
        const userRes = await db.query('SELECT id, username FROM accounts LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No users found');
            return;
        }
        const sender = userRes.rows[0];
        console.log('Sender:', sender);

        // 2. Get another user
        const userRes2 = await db.query('SELECT id, username FROM accounts WHERE id != $1 LIMIT 1', [sender.id]);
        if (userRes2.rows.length === 0) {
            console.log('No second user found to invite');
            return;
        }
        const receiver = userRes2.rows[0];
        console.log('Receiver:', receiver);

        // 3. Get a table
        const tableRes = await db.query('SELECT id FROM game_tables LIMIT 1');
        if (tableRes.rows.length === 0) {
            console.log('No tables found');
            return;
        }
        const table = tableRes.rows[0];
        console.log('Table:', table);

        // 4. Try insert
        console.log('Attempting insert...');
        await db.query('INSERT INTO table_invites (table_id, sender_id, receiver_id) VALUES ($1, $2, $3)', [table.id, sender.id, receiver.id]);
        console.log('Insert successful');

        // Clean up
        await db.query('DELETE FROM table_invites WHERE table_id = $1 AND sender_id = $2 AND receiver_id = $3', [table.id, sender.id, receiver.id]);

    } catch (err) {
        console.error('Error during test:', err);
    }
}

testInvite();
