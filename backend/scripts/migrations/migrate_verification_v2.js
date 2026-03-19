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

    console.log('Adding verification columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
    `);

    // Existing users: we can set them as verified or leave them as unverified. 
    // Setting existing users to verified for convenience during development.
    await client.query(`
      UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Migration successful: Verification columns added.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
