const db = require('./db');
require('dotenv').config();

async function checkRoles() {
    try {
        const result = await db.query('SELECT * FROM admin_roles');
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRoles();
