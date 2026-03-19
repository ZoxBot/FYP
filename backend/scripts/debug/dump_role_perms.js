const db = require('../../db');
async function run() {
    try {
        const roles = ['Admin', 'Administrator', 'Higher Admin'];
        for (const roleName of roles) {
            const res = await db.query(`
                SELECT p.slug 
                FROM permissions p
                JOIN admin_role_permissions arp ON p.id = arp.permission_id
                JOIN admin_roles ar ON arp.role_id = ar.id
                WHERE ar.name = $1
            `, [roleName]);
            console.log(`Role [${roleName}] Permissions:`, res.rows.map(r => r.slug).sort());
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
