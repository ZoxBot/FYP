const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Ensure it reads from backend root

const pool = new Pool({
  user: process.env.DB_USER || 'root',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Altering jobs table to add submission fields...');
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS submission_message TEXT,
      ADD COLUMN IF NOT EXISTS submission_attachment_url VARCHAR(255);
    `);

    await client.query('COMMIT');
    console.log('Migration successful: submission fields added to jobs table.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
