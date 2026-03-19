const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../db');

async function migrate() {
    try {
        console.log("Migrating database to add reviews table...");

        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
                reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                reviewee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(job_id, reviewer_id) -- Prevent duplicate reviews for the same job by the same person
            );
        `);

        console.log("Migration successful: Added reviews table.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
