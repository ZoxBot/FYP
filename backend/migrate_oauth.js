require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');
 
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});
 
async function migrate() {
    try {
        console.log("Adding google_id and facebook_id columns to users table...");
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;');
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
 
migrate();
