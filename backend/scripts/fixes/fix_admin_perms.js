const db = require('../../db');
async function run() {
    try {
        console.log("Restoring Admin access and fixing permissions...");

        const assignToRole = async (roleName, permissionSlug) => {
            const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name = $1`, [roleName]);
            if (roleRes.rows.length === 0) return;
            const roleId = roleRes.rows[0].id;
            const permRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [permissionSlug]);
            if (permRes.rows.length === 0) return;
            const permId = permRes.rows[0].id;
            await db.query(
                `INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [roleId, permId]
            );
            console.log(`Assigned ${permissionSlug} to ${roleName}`);
        };

        const adminTiers = ['Admin', 'Higher Admin'];
        const permsToGrant = [
            'user.view',
            'group.view',
            'job.view',
            'rbac.roles.manage',
            'user.verify'
        ];

        for (const tier of adminTiers) {
            for (const perm of permsToGrant) {
                await assignToRole(tier, perm);
            }
        }

        console.log("Permission fix complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
