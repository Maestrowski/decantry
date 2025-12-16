const fs = require('fs');
const path = require('path');
const db = require('./db');

const dataDir = path.join(__dirname, '..', 'data');

async function seed() {
    try {
        console.log('Starting seed process...');

        // Create table if not exists (just in case)
        await db.query(`
            CREATE TABLE IF NOT EXISTS country_facts (
                id SERIAL PRIMARY KEY,
                country_name VARCHAR(100) NOT NULL,
                fact_content TEXT NOT NULL,
                fact_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if data already exists
        const countResult = await db.query('SELECT COUNT(*) FROM country_facts');
        if (parseInt(countResult.rows[0].count) > 0) {
            console.log('Data already exists. Clearing table...');
            await db.query('TRUNCATE TABLE country_facts RESTART IDENTITY');
        }

        const files = fs.readdirSync(dataDir).filter(f => f.startsWith('batch') && f.endsWith('.csv'));

        for (const file of files) {
            console.log(`Processing ${file}...`);
            const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
            const lines = content.split(/\r?\n/);

            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) continue;

                // Simple CSV parser for "val","val","val" format
                // Remove leading " and trailing "
                const cleanLine = line.substring(1, line.length - 1);
                // Split by ","
                const parts = cleanLine.split('","');

                if (parts.length >= 4) {
                    // id is parts[0], but we use SERIAL
                    const country = parts[1];
                    const factNumber = parseInt(parts[2]);
                    // Fact might contain "," so we need to handle if split broke it, but 
                    // with "," separator it should be safer unless fact contains exactly ","
                    // The fact is the last part(s). 
                    // Actually, if fact contains "," it will be split. 
                    // Let's re-assemble if parts > 4
                    let fact = parts.slice(3).join('","');

                    // Unescape double quotes
                    fact = fact.replace(/""/g, '"');

                    await db.query(
                        'INSERT INTO country_facts (country_name, fact_number, fact_content) VALUES ($1, $2, $3)',
                        [country, factNumber, fact]
                    );
                }
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
