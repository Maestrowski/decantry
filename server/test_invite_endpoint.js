const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const db = require('./db');

async function testEndpoint() {
    try {
        // 1. Create a token for a user (e.g. ID 1)
        const token = jwt.sign({ id: 1, username: 'Maestrowski' }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token:', token);

        // 2. Define payload
        const payload = {
            tableId: 23,
            username: 'MaestroV2'
        };

        // 3. Send request
        const response = await fetch('http://localhost:3000/api/lobby/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);

    } catch (err) {
        console.error('Error:', err);
    }
}

testEndpoint();
