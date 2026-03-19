require('dotenv').config({ path: './.env' });
const db = require('../../db');

async function checkUsers() {
    try {
        const users = await db.query("SELECT id, email, role FROM users");
        console.table(users.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
