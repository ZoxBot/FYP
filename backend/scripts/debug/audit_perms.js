require('dotenv').config({ path: './.env' });
const db = require('../../db');

async function auditPerms() {
    try {
        console.log("--- All Permissions ---");
        const perms = await db.query("SELECT id, slug, description FROM permissions ORDER BY slug");
        console.table(perms.rows);
        console.log(`Total Permissions: ${perms.rows.length}`);

        console.log("\n--- 'Administrator' Role Permissions ---");
        const adminPerms = await db.query(`
            SELECT p.slug 
            FROM permissions p
            JOIN admin_role_permissions arp ON p.id = arp.permission_id
            JOIN admin_roles ar ON arp.role_id = ar.id
            WHERE ar.name = 'Administrator'
        `);
        console.table(adminPerms.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

auditPerms();
