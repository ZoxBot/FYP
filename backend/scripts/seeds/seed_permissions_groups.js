const db = require('../../db');

async function seedPermissions() {
    try {
        console.log("Seeding New Permissions...");

        const insertPerm = async (slug, desc, parentId = null) => {
            // Check if exists first to get ID
            let res = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            if (res.rows.length > 0) return res.rows[0].id;

            // Insert if not exists
            res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [slug, desc, parentId]
            );
            return res.rows[0].id;
        };

        // 1. Group Management Permissions
        const pGroups = await insertPerm('groups', 'Group Management');
        await insertPerm('group.view', 'View Groups', pGroups);
        await insertPerm('group.create', 'Create Groups', pGroups);
        await insertPerm('group.edit', 'Edit Groups', pGroups);
        await insertPerm('group.delete', 'Delete Groups', pGroups);
        await insertPerm('group.assign', 'Assign Groups to Users', pGroups);

        // 2. Permission Management (General)
        // We already have rbac.permissions.manage, but we might want a more generic 'permission.manage' or alias it.
        // Let's stick to using the existing `rbac` parent if possible, or create a new `permission` root.
        // The user request mentioned `permission.manage`. Let's add it under `rbac` or `permissions` group.

        const pRbac = await insertPerm('rbac', 'Role & Permission Management (Super Admin)');
        await insertPerm('permission.manage', 'Manage All Permissions', pRbac);

        // 3. User Role Management
        const pUsers = await insertPerm('user', 'User Management Group');
        await insertPerm('user.change_role', 'Change User Role', pUsers);
        await insertPerm('user.view', 'View Users', pUsers); // Ensure this exists

        console.log("New Permissions Created.");

        // 4. Assign to Administrator Role
        const adminRoleRes = await db.query(`SELECT id FROM admin_roles WHERE name = 'Administrator'`);
        if (adminRoleRes.rows.length > 0) {
            const adminRoleId = adminRoleRes.rows[0].id;
            const newPerms = [
                'groups', 'group.view', 'group.create', 'group.edit', 'group.delete', 'group.assign',
                'permission.manage', 'user.change_role', 'user.view'
            ];

            for (const slug of newPerms) {
                const pRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
                if (pRes.rows.length > 0) {
                    await db.query(
                        `INSERT INTO admin_role_permissions (role_id, permission_id) 
                         VALUES ($1, $2) 
                         ON CONFLICT DO NOTHING`,
                        [adminRoleId, pRes.rows[0].id]
                    );
                }
            }
            console.log("Assigned new permissions to Administrator.");
        }

        console.log("Seeding Complete.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        process.exit();
    }
}

seedPermissions();
