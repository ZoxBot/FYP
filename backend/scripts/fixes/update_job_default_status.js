const db = require('../../db');

async function updateDefaultStatus() {
    try {
        console.log("Updating default status for jobs table to 'active'...");
        await db.query(`
            ALTER TABLE jobs 
            ALTER COLUMN status SET DEFAULT 'active'
        `);
        console.log("Database default updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Failed to update database default:", err);
        process.exit(1);
    }
}

updateDefaultStatus();
