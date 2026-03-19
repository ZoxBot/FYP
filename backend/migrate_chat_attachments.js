const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration: adding attachment fields to job_messages');
        
        await db.query(`
            ALTER TABLE job_messages 
            ADD COLUMN IF NOT EXISTS attachment_url TEXT,
            ADD COLUMN IF NOT EXISTS attachment_type TEXT;
        `);
        
        console.log('Migration successful: job_messages updated');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
