const db = require('../../db');

async function migrateDatabase() {
    try {
        console.log('Starting migration...');

        // 1. Update jobs table (add selected_freelancer_id, final_price, update status ENUM)
        console.log('Updating jobs table...');

        // Add selected_freelancer_id if not exists
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='selected_freelancer_id') THEN
                    ALTER TABLE jobs ADD COLUMN selected_freelancer_id INTEGER REFERENCES users(id);
                END IF;
            END
            $$;
        `);

        // Add final_price if not exists
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='final_price') THEN
                    ALTER TABLE jobs ADD COLUMN final_price DECIMAL(10, 2);
                END IF;
            END
            $$;
        `);

        // Update jobs status check constraint
        // First drop the old constraint if it exists
        try {
            await db.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;`);
        } catch (e) { console.log('constraint might not exist or dropped', e) }

        // Add the new constraint with all required statuses
        await db.query(`
           ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('open', 'pending_payment', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled', 'pending', 'active', 'rejected'));
        `);

        // Update existing 'pending' and 'active' jobs to 'open' to match new flow if desired, but user said "dont create new id or modify if we have a;ready that", so we will just support the new ones alongside or update default. Let's update default.
        await db.query(`ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'open';`);

        // 2. Update bids table (Ensure status ENUM)
        console.log('Updating bids table...');
        try {
            await db.query(`ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;`);
        } catch (e) { console.log('constraint might not exist or dropped', e) }

        await db.query(`
           ALTER TABLE bids ADD CONSTRAINT bids_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));
        `);

        // 3. Create payments table
        console.log('Creating payments table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
                client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released')),
                transaction_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateDatabase();
