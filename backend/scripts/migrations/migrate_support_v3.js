const db = require('../../db');

async function migrate() {
    try {
        console.log("Starting Advanced Support Migration...");

        // 1. Add columns to tickets table
        await db.query(`
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS has_unread_user BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS has_unread_admin BOOLEAN DEFAULT false
        `);
        console.log("Added unread flags and archive column to tickets table.");

        // 2. Create ticket_attachments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id SERIAL PRIMARY KEY,
                ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
                message_id INT REFERENCES ticket_messages(id) ON DELETE CASCADE,
                file_path TEXT NOT NULL,
                file_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created ticket_attachments table.");

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
