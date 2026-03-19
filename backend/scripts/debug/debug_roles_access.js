const db = require('../../db');
async function run() {
    try {
        const u = await db.query('SELECT role FROM users WHERE id = 11');
        console.log('USER_ROLE:', u.rows[0].role);
        const r = await db.query('SELECT name FROM admin_roles');
        console.log('ADMIN_ROLES:', r.rows.map(row => row.name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
