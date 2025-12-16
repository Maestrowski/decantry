const db = require('./db');

async function updateSchema() {
    try {
        console.log('Updating game_tables schema...');

        // Create table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS game_tables (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(100),
                is_private BOOLEAN DEFAULT FALSE,
                host_id INTEGER REFERENCES accounts(id),
                mode VARCHAR(50) DEFAULT 'Casual',
                max_players INTEGER DEFAULT 4,
                status VARCHAR(20) DEFAULT 'waiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create table_members if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS table_members (
                table_id INTEGER REFERENCES game_tables(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                is_ready BOOLEAN DEFAULT FALSE,
                session_points INTEGER DEFAULT 0,
                PRIMARY KEY (table_id, account_id)
            );
        `);

        // Now try to add columns if they were missing (for existing tables)
        const columns = ['mode', 'max_players', 'status'];
        const defaults = ["'Casual'", '4', "'waiting'"];
        const types = ['VARCHAR(50)', 'INTEGER', 'VARCHAR(20)'];

        for (let i = 0; i < columns.length; i++) {
            await db.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_tables' AND column_name='${columns[i]}') THEN 
                        ALTER TABLE game_tables ADD COLUMN ${columns[i]} ${types[i]} DEFAULT ${defaults[i]}; 
                    END IF; 
                END $$;
            `);
        }

        // Update table_members columns
        const memberColumns = ['is_ready', 'session_points'];
        const memberDefaults = ['FALSE', '0'];
        const memberTypes = ['BOOLEAN', 'INTEGER'];

        for (let i = 0; i < memberColumns.length; i++) {
            await db.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='table_members' AND column_name='${memberColumns[i]}') THEN 
                        ALTER TABLE table_members ADD COLUMN ${memberColumns[i]} ${memberTypes[i]} DEFAULT ${memberDefaults[i]}; 
                    END IF; 
                END $$;
            `);
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
