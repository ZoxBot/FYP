const db = require('./db');

async function migrate() {
    try {
        console.log("Migrating users table to add profile fields...");

        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
            ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'
        `);

        console.log("Migration successful: added bio, avatar_url, and skills to users table.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
