const db = require('../../db');

async function migratePerformanceIndexes() {
    try {
        console.log('Starting performance index migration...');

        // Users
        console.log('Indexing users table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);`).catch(() => console.log('pg_trgm extension might be missing, skipping trigram index for email'));
        
        // Jobs
        console.log('Indexing jobs table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);`).catch(() => console.log('pg_trgm extension might be missing, skipping trigram index for title'));

        // Payments
        console.log('Indexing payments table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`);

        // Verification Requests
        console.log('Indexing verification_requests table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_vr_status ON verification_requests(status);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_vr_created_at ON verification_requests(created_at);`);

        // Withdrawals
        console.log('Indexing withdrawals table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_w_status ON withdrawals(status);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_w_created_at ON withdrawals(created_at);`);

        // Audit Logs
        console.log('Indexing audit_logs table...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);

        console.log('Performance index migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

// Optional: Enable pg_trgm for faster search if superuser
db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;').then(() => {
    migratePerformanceIndexes();
}).catch(err => {
    console.log('Could not enable pg_trgm, continuing with regular indexes...');
    migratePerformanceIndexes();
});
