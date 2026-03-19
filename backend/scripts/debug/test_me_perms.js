const db = require('../../db');
async function test() {
    const userId = 11;
    const userRole = 'admin';
    const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);

    const query = `
        SELECT DISTINCT p.slug 
        FROM permissions p
        LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
        LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id AND aur.user_id = $1
        LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id AND aup.user_id = $1
        LEFT JOIN admin_roles ar ON arp.role_id = ar.id
        LEFT JOIN admin_group_permissions agp ON p.id = agp.permission_id
        LEFT JOIN admin_user_groups aug ON agp.group_id = aug.group_id AND aug.user_id = $1
        WHERE (aur.user_id IS NOT NULL 
           OR aup.user_id IS NOT NULL 
           OR aug.user_id IS NOT NULL
           OR ar.name = $2)
    `;

    try {
        const result = await db.query(query, [userId, roleName]);
        const slugs = result.rows.map(r => r.slug);
        console.log('PERMISSIONS:', slugs);
        console.log('HAS user.view?', slugs.includes('user.view'));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
