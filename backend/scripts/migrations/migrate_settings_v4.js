const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../db');

async function migrate() {
    try {
        console.log("Migrating users table to add advanced settings columns...");

        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
                "email_notifications": true,
                "platform_notifications": true,
                "marketing_emails": false,
                "bid_alerts": true,
                "message_alerts": true
            }',
            ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{
                "khalti_id": "",
                "bank_name": "",
                "account_number": "",
                "account_holder": ""
            }',
            ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
                "profile_visibility": "public",
                "show_online_status": true,
                "show_last_seen": true
            }'
        `);

        console.log("Migration successful: added advanced settings columns.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
