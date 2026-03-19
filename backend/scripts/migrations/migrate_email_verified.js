const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

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

    console.log('Adding is_email_verified column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
    `);

    await client.query('COMMIT');
    console.log('Migration successful: is_email_verified added.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
