const db = require('../../db');
async function debug() {
    try {
        console.log("\n--- Role Permissions Map for Ticket Permissions ---");
        const mapping = await db.query(`
            SELECT ar.name as role, p.slug as permission 
            FROM admin_role_permissions arp
            JOIN admin_roles ar ON arp.role_id = ar.id
            JOIN permissions p ON arp.permission_id = p.id
            WHERE p.slug LIKE 'ticket%'
        `);
        console.table(mapping.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
