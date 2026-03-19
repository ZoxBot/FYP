const db = require('../../db');

async function grantPerm() {
    try {
        // 1. Ensure permission exists
        const permResult = await db.query("INSERT INTO permissions (slug, description) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description RETURNING id",
            ['ticket.archive.view', 'Allows viewing of archived support tickets']);
        const permId = permResult.rows[0].id;
        console.log('Permission ID:', permId);

        // 2. Assign to Admin role (slug corresponds to 'name' in admin_roles, or just search by name)
        const roleResult = await db.query("SELECT id FROM admin_roles WHERE name = 'Admin'");
        if (roleResult.rows.length > 0) {
            const roleId = roleResult.rows[0].id;
            await db.query("INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleId, permId]);
            console.log('Assigned to Admin role.');
        }

        // 3. Assign to Higher Admin role
        const higherRoleResult = await db.query("SELECT id FROM admin_roles WHERE name = 'Higher Admin'");
        if (higherRoleResult.rows.length > 0) {
            const roleId = higherRoleResult.rows[0].id;
            await db.query("INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleId, permId]);
            console.log('Assigned to Higher Admin role.');
        }

        // 4. Assign to Super Admin (Administrator)
        const superRoleResult = await db.query("SELECT id FROM admin_roles WHERE name = 'Administrator'");
        if (superRoleResult.rows.length > 0) {
            const roleId = superRoleResult.rows[0].id;
            await db.query("INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleId, permId]);
            console.log('Assigned to Administrator role.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit();
    }
}

grantPerm();
