const db = require('../../db');

async function migrateTaskFlow() {
    try {
        console.log('Running Task Flow migration...');

        // 1. Modify jobs table
        // Add new columns
        await db.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS selected_freelancer_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2);
        `);

        // Update status values and constraint
        // First, drop old constraints to allow new values
        await db.query("ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check");
        await db.query("ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check");

        // Rename legacy statuses to new ones
        await db.query("UPDATE jobs SET status = 'open' WHERE status = 'pending'");
        await db.query("UPDATE jobs SET status = 'in_progress' WHERE status = 'active'");
        await db.query("UPDATE jobs SET status = 'cancelled' WHERE status = 'rejected'");

        // Add new status constraint for jobs
        await db.query(`
            ALTER TABLE jobs 
            ADD CONSTRAINT jobs_status_check 
            CHECK (status IN ('open', 'pending_payment', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'))
        `);

        // Add new status constraint for bids
        await db.query(`
            ALTER TABLE bids 
            ADD CONSTRAINT bids_status_check 
            CHECK (status IN ('pending', 'accepted', 'rejected'))
        `);

        // 3. Create payments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
                client_id INTEGER REFERENCES users(id),
                freelancer_id INTEGER REFERENCES users(id),
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released')),
                transaction_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateTaskFlow();
