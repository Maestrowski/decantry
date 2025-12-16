const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSchema() {
    try {
        await client.connect();

        // Create table_invites table
        await client.query(`
            CREATE TABLE IF NOT EXISTS table_invites (
                id SERIAL PRIMARY KEY,
                table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES accounts(id),
                receiver_id INTEGER REFERENCES accounts(id),
                status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Schema updated: table_invites table created.");

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
