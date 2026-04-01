const db = require('./db');
require('dotenv').config();

async function checkPerms() {
    try {
        const result = await db.query(`
            SELECT ar.name as role, COUNT(arp.permission_id) as perms
            FROM admin_roles ar
            LEFT JOIN admin_role_permissions arp ON ar.id = arp.role_id
            GROUP BY ar.name
        `);
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPerms();
