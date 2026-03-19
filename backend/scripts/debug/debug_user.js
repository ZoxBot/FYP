const db = require('../../db');
async function debug() {
    try {
        const user = await db.query("SELECT id, email, role FROM users WHERE email = 'superadmin@kaamkokura.com'");
        console.table(user.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
