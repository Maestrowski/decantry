const db = require('./db');

async function inspectDb() {
    try {
        console.log('--- Accounts ---');
        const accounts = await db.query('SELECT id, username, email FROM accounts');
        console.log(JSON.stringify(accounts.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectDb();
