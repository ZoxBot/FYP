const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../db');

async function seedAnalyticsPermissions() {
    try {
        console.log("Seeding Analytics Permissions...");

        const insertPerm = async (slug, desc, parentId = null) => {
            let res = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            if (res.rows.length > 0) return res.rows[0].id;

            res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [slug, desc, parentId]
            );
            return res.rows[0].id;
        };

        // 1. Audit/Analytics Permissions
        const pAudit = await insertPerm('audit', 'System Auditing & Analytics');
        await insertPerm('audit.view', 'View System Analytics & Logs', pAudit);
        
        // 2. Payment View Permission
        const pPayments = await db.query(`SELECT id FROM permissions WHERE slug = 'payment'`);
        const paymentParentId = pPayments.rows[0]?.id || null;
        await insertPerm('payment.view', 'View Payment Records', paymentParentId);

        console.log("Analytics Permissions Created.");

        // 3. Assign to Administrator Role
        const adminRoleRes = await db.query(`SELECT id FROM admin_roles WHERE name = 'Administrator'`);
        if (adminRoleRes.rows.length > 0) {
            const adminRoleId = adminRoleRes.rows[0].id;
            const newPerms = ['audit', 'audit.view', 'payment.view'];

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
            console.log("Assigned analytics permissions to Administrator.");
        }

        console.log("Seeding Complete.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        process.exit();
    }
}

seedAnalyticsPermissions();
