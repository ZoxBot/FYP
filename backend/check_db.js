const db = require('./db');

async function checkDb() {
    try {
        console.log('Checking database...');

        // List tables
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        // Check users
        const users = await db.query('SELECT COUNT(*) FROM users');
        console.log('Users count:', users.rows[0].count);

        // Check jobs
        try {
            const jobs = await db.query('SELECT COUNT(*) FROM jobs');
            console.log('Jobs count:', jobs.rows[0].count);

            const jobRows = await db.query('SELECT * FROM jobs LIMIT 1');
            console.log('Sample job:', jobRows.rows[0]);
        } catch (e) {
            console.error('Error querying jobs:', e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkDb();
