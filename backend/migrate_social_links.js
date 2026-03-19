const db = require('./db');

async function migrate() {
    try {
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS github_url TEXT,
            ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
            ADD COLUMN IF NOT EXISTS dribbble_url TEXT,
            ADD COLUMN IF NOT EXISTS website_url TEXT
        `);
        console.log("✅ Social link columns added successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
