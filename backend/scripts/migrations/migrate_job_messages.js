const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating job_messages table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS job_messages (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query('COMMIT');
        console.log('Migration successful');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
