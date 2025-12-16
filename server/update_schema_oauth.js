const db = require('./db');
require('dotenv').config();

const updateSchema = async () => {
    try {
        // Add google_id column
        await db.query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        `);

        // Make password nullable
        await db.query(`
            ALTER TABLE accounts 
            ALTER COLUMN password DROP NOT NULL;
        `);

        console.log('Schema updated successfully for OAuth');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
};

updateSchema();
