const db = require('./db');

async function migrateJobs() {
    try {
        console.log('Running Jobs migration...');

        // Create jobs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                budget DECIMAL(10, 2),
                deadline TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'rejected')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Jobs table created or already exists.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateJobs();
