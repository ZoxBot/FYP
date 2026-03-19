const db = require('../../db');

async function migrateIndexes() {
    try {
        console.log('Starting index migration...');

        // bids indexes
        console.log('Adding indexes to bids table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bids_job_id ON bids(job_id);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bids_freelancer_id ON bids(freelancer_id);`);

        // payments indexes
        console.log('Adding indexes to payments table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_freelancer_id ON payments(freelancer_id);`);

        console.log('Index migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateIndexes();
