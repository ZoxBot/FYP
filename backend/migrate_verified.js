require('dotenv').config();
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
        console.log("Using DB:", process.env.DB_NAME);
        console.log("Adding is_verified column to users table...");
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;');
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
 
migrate();
