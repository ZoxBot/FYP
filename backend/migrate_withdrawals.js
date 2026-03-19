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
        console.log("Creating withdrawals table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                amount DECIMAL(12, 2) NOT NULL,
                method VARCHAR(50) NOT NULL,
                method_details JSONB NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP WITH TIME ZONE
            );
        `);
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
 
migrate();
