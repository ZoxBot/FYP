const db = require('./db');
require('dotenv').config();

async function checkUsers() {
    try {
        const result = await db.query("SELECT id, first_name, email, role FROM users WHERE role = 'admin'");
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
