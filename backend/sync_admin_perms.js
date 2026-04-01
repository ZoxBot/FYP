const db = require('./db');
require('dotenv').config();

async function grantAllToAdmin() {
    try {
        console.log("Granting all permissions to standard 'Admin' and 'Higher Admin' roles...");
        
        // 1. Get role IDs
        const rolesRes = await db.query("SELECT id FROM admin_roles WHERE name IN ('Administrator', 'Full Admin', 'Standard Admin')");
        const roleIds = rolesRes.rows.map(r => r.id);
        
        if (roleIds.length === 0) {
            console.log("Roles not found. Have you run init_rbac.js?");
            return;
        }

        // 2. Get all permissions
        const permsRes = await db.query("SELECT id FROM permissions");
        const permIds = permsRes.rows.map(p => p.id);

        // 3. Insert relationships
        for (const roleId of roleIds) {
            for (const permId of permIds) {
                await db.query(
                    "INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [roleId, permId]
                );
            }
        }
        
        console.log("Permissions successfully synced across admin hierarchy.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

grantAllToAdmin();
