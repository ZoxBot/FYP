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

    console.log('Updating job status constraint...');
    await client.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;`);
    await client.query(`
      ALTER TABLE jobs 
      ADD CONSTRAINT jobs_status_check CHECK (status IN ('open', 'pending', 'active', 'completed', 'cancelled', 'rejected', 'pending_payment', 'in_progress', 'awaiting_confirmation', 'disputed'));
    `);

    console.log('Creating disputes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        initiator_id INTEGER REFERENCES users(id),
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'cancelled')),
        resolution VARCHAR(50) CHECK (resolution IN ('refunded', 'released_to_freelancer', 'cancelled')),
        admin_notes TEXT,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add resolution to payments status as well
    await client.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;`);
    await client.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'held', 'released', 'refunded'));
    `);

    await client.query('COMMIT');
    console.log('Migration successful: Disputes table created and constraints updated.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
