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

    console.log('Altering jobs table...');
    // Drop existing constraint if it exists (may need to be dynamic or just catch the error if it doesn't exist)
    await client.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;`);
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS selected_freelancer_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2),
      ADD CONSTRAINT jobs_status_check CHECK (status IN ('open', 'pending', 'active', 'completed', 'cancelled', 'rejected', 'pending_payment', 'in_progress', 'awaiting_confirmation'));
    `);

    console.log('Altering bids table...');
    await client.query(`ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;`);
    await client.query(`
      ALTER TABLE bids 
      ADD CONSTRAINT bids_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));
    `);

    console.log('Creating payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES jobs(id),
        client_id INTEGER REFERENCES users(id),
        freelancer_id INTEGER REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released')),
        transaction_id VARCHAR(255),
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
