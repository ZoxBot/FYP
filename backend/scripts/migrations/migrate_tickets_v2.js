const db = require('../../db');
async function migrate() {
    try {
        console.log("Migrating tickets table...");
        await db.query(`
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS claimed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log("Column 'claimed_by' added or already exists.");

        console.log("Seeding new permissions...");
        const insertPerm = async (slug, desc) => {
            const existing = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            if (existing.rows.length > 0) return existing.rows[0].id;
            const res = await db.query(
                `INSERT INTO permissions (slug, description) VALUES ($1, $2) RETURNING id`,
                [slug, desc]
            );
            console.log(`Created permission: ${slug}`);
            return res.rows[0].id;
        };

        const claimId = await insertPerm('ticket.claim', 'Claim Support Tickets');
        const archiveId = await insertPerm('ticket.archive.view', 'View Archived Support Tickets');

        const assignToRole = async (roleName, permissionSlug) => {
            const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name = $1`, [roleName]);
            if (roleRes.rows.length === 0) return;
            const roleId = roleRes.rows[0].id;
            const permRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [permissionSlug]);
            const permId = permRes.rows[0].id;

            await db.query(
                `INSERT INTO admin_role_permissions (role_id, permission_id) 
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [roleId, permId]
            );
            console.log(`Assigned ${permissionSlug} to ${roleName}`);
        };

        const adminTiers = ['Administrator', 'Higher Admin', 'Admin'];
        for (const tier of adminTiers) {
            await assignToRole(tier, 'ticket.claim');
            await assignToRole(tier, 'ticket.archive.view');
        }

        console.log("Migration and Seeding complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}
migrate();
