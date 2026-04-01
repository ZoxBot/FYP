const db = require('./db');
require('dotenv').config();

async function addAdminRole() {
    try {
        console.log("Adding 'Admin' role to database for fallback compatibility...");
        
        // 1. Check if 'Admin' role exists
        const checkRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Admin'");
        if (checkRes.rows.length === 0) {
            // Create it (level 3)
            await db.query(
                "INSERT INTO admin_roles (name, level, description) VALUES ($1, $2, $3)",
                ['Admin', 3, 'Default administrative role for system compatibility.']
            );
            console.log("Role 'Admin' created.");
        } else {
            console.log("Role 'Admin' already exists.");
        }

        // 2. Sync permissions to 'Admin' role
        const adminRoleRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Admin'");
        const adminRoleId = adminRoleRes.rows[0].id;
        const permsRes = await db.query("SELECT id FROM permissions");
        
        for (const perm of permsRes.rows) {
            await db.query(
                "INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [adminRoleId, perm.id]
            );
        }
        
        console.log("Successfully mapped all permissions to 'Admin' for UI visibility.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addAdminRole();
