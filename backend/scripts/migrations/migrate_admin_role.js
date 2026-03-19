const db = require('../../db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('Starting admin role migration...');

    // Add is_verified column
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
          ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        END IF;
      END
      $$;
    `);
    console.log('Added is_verified column');

    // Add is_banned column
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_banned') THEN
          ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
        END IF;
      END
      $$;
    `);
    console.log('Added is_banned column');

    // Update role check constraint
    await db.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
            ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('freelancer', 'client', 'admin'));
        `);
    console.log('Updated role check constraint to include admin');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
