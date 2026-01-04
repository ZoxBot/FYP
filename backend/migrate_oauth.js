const db = require('./db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add google_id column
        await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
          ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
        END IF;
      END
      $$;
    `);
        console.log('Added google_id column');

        // Add facebook_id column
        await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='facebook_id') THEN
          ALTER TABLE users ADD COLUMN facebook_id VARCHAR(255) UNIQUE;
        END IF;
      END
      $$;
    `);
        console.log('Added facebook_id column');

        // Make password_hash nullable
        await db.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `);
        console.log('Made password_hash nullable');

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        // We cannot easily close the pool if it's exported as a pool, but we can exit the process
        process.exit();
    }
}

migrate();
