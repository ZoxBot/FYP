const db = require('../../db');
async function run() {
    try {
        console.log("Seeding ticket.delete permission...");
        const res = await db.query(
            `INSERT INTO permissions (slug, description) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`,
            ['ticket.delete', 'Permanently delete archived support tickets']
        );

        const assignToRole = async (roleName, permissionSlug) => {
            const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name = $1`, [roleName]);
            if (roleRes.rows.length === 0) return;
            const roleId = roleRes.rows[0].id;
            const permRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [permissionSlug]);
            const permId = permRes.rows[0].id;
            await db.query(
                `INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [roleId, permId]
            );
        };

        const adminTiers = ['Administrator', 'Higher Admin', 'Admin'];
        for (const tier of adminTiers) {
            await assignToRole(tier, 'ticket.delete');
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
