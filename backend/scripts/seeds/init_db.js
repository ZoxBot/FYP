const db = require('../../db');
const fs = require('fs');
const path = require('path');

async function initDb() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../../schema/database.sql'), 'utf8');
        await db.query(sql);
        console.log("Database initialized successfully");
        process.exit(0);
    } catch (err) {
        console.error("Error initializing database:", err);
        process.exit(1);
    }
}

initDb();
