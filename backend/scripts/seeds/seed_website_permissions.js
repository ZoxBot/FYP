const db = require('../../db');
require('dotenv').config();

async function seedWebsitePermissions() {
    try {
        console.log("Seeding Website Permissions...");

        const insertPerm = async (slug, desc, parentId = null) => {
            const existing = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            if (existing.rows.length > 0) return existing.rows[0].id;

            const res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [slug, desc, parentId]
            );
            console.log(`Created permission: ${slug}`);
            return res.rows[0].id;
        };

        // 1. Create Core Website Permissions
        const jobPostId = await insertPerm('job.post', 'Post New Jobs');
        const jobApplyId = await insertPerm('job.apply', 'Apply/Bid for Jobs');
        const profileEditId = await insertPerm('profile.edit', 'Edit Personal Profile');
        const verifySubmitId = await insertPerm('verification.submit', 'Submit Verification Documents');

        // 1.1 Ticket Permissions
        const ticketCreateId = await insertPerm('ticket.create', 'Create Support Tickets');
        const ticketViewOwnId = await insertPerm('ticket.view_own', 'View Own Support Tickets');
        const ticketManageId = await insertPerm('ticket.manage', 'Manage All Support Tickets (Admin)');

        // 2. Assign Defaults to Roles
        console.log("Assigning Defaults to Roles...");

        const assignToRole = async (roleName, permissionSlug) => {
            const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name = $1`, [roleName]);
            if (roleRes.rows.length === 0) return;
            const roleId = roleRes.rows[0].id;

            const permRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [permissionSlug]);
            if (permRes.rows.length === 0) return;
            const permId = permRes.rows[0].id;

            await db.query(
                `INSERT INTO admin_role_permissions (role_id, permission_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT DO NOTHING`,
                [roleId, permId]
            );
            console.log(`Assigned ${permissionSlug} to ${roleName}`);
        };

        // Since the system has Administrator, Higher Admin, Admin
        // And these correspond to 'admin' role in users table.
        // We also need to decide if we use the same system for 'client' and 'freelancer'.
        // The implementation plan says: "Assign defaults to Client/Freelancer role".
        // BUT 'client' and 'freelancer' are values in users.role, not necessarily in admin_roles table.

        // Let's check if 'Client' and 'Freelancer' exist in admin_roles.
        const rolesCheck = await db.query(`SELECT name FROM admin_roles`);
        const existingRoles = rolesCheck.rows.map(r => r.name);
        console.log("Existing Admin Roles:", existingRoles);

        if (!existingRoles.includes('Client')) {
            await db.query(`INSERT INTO admin_roles (name, level, description) VALUES ('Client', 10, 'Standard Client') ON CONFLICT DO NOTHING`);
        }
        if (!existingRoles.includes('Freelancer')) {
            await db.query(`INSERT INTO admin_roles (name, level, description) VALUES ('Freelancer', 10, 'Standard Freelancer') ON CONFLICT DO NOTHING`);
        }

        // Assign
        await assignToRole('Client', 'job.post');
        await assignToRole('Client', 'profile.edit');
        await assignToRole('Client', 'verification.submit');
        await assignToRole('Client', 'ticket.create');
        await assignToRole('Client', 'ticket.view_own');

        await assignToRole('Freelancer', 'job.apply');
        await assignToRole('Freelancer', 'profile.edit');
        await assignToRole('Freelancer', 'verification.submit');
        await assignToRole('Freelancer', 'ticket.create');
        await assignToRole('Freelancer', 'ticket.view_own');

        // All Admin Tiers get everything
        const adminTiers = ['Administrator', 'Higher Admin', 'Admin'];
        for (const tier of adminTiers) {
            await assignToRole(tier, 'job.post');
            await assignToRole(tier, 'job.apply');
            await assignToRole(tier, 'profile.edit');
            await assignToRole(tier, 'verification.submit');
            await assignToRole(tier, 'ticket.create');
            await assignToRole(tier, 'ticket.view_own');
            await assignToRole(tier, 'ticket.manage');
        }

        console.log("Website Permissions Seeded Successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding Failed:", err);
        process.exit(1);
    }
}

seedWebsitePermissions();
