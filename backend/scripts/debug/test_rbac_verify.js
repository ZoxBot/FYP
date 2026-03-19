const db = require('../../db');
require('dotenv').config();

async function testRbacLogic() {
    console.log("--- Starting RBAC Verification ---");

    try {
        // 1. Get Admin User
        const email = 'admin@example.com';
        const userRes = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userRes.rows.length === 0) {
            console.error("❌ Test Failed: Admin user not found.");
            process.exit(1);
        }
        const user = userRes.rows[0];
        console.log(`✅ User Found: ${user.email} (ID: ${user.id})`);

        // 2. Fetch Assigned Roles
        const roleRes = await db.query(`
            SELECT ar.name 
            FROM admin_user_roles aur 
            JOIN admin_roles ar ON aur.role_id = ar.id
            WHERE aur.user_id = $1
        `, [user.id]);

        if (roleRes.rows.length === 0) {
            console.error("❌ Test Failed: No admin role assigned to user.");
        } else {
            console.log(`✅ Role Assigned: ${roleRes.rows[0].name}`);
        }

        // 3. Test Specific Permission: 'user.ban'
        // This simulates the checkPermission middleware logic
        const requiredPermission = 'user.ban';
        console.log(`Testing Permission Check for: '${requiredPermission}'...`);

        const query = `
            SELECT DISTINCT p.slug, p.id
            FROM permissions p
            LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
            LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id
            LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id
            WHERE (aur.user_id = $1 OR aup.user_id = $1)
        `;

        const result = await db.query(query, [user.id]);
        const userPermissions = result.rows.map(row => row.slug);
        const userPermIds = result.rows.map(row => row.id);

        let hasPermission = false;

        // Exact Match
        if (userPermissions.includes(requiredPermission)) {
            console.log(`✅ Exact match found for '${requiredPermission}'`);
            hasPermission = true;
        } else {
            // Parent Match
            console.log(`No exact match. Checking parents of ${userPermissions.length} assigned permissions...`);

            const parentCheck = await db.query(`
                SELECT id FROM permissions 
                WHERE slug = $1 AND parent_id = ANY($2::int[])
            `, [requiredPermission, userPermIds]);

            if (parentCheck.rows.length > 0) {
                console.log(`✅ Parent permission found. Access GRANTED.`);
                hasPermission = true;
            }
        }

        if (hasPermission) {
            console.log("--- ✅ PASSED: Admin has correct permissions ---");
        } else {
            console.error("--- ❌ FAILED: Admin missing 'user.ban' permission ---");
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        process.exit();
    }
}

testRbacLogic();
