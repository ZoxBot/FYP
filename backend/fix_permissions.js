const db = require('./db');

async function fixPermissions() {
    console.log("--- Fixing RBAC Permissions ---");

    try {
        // Helper to insert permission
        const insertPerm = async (slug, desc, parentId = null) => {
            const res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (slug) DO NOTHING
                 RETURNING id`,
                [slug, desc, parentId]
            );
            if (res.rows.length > 0) return res.rows[0].id;
            const fetch = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            return fetch.rows[0].id;
        };

        // 1. Get Parent IDs
        const userParentRes = await db.query("SELECT id FROM permissions WHERE slug = 'user'");
        const gigParentRes = await db.query("SELECT id FROM permissions WHERE slug = 'marketplace'");

        if (userParentRes.rows.length === 0 || gigParentRes.rows.length === 0) {
            console.error("❌ Critical: Parent permissions 'user' or 'marketplace' missing.");
            process.exit(1);
        }

        const userParentId = userParentRes.rows[0].id;
        const gigParentId = gigParentRes.rows[0].id;

        // 2. Insert Missing Permissions
        const userViewId = await insertPerm('user.view', 'View Users', userParentId);
        console.log(`✅ user.view added/verified (ID: ${userViewId})`);

        const gigViewId = await insertPerm('gig.view', 'View Gigs', gigParentId);
        console.log(`✅ gig.view added/verified (ID: ${gigViewId})`);

        // 3. Assign to Administrator Role
        const roleRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Administrator'");
        const roleId = roleRes.rows[0].id;

        await db.query(`INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [roleId, userViewId]);
        await db.query(`INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [roleId, gigViewId]);

        console.log("✅ Assigned permissions to Administrator role.");

    } catch (err) {
        console.error("Fix Error:", err);
    } finally {
        process.exit();
    }
}

fixPermissions();
