const db = require('../../db');

async function migrate() {
    try {
        console.log("Adding 'is_deleted_by_user' column to tickets table...");
        await db.query(`
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS is_deleted_by_user BOOLEAN DEFAULT FALSE
        `);
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
