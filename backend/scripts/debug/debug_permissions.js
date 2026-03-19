const db = require('../../db');

async function debugPermissions() {
    console.log("--- Debugging Permissions ---");

    try {
        // 1. Get Administrator Role ID
        const roleRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Administrator'");
        if (roleRes.rows.length === 0) {
            console.log("❌ Administrator role not found");
            return;
        }
        const roleId = roleRes.rows[0].id;
        console.log(`Administrator Role ID: ${roleId}`);

        // 2. Check for 'user.view' permission
        const permRes = await db.query("SELECT id, slug FROM permissions WHERE slug = 'user.view'");
        if (permRes.rows.length === 0) {
            console.log("❌ 'user.view' permission not found in permissions table");
        } else {
            console.log(`'user.view' Permission ID: ${permRes.rows[0].id}`);

            // 3. Check Mapping
            const mapRes = await db.query(
                "SELECT * FROM admin_role_permissions WHERE role_id = $1 AND permission_id = $2",
                [roleId, permRes.rows[0].id]
            );

            if (mapRes.rows.length > 0) {
                console.log("✅ Mapping exists: Administrator -> user.view");
            } else {
                console.log("❌ Mapping MISSING: Administrator DOES NOT have user.view");

                // Check parent 'user' permission
                const parentRes = await db.query("SELECT id FROM permissions WHERE slug = 'user'");
                if (parentRes.rows.length > 0) {
                    const parentMap = await db.query(
                        "SELECT * FROM admin_role_permissions WHERE role_id = $1 AND permission_id = $2",
                        [roleId, parentRes.rows[0].id]
                    );
                    if (parentMap.rows.length > 0) {
                        console.log("✅ Parent Mapping exists: Administrator -> user");
                        console.log("   (This should suffice if inheritance works)");
                    } else {
                        console.log("❌ Parent Mapping MISSING: Administrator DOES NOT have 'user' parent permission either");
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugPermissions();
