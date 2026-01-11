const db = require('./db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Starting admin role constraint fix...');

        // Drop existing constraint
        await db.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        `);
        console.log('Dropped existing constraint');

        // Add new constraint including 'admin'
        await db.query(`
            ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('freelancer', 'client', 'admin'));
        `);
        console.log('Added new constraint including admin');

        console.log('Migration fix completed successfully');
    } catch (err) {
        console.error('Migration fix failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
