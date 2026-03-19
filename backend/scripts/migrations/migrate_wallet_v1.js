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

    console.log('Creating wallets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Altering payments table for commission tracking...');
    await client.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15, 2) DEFAULT 0.00;
    `);

    // Lazy initialization for existing users
    console.log('Ensuring all existing users have a wallet...');
    await client.query(`
      INSERT INTO wallets (user_id, balance)
      SELECT id, 0.00 FROM users
      ON CONFLICT (user_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Migration successful: Wallet and commission fields added.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
